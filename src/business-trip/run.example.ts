import { BusinessTripData } from "../types";
import { businessTripConfig } from "./config";
import { downloadBusinessTrip } from "./download";

/**
 * 手動入力用の出張データ
 *
 * 【出張旅費規程の日当パターン一覧】
 * - "domestic_day_trip"  : 国内日帰り（4,000円）
 * - "domestic_overnight" : 国内宿泊（7,500円/日）
 * - "overseas_day_trip"  : 海外日帰り（8,000円）
 * - "overseas_overnight" : 海外宿泊（15,000円/日）
 *
 * ※ allowancePattern を明示指定するか、tripType ("domestic" | "overseas") と日程を指定すれば
 *   規程に基づき日当額が自動算出されます。直接 dailyAllowance ("7500" 等) を指定することも可能です。
 */
const tripData: BusinessTripData = {
  companyName: businessTripConfig.companyName,
  reporterName: businessTripConfig.reporterName,
  departureDate: "2026/06/10",
  returnDate: "2026/06/11",

  // パターンを明確に指定する場合:
  allowancePattern: "domestic_overnight",

  // または出張種別のみ指定（日程から日帰り/宿泊を自動判定）:
  // tripType: "domestic",

  // または日当額を直接指定:
  // dailyAllowance: "7500",

  destination: "大阪府大阪市",
  purpose: "取引先との商談および現場視察",
  details: "新幹線往復、ホテル宿泊1泊",
};

async function main() {
  await downloadBusinessTrip(tripData);
}

main().catch((err) => {
  console.error("エラー:", err.message ?? err);
  process.exit(1);
});
