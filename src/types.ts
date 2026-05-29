// ===== 給与明細書 =====

export interface PayslipData {
  // 基本設定
  companyName: string;   // 会社名
  employeeName: string;  // 氏名
  paymentMonth: string;  // 給与支給月 e.g. "2026年5月"

  // 勤怠項目
  workingDays?: string;   // 労働日数
  workingHours?: string;  // 労働時間: 176時間30分 → "17630"
  overtimeHours?: string; // 残業時間: 10時間45分 → "1045"

  // 支給項目
  basicSalary: string;        // 基本給
  commuteAllowance?: string;  // 非課税通勤費

  // カスタム支給項目（最大4件）
  customAllowances?: Array<{ name: string; amount: string }>;

  // 控除項目（固定ラベル）
  healthInsurance?: string;      // 健康保険
  welfarePension?: string;       // 厚生年金
  employmentInsurance?: string;  // 雇用保険
  incomeTax?: string;            // 所得税
  residentTax?: string;          // 住民税

  // カスタム控除項目（最大3件 — 上の5項目に続く追加枠）
  customDeductions?: Array<{ name: string; amount: string }>;

  // 備考
  notes?: string;
}

// ===== 出張報告書 =====

export interface BusinessTripData {
  reportDate?: string;      // 報告日 YYYY/MM/DD（省略時は実行当日）
  companyName: string;      // 会社名
  reporterName: string;     // 氏名
  departureDate: string;    // 出張出発日 YYYY/MM/DD
  returnDate: string;       // 出張帰宅日 YYYY/MM/DD
  dailyAllowance?: string;  // 旅費日当額（例: "5000"）
  destination: string;      // 出張の行先
  purpose: string;          // 出張の目的
  details?: string;         // 出張の内容（詳細）
}

// Claude API による抽出結果（固定フィールドを除いた部分）
export type ExtractedTripData = Pick<
  BusinessTripData,
  'departureDate' | 'returnDate' | 'destination' | 'purpose' | 'details'
>;
