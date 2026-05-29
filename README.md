# accounting-docs-automation

給与明細書・出張報告書を Playwright で自動入力して PDF をダウンロードするスクリプト集です。  
出張報告書は Claude API によるメール解析と組み合わせて自動入力できます。

## 必要環境

- Node.js 18 以上
- npm

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# Playwright 用 Chromium のインストール（初回のみ）
npx playwright install chromium
```

---

## 給与明細書

対象サイト: https://keiei-support-plus-a.com/kyuuyo-pippa/kyuyomeisai-template/

### 設定ファイルの準備

```bash
cp src/payslip-config.example.ts src/payslip-config.ts
```

`src/payslip-config.ts` を自分の情報に編集してください（個人情報を含むため gitignore 済み）。

### 実行

```bash
npm run download-payslip
```

`downloads/` に `{支給月}分給与明細書({会社名}_{氏名}様).pdf` が保存されます。

### PayslipData フィールド一覧

| フィールド | 必須 | 説明 |
|---|---|---|
| `companyName` | ✓ | 会社名 |
| `employeeName` | ✓ | 氏名 |
| `paymentMonth` | ✓ | 給与支給月（例: `"2026年5月"`） |
| `workingDays` | | 労働日数 |
| `workingHours` | | 労働時間。176時間30分 → `"17630"` |
| `overtimeHours` | | 残業時間。10時間45分 → `"1045"` |
| `basicSalary` | ✓ | 基本給 |
| `commuteAllowance` | | 非課税通勤費 |
| `customAllowances` | | カスタム支給項目（最大4件）`{ name, amount }[]` |
| `healthInsurance` | | 健康保険 |
| `welfarePension` | | 厚生年金 |
| `employmentInsurance` | | 雇用保険（役員など不要な場合は省略） |
| `incomeTax` | | 所得税 |
| `residentTax` | | 住民税 |
| `customDeductions` | | カスタム控除項目（最大3件）固定5項目に続く追加枠 |
| `notes` | | 備考 |

---

## 出張報告書

対象サイト: https://keiei-support-plus-a.com/zeirishi-hiyou/shucchou-houkokusho-template/

### 設定ファイルの準備

```bash
cp src/business-trip-config.example.ts src/business-trip-config.ts
cp src/run-business-trip.ts src/run-business-trip.ts  # すでに gitignore 済み
```

`src/business-trip-config.ts` に会社名・氏名・旅費日当額を設定してください。

### 実行方法 A: 手動入力

`src/run-business-trip.ts` の `tripData` を直接編集して実行します。

```bash
npm run download-business-trip
```

### 実行方法 B: メールから Claude が自動抽出

新幹線予約・ホテル予約などの確認メールを貼り付けると、Claude API が項目を解析して PDF を生成します。

**事前設定: Anthropic API キー**

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

または `.env` ファイル（gitignore 済み）に設定:
```
ANTHROPIC_API_KEY=sk-ant-...
```

**標準入力から実行（貼り付け → Ctrl+D）:**

```bash
npm run extract-trip-from-email
```

**テキストファイルから実行:**

```bash
npm run extract-trip-from-email -- emails/booking.txt
```

`downloads/` に `YYYY年M月D日_出張報告書（{会社名}）.pdf` が保存されます。

### メールの例（複数まとめて貼り付けも可）

```
【新幹線予約確認】
予約番号: EX-1234567
乗車日: 2026年6月10日
のぞみ17号 東京 09:30 → 新大阪 11:47

【ホテル予約確認】
施設名: 大阪グランドホテル
チェックイン: 2026年6月10日
チェックアウト: 2026年6月11日
```

→ Claude が出発日・帰宅日・行先・目的・詳細を自動抽出します。

### BusinessTripData フィールド一覧

| フィールド | 必須 | 説明 |
|---|---|---|
| `companyName` | ✓ | 会社名（config から自動設定） |
| `reporterName` | ✓ | 氏名（config から自動設定） |
| `reportDate` | | 報告日 `YYYY/MM/DD`（省略時は実行当日） |
| `departureDate` | ✓ | 出張出発日 `YYYY/MM/DD` |
| `returnDate` | ✓ | 出張帰宅日 `YYYY/MM/DD` |
| `dailyAllowance` | | 旅費日当額（config から自動設定） |
| `destination` | ✓ | 出張の行先 |
| `purpose` | ✓ | 出張の目的 |
| `details` | | 出張の内容（詳細） |

---

## ファイル構成

```
.
├── src/
│   ├── types.ts                         # 型定義（PayslipData / BusinessTripData）
│   │
│   ├── download-payslip.ts              # 給与明細書 Playwright 自動化
│   ├── payslip-config.ts                # 給与明細入力データ ※gitignore
│   ├── payslip-config.example.ts        # テンプレート
│   │
│   ├── download-business-trip.ts        # 出張報告書 Playwright 自動化
│   ├── run-business-trip.ts             # 手動実行エントリーポイント ※gitignore
│   ├── extract-from-email.ts            # Claude API メール解析 + 自動実行
│   ├── business-trip-config.ts          # 固定設定（会社名・氏名等） ※gitignore
│   └── business-trip-config.example.ts  # テンプレート
│
├── downloads/                            # 生成 PDF の保存先（自動作成）※gitignore
├── .gitignore
├── package.json
└── tsconfig.json
```
