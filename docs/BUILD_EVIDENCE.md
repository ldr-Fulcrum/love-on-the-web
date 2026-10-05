# CrumbCraft build evidence — 2026-10-05

Mission CNGI-CRUMBCRAFT-HF26-001. Actor: Codex / Mr. A. Status: LOCAL_VERIFIED for deterministic implementation; DEVICE_VERIFICATION_REQUIRED for real inference. This is build evidence, not independent acceptance, release, deployment or hackathon submission.

## Source and identity

- Repository: https://github.com/ldr-Fulcrum/love-on-the-web
- Base commit: `a350302356e5becd7ea5287b7472510add64137f`
- Branch: `codex/crumbcraft`
- Handoff ZIP SHA256: `38a16e51a0e63810945546de5dd0c3ddbc9c441be197b178a16a92f88d8ed1ff`
- Handoff source: `C:\LAB-Storage\01_Command_View\INOS_Build_Kits\CRUMBCRAFT_CODEX_HANDOFF_v1.0.zip`, read without mutation, in user-specified order.
- GitHub connector reported push permission and private visibility. Git clone succeeded. Main remains the starter; implementation is a reviewable branch.
- Exact implementation commit is supplied in the final build return and remote branch readback. `FILE_HASHES.json` records final changed-file SHA256 values; the manifest excludes itself to avoid a self-referential hash.

## Implementation

Vite, React, TypeScript, Zod, WebLLM, Gemma adapter, catalog matching, integer-cent exact-tier pricing, proportional recipe math, editable review, quote, print stylesheet, settings and browser persistence. No backend or remote LLM API. SDK is a lazy bundle; its approximately 6 MB uncompressed chunk is expected and triggers a build-size warning. Initial application JS is approximately 333 KB uncompressed.

Actual model `gemma-2-2b-it-q4f16_1-MLC`; WebLLM 0.2.85. Verified against installed package prebuiltAppConfig; load rechecks supported ID. Prompt never supplies price tiers. Representative model JSON appears only in tests, clearly synthetic. No actual inference result is fabricated.

## Checks

- `npm install`: completed; lockfile committed.
- `npm run test`: 21 passed, 0 failed on patched Vitest 4.1.11. Frozen AT-P01–04, AT-N01–05, AT-S01, AT-L01 and AT-I01–04 plus six regressions. Covers malformed JSON, exact prices, ambiguous matches, missing recipes, dietary warning, editable fixture draft, quotes, synthetic scaled prep slip, startup/manual operation without WebGPU, storage and selection review reset.
- `npm run build`: successful TypeScript check and Vite production bundle. Nonfatal third-party Zod annotation warnings and WebLLM chunk-size warning remain.
- `npm run typecheck`: standalone TypeScript check.
- Patched dependency installation audited 160 packages: zero vulnerabilities at build time.
- `npm run dev`: localhost startup verified. `npx vite preview --host 127.0.0.1 --port 4173`: production startup verified.
- Production Chromium QA script checks demo input, manual 24-cookie $30 quote, unresolved pie suppressing total, reload persistence, desktop/mobile layout, print CSS, settings and synthetic recipe scaling, clipboard and print handler. No browser page errors; no horizontal overflow at 390 px width. Synthetic recipe is browser-test configuration only, never seeded bakery data.
- In-app browser initialization timed out; Playwright Chromium used as fallback. Inspected desktop, mobile and print screenshots. Print CSS proves slip isolation; actual operating-system print preview remains a final-device check.
- Headless WebGPU probe: `{"webgpu":true,"adapter":false}`. API presence is not usable inference capability. No model inference claimed.

## Repairs made

Node 26 global experimental storage conflicted with jsdom. Browser code explicitly uses window.localStorage; test workers disable Node webstorage. Updated vulnerable initial Vitest to 4.1.11 and switched to a single thread after a fork startup timeout. Browser unit dropdown locator corrected; original acceptance expectations unchanged. Lazy SDK loading reduced initial bundle. Print root background corrected to white. README retains the original byte prefix and appends current implementation documentation.

## Assumptions and limits

Exact configured quantity tiers only; no extrapolated price or bundle optimization. Money is safe integer cents. No tax, discounts or specialty surcharge configuration. Relative dates require operator clarification. Customer dietary subsets and tentative items depend on extraction and human correction. Recipes/allergen metadata are unconfigured until supplied. Settings are a validated JSON editor. Draft/config persist locally without encryption; raw intake text is session-only. No PWA/offline-reload promise. Review is reset by editing, settings changes and reload; review is not order acceptance.

Repository remains private. DEV article, real model recording, Dani feedback, visibility change, release and submission remain human work. See DEVICE_VERIFICATION.md for exact device proof steps. No public challenge results or personal testimonial invented. No secret store reads, credential writes, remote inference endpoint, service activation or deployment.

## Evidence artifacts

Local screenshots (synthetic manual workflow):

- `C:\Users\lross\.codex\visualizations\2026\10\05\01a10b4b-449a-7d02-87b3-9d1804c4e102\crumbcraft\desktop.png`
- same directory: `mobile.png`, `print.png`

Screenshots stay outside Git. The self-contained report and file manifest are prepared for stage reporting; no Big L review/approval is asserted. No verified Big L reporting endpoint was provided for this external-app mission.

## Next action

LDR: run DEVICE_VERIFICATION.md on the final WebGPU device and capture the real Gemma demo.

## Device extraction repair — 2026-10-05

The first user device screenshot showed model ready but rejected demo output. The exact malformed response was not available, so no specific generation error is asserted. The completion request now uses WebLLM response_format json_object with a JSON schema derived from the existing Zod order contract. Zod still validates every result. Truncated responses are rejected. Parser diagnostics identify JSON versus schema failures and show raw output in an expandable session-only panel; previous drafts survive failed parses. Raw diagnostics are not persisted or automatically transmitted.

Local checks: 27 tests pass (original 21 plus six new completion/recovery checks). New tests use a mock transport and do not prove grammar execution or real inference. Real Gemma retest and Contradictor gate remain pending. Refresh the app, load the cached model, load the demo text and parse again. If it fails, expand Local parser diagnostics and capture the synthetic response and listed errors.

## Pickup policy verification — 2026-10-05

LDR supplied the pickup location and weekly windows. Interpreted explicitly as PM, America/Chicago. Added deterministic policy, calendar/time validation, review confirmation/reset behavior, quote/prep location, parse reference date and older-message override. 44 tests pass; production build passes. Production Chromium pickup-check script passes Friday rejection, Wednesday confirmation, quote location/time, reload reset/persistence, out-of-window rejection and 390px overflow checks with no page errors. Synthetic evidence screenshot is stored outside Git in 01_The_Laboratory/crumbcraft-pickup-qa-20261005/pickup.png.

Added an external-kernel Contradictor runner with 12 deterministic-domain expectations from the original contract and pickup policy. The inspected kernel SHA256 is 59f56724a2e8b62a673633de2381900180914b50dd852e2b5c34e85486642715. Kernel source is read only, not copied or changed. Candidate-bound execution receipts are produced externally after commit; see final run return. This is not a real model-inference, 1000-order batch or independent acceptance verdict. Catalog remains demo-only pending LDR's authoritative catalog.
