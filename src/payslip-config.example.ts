import { PayslipData } from "./types";

const now = new Date();
const paymentMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;

export const payslipData: PayslipData = {
  // 基本設定
  companyName: "株式会社サンプル",
  employeeName: "山田 太郎",
  paymentMonth, // 実行時の当月が自動でセットされる

  // 勤怠項目（不要なら省略可）
  workingDays: "20",
  workingHours: "16000",  // 160時間00分
  overtimeHours: "1000",  // 10時間00分

  // 支給項目
  basicSalary: "300000",
  commuteAllowance: "15000",

  // カスタム支給項目（最大4件、不要なら省略）
  customAllowances: [
    { name: "役職手当", amount: "20000" },
  ],

  // 控除項目（固定ラベル）
  healthInsurance: "14500",
  welfarePension:  "27450",
  employmentInsurance: "900",
  incomeTax:  "8000",
  residentTax: "12000",

  // カスタム控除項目（上の5項目に続く追加枠、最大3件）
  // customDeductions: [
  //   { name: "子ども・子育て支援金", amount: "678" },
  // ],

  notes: "備考欄",
};
