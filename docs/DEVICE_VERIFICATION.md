# Final device verification — DEVICE_VERIFICATION_REQUIRED

Start from the pushed branch: `git checkout codex/crumbcraft`, `npm ci`, `npm run dev`. Open the printed localhost URL on a WebGPU-capable browser/device. For a remote device use an approved HTTPS deployment; deployment is not performed by this build.

1. Confirm app loads without an application backend.
2. Confirm WebGPU status is detected. Detection indicates the API exists; model loading proves adapter capability.
3. Tap Load Local Gemma while online. Confirm progress and errors remain visible.
4. Confirm actual displayed model ID is `gemma-2-2b-it-q4f16_1-MLC`.
5. Load Demo Order and tap Parse with Local Gemma.
6. Confirm real inference produces a structured draft; no fixture exists in the production parser. Capture video and note model/load/parse times.
7. Review Sarah, next Friday afternoon, two dozen / 24 cookies, one-dozen gluten-free subset, and tentative 9-inch pie. Correct mistakes explicitly. Confirm the subset is not counted as extra cookies.
8. Edit a field. Verify operator review resets and pricing recomputes. Two dozen cookies resolve to $30; unconfigured quantities remain unresolved.
9. Keep pie price unresolved until actual bakery configuration is supplied; final total stays pending.
10. Inspect dietary warning and bakery-known allergen metadata separately. Never certify safety.
11. Recipe gaps say Recipe not configured. With an approved recipe, verify base yield, requested yield, factor and grams rounded to nearest integer.
12. Copy Quote and verify clipboard content.
13. Print Prep Slip; inspect actual print preview for readable kitchen content only.
14. Reload and confirm draft/config persistence. Operator review intentionally resets on reload.
15. Optional cached offline check: load app/model online first, disconnect, and document observed inference behavior. App reload offline is not guaranteed; no PWA/service worker is included.

Capture model-ready screenshot/video, real raw-message-to-output video, review, quote, and print preview. Mark local inference VERIFIED only after real WebLLM inference succeeds in step 5. Record failures and device/browser/version honestly.
