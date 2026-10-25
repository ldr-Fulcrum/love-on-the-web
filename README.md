# CrumbCraft — The Baker's Sentry

CrumbCraft is a local-first bakery order intake and production-prep tool being built for Dani at Crumb N Get It Bakery for the 2026 DEV Hacktoberfest Weekend Challenge.

## Build target

- Vite + React + TypeScript
- WebLLM + Gemma 2 2B Instruct running in-browser through WebGPU
- Local-first order parsing
- Deterministic pricing and recipe scaling
- Editable order review
- Customer quote + print-ready kitchen prep slip
- No required backend or cloud LLM API

## Engineering rule

**AI interprets. Code calculates. Human confirms.**

Gemma may extract intent from messy customer messages. Pricing, totals, recipe math, product matching, and business rules must remain deterministic application code.

## Repository status

Scaffold only. The implementation is intended to be completed in one Codex Cloud build mission.

Read `CODEX_START_HERE.md` before implementation.

## License

MIT

## Implementation — 2026-10-05

The original scaffold description above is preserved as history. The implementation now includes local WebLLM parsing, manual review, deterministic quote generation, printable kitchen slips, settings, persistence and acceptance tests.

### Run

Use Node 22.12+ or Node 26.5 (the build host used 26.5).

```sh
npm ci
npm run test
npm run build
npm run dev
```

Open the localhost URL printed by Vite. No backend, auth, API key, environment variable or hosted LLM endpoint is required. Model assets require an initial online download. WebGPU and compatible GPU resources are required for model inference; manual entry remains available without them.

### Model and AI boundary

Actual model: `gemma-2-2b-it-q4f16_1-MLC`, verified in installed `@mlc-ai/web-llm` **0.2.85** `prebuiltAppConfig`. The SDK loads on demand and rechecks the model ID. Gemma extracts intent only. JSON is parsed without eval and validated with Zod; malformed output leaves the prior draft intact. Product context contains names/aliases, never price tiers. No parser fixture is used in production.

TypeScript owns exact alias matching (zero matches UNMATCHED; multiple AMBIGUOUS), dozen normalization, exact configured quantity tier pricing, integer cents, total suppression for unresolved lines, and proportional recipe scaling. Ingredients round to nearest integer gram. Partial or multiple tier arithmetic is deliberately unsupported until the operator configures an exact tier.

### Operating the workflow

Load Local Gemma, then Load Demo Order and Parse with Local Gemma. Correct the extraction, especially the gluten-free subset and tentative pie. Relative dates remain text until clarified. Manual entry: Add manual item, enter requested product, choose a catalog product if uncertain, enter quantity and unit. A 24-cookie / two-dozen tier resolves to $30. Pie pricing and all recipes start unconfigured. No surcharge, tax, discount or other bakery facts are invented. Quotes state that only configured items are included.

Review marks an operator-reviewed draft; it does not accept the order. Any order or configuration edit resets review. Reload also resets review. Confirm availability, dates, dietary variations, tax and actual business terms with the customer before accepting.

Settings use validated JSON with product IDs, aliases, enabled state, selling units, integer-cent price tiers, recipe IDs, known allergens, and recipes (positive baseYield/yieldUnit, named ingredients and nonnegative grams). Unknown allergen metadata does not mean allergen-free. JSON editing keeps the configuration fully inspectable; invalid configuration is rejected. Reset Demo Data asks before replacing local configuration and draft.

### Privacy and persistence

Customer text is passed to the local engine, never to an application backend or remote inference API. Model downloads use upstream asset hosts. Draft/config are stored as `crumbcraft.draft.v1` and `crumbcraft.config.v1` in browser localStorage, without encryption. Text in the intake textarea is session-only; the structured draft persists. Malformed stored records fall back safely; storage failures warn and retain session state. Clear/reset on shared devices. No analytics or service worker is included. Offline app reload is not guaranteed; cached inference behavior needs device observation.

### Verification and submission

Real model inference: **DEVICE_VERIFICATION_REQUIRED**. Compiling the adapter and fixture tests do not prove real Gemma inference. Follow [exact device steps](docs/DEVICE_VERIFICATION.md) and capture actual inference before claiming VERIFIED.

Acceptance IDs AT-P01–04, AT-N01–05, AT-S01, AT-L01 and AT-I01–04 are implemented in `src/tests/acceptance.test.tsx`, plus boundary regressions. Vitest disables Node's experimental webstorage in its worker so jsdom owns browser storage. Browser QA uses `scripts/browser-check.mjs`; set `CRUMBCRAFT_QA_DIR` to an external evidence directory, start Vite and run it. Browser checks are synthetic manual workflow evidence, not model inference proof.

Submission assets: [DEV draft](docs/DEV_SUBMISSION_DRAFT.md), [90-second script](docs/DEMO_SCRIPT.md), [screenshot checklist](docs/SCREENSHOT_CHECKLIST.md). Personal feedback and recording placeholders remain explicit. The repo is private; no visibility change, deployment, publication or hackathon submission is performed. Application MIT license does not supersede upstream Gemma model terms.

### First device parse repair — 2026-10-05

A user device attempt loaded Gemma but returned an invalid draft. The request now enables WebLLM schema-constrained JSON output, followed by the unchanged Zod validator. The app exposes recoverable JSON/schema/truncation diagnostics and session-only raw response on failure. Refresh and reload the cached model to retest. The 27-test local suite includes request-boundary and draft-preservation checks; it is not actual device inference or Contradictor proof. Both gates remain pending.

### Pickup policy — 2026-10-05

LDR-provided location: WinCo parking lot, Midwest City. Pickup windows: Wednesday 4-7 PM and Saturday 1-4 PM, America/Chicago, inclusive endpoints. Location, timezone and windows appear in review/settings and quote/prep. No address or delivery availability invented. Exact date/time must be reviewed with the customer; changes/reload revoke pickup confirmation. No out-of-window or Friday request is silently moved. The real catalog remains awaited.

Parse start records the bakery-local reference date. For older pasted messages edit Message received date. Next weekday wording shows two unconfirmed candidate dates and marks pickup availability. Calendar calculation stays in code; the model contract stays unchanged.

44 local tests pass; browser pickup checks use scripts/pickup-check.mjs. scripts/contradictor-check.mjs supplies a deterministic-domain adapter to an explicitly selected external kernel, pins its inspected source hash, requires a clean committed candidate and records 12 challenges in an external evidence directory. Set CRUMBCRAFT_CONTRADICTOR_PATH to that kernel source and CRUMBCRAFT_CONTRADICTOR_EVIDENCE to a fresh evidence directory, then run node scripts/contradictor-check.mjs. The kernel is not distributed in this MIT repository. This domain pass cannot establish real Gemma extraction correctness or independent acceptance. The 1000-order queue is not implemented.
