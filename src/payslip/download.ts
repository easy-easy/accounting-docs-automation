import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { PayslipData } from "../types";
import { payslipData } from "./config";

async function downloadPayslip(data: PayslipData): Promise<string> {
  const downloadDir = path.resolve(__dirname, "../../downloads");
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
      "https://keiei-support-plus-a.com/kyuuyo-pippa/kyuyomeisai-template/",
      { waitUntil: "networkidle", timeout: 30000 }
    );
    await page.waitForFunction(
      () => typeof (window as any).jspdf !== "undefined" && typeof (window as any).html2canvas !== "undefined",
      { timeout: 15000 }
    );

    console.log("フォームに入力しています...");

    // 基本設定
    await page.fill("#data_1", data.companyName);
    await page.fill("#data_2", data.employeeName);
    // datepicker は JS で直接セットして change イベントを発火
    await page.evaluate((val: string) => {
      const el = document.querySelector<HTMLInputElement>("#data_3");
      if (!el) throw new Error("#data_3 (給与支給月) が見つかりません");
      el.value = val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, data.paymentMonth);

    // 勤怠項目
    if (data.workingDays)   await page.fill("#data_4", data.workingDays);
    if (data.workingHours)  await page.fill("#data_5", data.workingHours);
    if (data.overtimeHours) await page.fill("#data_6", data.overtimeHours);

    // 支給項目: 基本給
    await page.fill("#data_7", data.basicSalary);

    // カスタム支給項目 (item_1/data_8 〜 item_4/data_11)
    const customAllowanceFields: Array<[string, string]> = [
      ["item_1", "data_8"],
      ["item_2", "data_9"],
      ["item_3", "data_10"],
      ["item_4", "data_11"],
    ];
    for (let i = 0; i < (data.customAllowances?.length ?? 0) && i < customAllowanceFields.length; i++) {
      const [itemId, dataId] = customAllowanceFields[i];
      await page.fill(`#${itemId}`, data.customAllowances![i].name);
      await page.fill(`#${dataId}`, data.customAllowances![i].amount);
    }

    // 非課税通勤費
    if (data.commuteAllowance) await page.fill("#data_12", data.commuteAllowance);

    // 控除項目（固定ラベル: data_13〜17）
    if (data.healthInsurance)     await page.fill("#data_13", data.healthInsurance);
    if (data.welfarePension)      await page.fill("#data_14", data.welfarePension);
    if (data.employmentInsurance) await page.fill("#data_15", data.employmentInsurance);
    if (data.incomeTax)           await page.fill("#data_16", data.incomeTax);
    if (data.residentTax)         await page.fill("#data_17", data.residentTax);

    // カスタム控除項目（追加枠: item_5〜7 / data_18〜20）
    const customDeductionFields: Array<[string, string]> = [
      ["item_5", "data_18"],
      ["item_6", "data_19"],
      ["item_7", "data_20"],
    ];
    for (let i = 0; i < (data.customDeductions?.length ?? 0) && i < customDeductionFields.length; i++) {
      const [itemId, dataId] = customDeductionFields[i];
      if (data.customDeductions![i].name)   await page.fill(`#${itemId}`, data.customDeductions![i].name);
      if (data.customDeductions![i].amount) await page.fill(`#${dataId}`, data.customDeductions![i].amount);
    }

    // 備考
    if (data.notes) await page.fill("#note", data.notes);

    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);

    console.log("PDFを生成しています...");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.click(".savePdfBut"),
    ]);

    const rawName = download.suggestedFilename() || "給与明細書.pdf";
    const safeName = path.basename(rawName).replace(/[/\\:*?"<>|]/g, "_");
    const savePath = path.join(downloadDir, safeName);
    await download.saveAs(savePath);
    console.log(`\n✅ PDF を保存しました: ${savePath}`);
    return savePath;

  } finally {
    await browser.close();
  }
}

downloadPayslip(payslipData).catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
