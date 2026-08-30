import { TripType } from "../types";

/**
 * 出張報告書の基本設定
 *
 * 【出張旅費規程】
 * ・交通費・宿泊料: 実費精算
 * ・日当（国内）: 日帰り 4,000円 / 1泊以上 7,500円/日
 * ・日当（海外）: 日帰り 8,000円 / 1泊以上 15,000円/日
 */
export const businessTripConfig = {
  companyName: "株式会社サンプル",
  reporterName: "山田 太郎",
  defaultTripType: "domestic" as TripType, // デフォルトの出張種別 ("domestic" | "overseas")
  // 旅費日当額を固定指定したい場合は数値を設定（未設定の場合は旅費規程・日程パターンに基づき自動計算されます）
  // dailyAllowance: "7500",
  // メールに出張目的・内容の記載がない場合、AI がこの文言を自動記入します。
  defaultPurpose: "システム開発・技術調査",
  defaultDetails: "行先宿泊施設にて開発作業・技術調査を実施。",
};

