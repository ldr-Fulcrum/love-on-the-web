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
