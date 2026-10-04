# CODEX START HERE

This repository is intentionally a minimal scaffold for a one-shot Codex Cloud build.

## Required reading order

1. Read the external package file `00_READ_THIS_FIRST.md`.
2. Read `01_ONE_SHOT_CODEX_BUILD_PROMPT.md` in full.
3. Read `02_PRODUCT_AND_TECHNICAL_CONTRACT.md`.
4. Read `03_ACCEPTANCE_TESTS.md`.
5. Read `04_HACKATHON_SUBMISSION_BRIEF.md`.
6. Then inspect this repository and execute the one-shot build mission.

## Non-negotiable architecture

**AI interprets. Code calculates. Human confirms.**

Gemma/WebLLM performs local semantic extraction only.

Deterministic TypeScript owns:
- product matching;
- quantities after normalization;
- prices and totals;
- recipe scaling;
- business-rule validation;
- unresolved-state handling.

Do not fabricate bakery menu facts, prices, recipes, or allergen guarantees.

## Cloud verification boundary

Codex Cloud should complete and verify everything its environment supports.

If real WebGPU + Gemma inference cannot execute in the cloud runtime, do not fake success. Return:

`DEVICE_VERIFICATION_REQUIRED`

and provide exact final-device verification steps.

## Build priority

Ship the working P0 path before adding optional features.
