# CrumbCraft: I Built My Wife a Local AI Baker's Sentry

Submission draft; LDR must review personal statements and supply device inference evidence before publication.

## Who I Built It For

CrumbCraft is built for Dani at Crumb N Get It Bakery. [LDR: add your firsthand introduction.]

## The Bakery Problem

Customer messages are conversational. Production needs quantities, dates, variations, prices and a clear prep slip while baking is already underway.

## What CrumbCraft Does

Paste a message, load local Gemma, extract an editable draft, review it, then create a customer quote and kitchen prep slip. Manual entry works without WebGPU. Missing prices and recipes remain visible instead of turning into invented business facts.

## How Gemma Powers the Core Feature

WebLLM loads `gemma-2-2b-it-q4f16_1-MLC` for WebGPU inference on the operator's device. A constrained extraction prompt asks for customer, fulfillment, items, notes and ambiguities. Zod validates JSON before it enters the draft. Malformed output leaves the existing draft intact and shows a recoverable error. Real inference proof remains DEVICE_VERIFICATION_REQUIRED until recorded on the final device.

## AI Interprets, Code Calculates, Dani Confirms

Gemma never supplies authoritative prices. TypeScript matches catalog aliases, normalizes dozens, resolves exact price tiers in integer cents, scales configured recipe grams, and generates quotes. Dani edits and reviews the draft. Review does not automatically accept an order or certify allergen safety.

## Why Local/Open AI Matters for a Small Bakery

No cloud LLM key or per-token hosted inference bill is required. Customer parsing uses local WebLLM when available. First use needs an online asset download; cached reuse depends on browser storage. There is no first-use offline claim. Model and prompt are in the owner-controlled source. The app has no application backend.

## Architecture

```text
Customer Message → Local Gemma / WebLLM → OrderIntent JSON
→ Zod Validation → Human Review
→ Deterministic Pricing + Deterministic Recipe Scaling
→ Customer Quote + Kitchen Prep Slip
```

React + Vite + TypeScript, Zod, Vitest, browser localStorage. Domain modules remain separate from React rendering. Only supplied seed pricing: 24 cookies / 2 dozen = $30. No bakery recipes or allergen metadata invented.

## Demo

[Insert real device recording following DEMO_SCRIPT.md. Do not label test fixtures as Gemma output.]

## What I Learned

Explicit unresolved states make the boundary between language understanding and business configuration visible. [LDR: add firsthand build lessons.]

## What Dani Said

[Await actual feedback. No quote or testimonial supplied.]

## Open Source / repo

App license: MIT. Repository: https://github.com/ldr-Fulcrum/love-on-the-web . Repository is currently private; public access and publication require LDR's separate release action. Gemma model use is subject to its own upstream terms, distinct from the application's MIT license.
