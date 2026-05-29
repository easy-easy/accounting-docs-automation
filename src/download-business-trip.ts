import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { BusinessTripData } from "./types";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export async function downloadBusinessTrip(data: BusinessTripData): Promise<string> {
  const reportDate = data.reportDate ?? formatDate(new Date());
  const downloadDir = path.resolve(__dirname, "../downloads");
  fs.mkdirSync(downloadDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    locale: "ja-JP",
  });
  const page = await context.newPage();

  try {
    console.log("ページを開いています...");
    await page.goto(
      "https://keiei-support-plus-a.com/zeirishi-hiyou/shucchou-houkokusho-template/",
      { waitUntil: "networkidle", timeout: 30000 }
    );
    await page.waitForFunction(() => typeof (window as any).jspdf !== "undefined", {
      timeout: 15000,
    });

    console.log("フォームに入力しています...");

    // 報告日（datepicker）
    await page.evaluate((val: string) => {
      const el = document.querySelector<HTMLInputElement>("#data_1");
      if (el) { el.value = val; el.dispatchEvent(new Event("change", { bubbles: true })); }
    }, reportDate);

    // 会社名・氏名
    await page.fill("#data_2", data.companyName);
    await page.fill("#data_3", data.reporterName);

    // 出発日・帰宅日をセットしてから change を発火 → data_6（日数）と data_8（合計）が自動計算される
    await page.evaluate((dep: string) => {
      const el = document.querySelector<HTMLInputElement>("#data_4");
      if (el) el.value = dep;
    }, data.departureDate);
    await page.evaluate((ret: string) => {
      const el = document.querySelector<HTMLInputElement>("#data_5");
      if (el) el.value = ret;
    }, data.returnDate);

    // 旅費日当額をセット（あれば）
    if (data.dailyAllowance) {
      await page.fill("#data_7", data.dailyAllowance);
    }

    // data_5 の change を発火 → 日数と旅費合計が計算される
    await page.evaluate(() => {
      (window as any).$("#data_5").trigger("change");
    });

    // 行先・目的・詳細
    await page.fill("#data_9",  data.destination);
    await page.fill("#data_10", data.purpose);
    if (data.details) await page.fill("#data_11", data.details);

    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);

    console.log("PDFを生成しています...");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.click("#exportPdf"),
    ]);

    const suggestedFilename = download.suggestedFilename();
    const savePath = path.join(downloadDir, suggestedFilename || "出張報告書.pdf");
    await download.saveAs(savePath);
    console.log(`\n✅ PDF を保存しました: ${savePath}`);
    return savePath;

  } finally {
    await browser.close();
  }
}
