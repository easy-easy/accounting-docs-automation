import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as readline from "readline";
import { ExtractedTripData, BusinessTripData } from "../types";
import { businessTripConfig } from "./config";
import { downloadBusinessTrip } from "./download";
import { resolveDailyAllowance, ALLOWANCE_PATTERNS, determineAllowancePattern } from "./regulations";

const client = new Anthropic();

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

async function readStdin(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin });
  const lines: string[] = [];
  for await (const line of rl) lines.push(line);
  return lines.join("\n");
}

function validateExtractedTripData(data: ExtractedTripData): void {
  const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!data.departureDate || !dateRegex.test(data.departureDate)) {
    throw new Error(`出発日の形式が不正です: "${data.departureDate}" (YYYY/MM/DD 形式が必要です)`);
  }
  if (!data.returnDate || !dateRegex.test(data.returnDate)) {
    throw new Error(`帰宅日の形式が不正です: "${data.returnDate}" (YYYY/MM/DD 形式が必要です)`);
  }
  if (!data.destination?.trim()) {
    throw new Error("行先が空です");
  }
  if (!data.purpose?.trim()) {
    throw new Error("目的が空です");
  }
  const dep = new Date(data.departureDate.replace(/\//g, "-"));
  const ret = new Date(data.returnDate.replace(/\//g, "-"));
  if (ret < dep) {
    throw new Error(`帰宅日 (${data.returnDate}) が出発日 (${data.departureDate}) より前です`);
  }
}

async function extractTripData(emailContent: string): Promise<ExtractedTripData> {
  console.log("Claude でメールを解析中...");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: `あなたは新幹線・航空機・ホテルなどの出張予約確認メールから、出張報告書に必要な情報を抽出するアシスタントです。

【日付フォーマット】YYYY/MM/DD 形式で返してください（例: 2026/06/10）

【出張種別 (tripType)】行先や交通機関から「domestic」（国内出張）または「overseas」（海外出張）を判定してください。

【行先】新幹線の目的駅や宿泊地の都市名・国名（例: 大阪府大阪市、東京都千代田区、アメリカ・サンフランシスコ）

【目的】メールから明記または合理的に推測できる場合は記載してください。記載・推測ができない場合は、設定された既定の目的「${businessTripConfig.defaultPurpose}」をそのまま設定してください。

【詳細】予約番号・交通手段（新幹線〇号車、フライト便名など）・宿泊先名などの主要情報を簡潔にまとめてください。出張内容に関する記載がない場合は、設定された既定の内容「${businessTripConfig.defaultDetails}」をそのまま設定してください。

複数のメールが含まれる場合は全体を通じて整合的な出張情報として抽出してください。`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `以下のメール内容から出張報告書の項目を抽出してください:\n\n${emailContent}`,
      },
    ],
    tools: [
      {
        name: "submit_trip_data",
        description: "出張報告書に必要なデータを構造化して返す",
        input_schema: {
          type: "object" as const,
          properties: {
            departureDate: {
              type: "string",
              description: "出張出発日 YYYY/MM/DD形式",
            },
            returnDate: {
              type: "string",
              description: "出張帰宅日 YYYY/MM/DD形式",
            },
            tripType: {
              type: "string",
              enum: ["domestic", "overseas"],
              description: "出張種別: domestic (国内) または overseas (海外)",
            },
            destination: {
              type: "string",
              description: "出張の行先（例: 大阪府大阪市、アメリカ・サンフランシスコ）",
            },
            purpose: {
              type: "string",
              description: "出張の目的（例: 取引先との商談）",
            },
            details: {
              type: "string",
              description:
                "出張の内容・詳細（予約番号、交通手段、宿泊先など）",
            },
          },
          required: ["departureDate", "returnDate", "destination", "purpose"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_trip_data" },
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude からの抽出結果が取得できませんでした");
  }

  const extracted = toolUse.input as ExtractedTripData;
  extracted.purpose = extracted.purpose?.trim() || businessTripConfig.defaultPurpose;
  extracted.details = extracted.details?.trim() || businessTripConfig.defaultDetails;
  validateExtractedTripData(extracted);

  const pattern = determineAllowancePattern(
    extracted.tripType ?? "domestic",
    extracted.departureDate,
    extracted.returnDate
  );
  const patternInfo = ALLOWANCE_PATTERNS[pattern];

  console.log("\n--- 抽出結果 ---");
  console.log(`  出発日    : ${extracted.departureDate}`);
  console.log(`  帰宅日    : ${extracted.returnDate}`);
  console.log(`  出張区分  : ${extracted.tripType === "overseas" ? "海外" : "国内"}`);
  console.log(`  日当規程  : ${patternInfo.label}（${patternInfo.amount.toLocaleString()}円/日）`);
  console.log(`  行先      : ${extracted.destination}`);
  console.log(`  目的      : ${extracted.purpose}`);
  if (extracted.details) console.log(`  詳細      : ${extracted.details}`);
  console.log("----------------\n");

  return extracted;
}

async function main() {
  const args = process.argv.slice(2);
  let emailContent: string;

  if (args[0]) {
    if (!fs.existsSync(args[0])) {
      console.error(`ファイルが見つかりません: ${args[0]}`);
      process.exit(1);
    }
    emailContent = fs.readFileSync(args[0], "utf-8");
    console.log(`メールファイルを読み込みました: ${args[0]}\n`);
  } else {
    console.log("メール内容を貼り付けて Ctrl+D で確定してください...\n");
    emailContent = await readStdin();
  }

  if (!emailContent.trim()) {
    console.error("メール内容が空です");
    process.exit(1);
  }

  const extracted = await extractTripData(emailContent);

  const tripType = extracted.tripType ?? (businessTripConfig as any).defaultTripType ?? "domestic";
  const dailyAllowance = resolveDailyAllowance({
    dailyAllowance: (businessTripConfig as any).dailyAllowance,
    tripType,
    departureDate: extracted.departureDate,
    returnDate: extracted.returnDate,
  });

  const tripData: BusinessTripData = {
    reportDate: formatDate(new Date()),
    companyName: businessTripConfig.companyName,
    reporterName: businessTripConfig.reporterName,
    tripType,
    dailyAllowance,
    ...extracted,
  };

  await downloadBusinessTrip(tripData);
}

main().catch((err) => {
  console.error("エラー:", err.message ?? err);
  process.exit(1);
});
