---
description: "Use when creating or editing business trip report data, trip purpose, trip details, run.ts, or business trip configuration. Preserve the configured default purpose and details unless the user explicitly provides replacements."
applyTo: "src/business-trip/run.ts, src/business-trip/config.ts, src/business-trip/config.example.ts"
---
# 出張報告書の既定文言

## 作成・実行手順

- ユーザーが出張報告書の作成を依頼し、日付・行先・出張の種類が読み取れる場合は、追加確認を挟まず `src/business-trip/run.ts` の `tripData` に反映し、同じ対応内で `npm run download-business-trip` を実行してください。
- 年の指定がない日付には現在の年を使用してください。日付が1日だけ指定され、宿泊の指定がなければ、出発日と帰着日を同日にして `domestic_day_trip` を指定してください。
- 会社名・報告者名は `businessTripConfig` の値を使ってください。行先は既存ルールに従い市区町村レベルで記載してください。

出張目的・出張内容は、出張の種類に応じて次の文言を使用してください。ユーザーが個別の置き換えを明示した場合に限り、その指定を優先してください。

場所を記載する場合は市区町村レベルまでとし、町名・番地・建物名・施設名など詳細な所在地は記載しないでください。

勉強会・技術調査・缶詰作業などの場合は、`businessTripConfig` の既定値をそのまま使用してください。

```ts
purpose: businessTripConfig.defaultPurpose,
details: businessTripConfig.defaultDetails,
```

接待関係の場合は、次の文言を使用してください。

**出張目的**
`取引関係者との情報交換・関係構築`

**出張内容**
`取引関係者との情報交換および関係構築を目的とした会合に参加。`

`defaultPurpose` と `defaultDetails` の値や上記の接待関係の文言を、推測・要約・言い換えで変更してはいけません。個別の指定がない場合は、出張の種類に対応する文言をそのまま使用してください。

現在の既定文言は次のとおりです。

- 出張目的: `システム開発・技術調査`
- 出張内容: `行先宿泊施設にて開発作業・技術調査を実施。`
