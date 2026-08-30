---
description: "Use when creating or editing business trip report data, trip purpose, trip details, run.ts, or business trip configuration. Preserve the configured default purpose and details unless the user explicitly provides replacements."
applyTo: "src/business-trip/run.ts, src/business-trip/config.ts, src/business-trip/config.example.ts"
---
# 出張報告書の既定文言

出張目的・出張内容についてユーザーから個別の指定がない場合は、必ず `businessTripConfig` の既定値をそのまま使用してください。

```ts
purpose: businessTripConfig.defaultPurpose,
details: businessTripConfig.defaultDetails,
```

`defaultPurpose` と `defaultDetails` の値を、推測・要約・言い換えで変更してはいけません。変更できるのは、ユーザーが目的または内容の置き換えを明示的に依頼した場合だけです。

現在の既定文言は次のとおりです。

- 出張目的: `システム開発・技術調査`
- 出張内容: `行先宿泊施設にて開発作業・技術調査を実施。`
