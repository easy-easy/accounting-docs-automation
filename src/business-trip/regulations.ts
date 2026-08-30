import { TripAllowancePattern, TripType } from "../types";

/**
 * 出張旅費規程の定義
 */
export const TRAVEL_EXPENSE_REGULATIONS = {
  // 交通費・宿泊料
  expenses: {
    transportation: "実費精算",
    accommodation: "実費精算",
  },
  // 日当（1日あたり）
  dailyAllowance: {
    domestic: {
      dayTrip: 4000,     // 国内・日帰り: 4,000円
      overnight: 7500,   // 国内・1泊以上: 7,500円／日
    },
    overseas: {
      dayTrip: 8000,     // 海外・日帰り: 8,000円
      overnight: 15000,  // 海外・1泊以上: 15,000円／日
    },
  },
} as const;

export interface AllowancePatternInfo {
  id: TripAllowancePattern;
  tripType: TripType;
  label: string;
  amount: number;
  description: string;
}

/**
 * 日当パターンの詳細一覧
 */
export const ALLOWANCE_PATTERNS: Record<TripAllowancePattern, AllowancePatternInfo> = {
  domestic_day_trip: {
    id: "domestic_day_trip",
    tripType: "domestic",
    label: "国内出張（日帰り）",
    amount: TRAVEL_EXPENSE_REGULATIONS.dailyAllowance.domestic.dayTrip,
    description: "国内日帰り出張: 4,000円/日",
  },
  domestic_overnight: {
    id: "domestic_overnight",
    tripType: "domestic",
    label: "国内出張（宿泊・1泊以上）",
    amount: TRAVEL_EXPENSE_REGULATIONS.dailyAllowance.domestic.overnight,
    description: "国内宿泊出張: 7,500円/日",
  },
  overseas_day_trip: {
    id: "overseas_day_trip",
    tripType: "overseas",
    label: "海外出張（日帰り）",
    amount: TRAVEL_EXPENSE_REGULATIONS.dailyAllowance.overseas.dayTrip,
    description: "海外日帰り出張: 8,000円/日",
  },
  overseas_overnight: {
    id: "overseas_overnight",
    tripType: "overseas",
    label: "海外出張（宿泊・1泊以上）",
    amount: TRAVEL_EXPENSE_REGULATIONS.dailyAllowance.overseas.overnight,
    description: "海外宿泊出張: 15,000円/日",
  },
};

/**
 * 出発日と帰宅日から宿泊（1泊以上）かどうかを判定
 */
export function isOvernightTrip(departureDate: string, returnDate: string): boolean {
  return departureDate.trim() !== returnDate.trim();
}

/**
 * 出張種別（国内/海外）と日程から日当パターンを決定
 */
export function determineAllowancePattern(
  tripType: TripType = "domestic",
  departureDate?: string,
  returnDate?: string
): TripAllowancePattern {
  const isOvernight = departureDate && returnDate ? isOvernightTrip(departureDate, returnDate) : false;

  if (tripType === "overseas") {
    return isOvernight ? "overseas_overnight" : "overseas_day_trip";
  }
  return isOvernight ? "domestic_overnight" : "domestic_day_trip";
}

/**
 * 指定されたパターンから日当額（数値）を取得
 */
export function getDailyAllowanceByPattern(pattern: TripAllowancePattern): number {
  return ALLOWANCE_PATTERNS[pattern]?.amount ?? TRAVEL_EXPENSE_REGULATIONS.dailyAllowance.domestic.dayTrip;
}

/**
 * 入力条件（パターン明示指定、または出張種別+日程）から日当額（文字列）を解決
 */
export function resolveDailyAllowance(options: {
  dailyAllowance?: string;
  allowancePattern?: TripAllowancePattern;
  tripType?: TripType;
  departureDate?: string;
  returnDate?: string;
}): string {
  // 直接指定がある場合は優先
  if (options.dailyAllowance !== undefined && options.dailyAllowance !== "") {
    return options.dailyAllowance;
  }

  // パターン明示指定がある場合
  if (options.allowancePattern) {
    return String(getDailyAllowanceByPattern(options.allowancePattern));
  }

  // 出張種別と日程から自動決定
  const pattern = determineAllowancePattern(
    options.tripType ?? "domestic",
    options.departureDate,
    options.returnDate
  );
  return String(getDailyAllowanceByPattern(pattern));
}
