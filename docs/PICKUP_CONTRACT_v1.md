# Pickup contract v1 — 2026-10-05

Authority: LDR supplied “Wednesdays 4-7 Saturdays 1-4 @ winco parking lot in Midwest city.” Implementation interprets clock windows as PM in America/Chicago, shown explicitly in the UI; no street address, parking instructions, lead time, capacity or delivery policy invented.

- Location: WinCo parking lot, Midwest City.
- Wednesday: 16:00–19:00 Central.
- Saturday: 13:00–16:00 Central.
- Window endpoints inclusive; no holiday exceptions supplied.
- Code validates date and exact pickup time. Human separately confirms date, time and location; changes and reload reset pickup confirmation.
- Customer wording remains visible. An unavailable request is not automatically moved to another date. Dates outside configured weekdays and times outside windows remain unresolved.
- The quote and prep slip display the location and scheduling review state. A price total is not pickup confirmation or order acceptance.
- Parse start captures a timestamp and calendar reference date in the bakery timezone. Older messages need an editable received-date override. Clock accuracy depends on the device.
- “Next weekday” shows both upcoming-day and following-week candidates. Neither becomes a confirmed date automatically; pickup availability is marked. Unsupported date language stays manual.
- Current pickup policy defaults also apply to legacy configurations without pickup fields. No saved catalog/draft deletion or reset required. Settings can explicitly configure replacement location, timezone and windows. This schedule is separate from the still-awaited authoritative catalog.

Verification cases: Wednesday/Saturday valid windows; Friday invalid; boundary times; invalid calendar dates; DST/timezone reference; relative-date ambiguity; no automatic shift; explicit human confirmation; changed fields/reload reset confirmation; quote and prep location; legacy data compatibility. These extend, and do not replace or weaken, the original acceptance tests. Contradictor gate remains pending.
