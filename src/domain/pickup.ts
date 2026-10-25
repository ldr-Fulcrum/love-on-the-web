import type { Config, Draft } from "./types";

// LDR-provided pickup policy. Clock times interpreted as PM, Central Time.
export const defaultPickupPolicy = {
  location: "WinCo parking lot, Midwest City",
  timeZone: "America/Chicago",
  windows: [
    { weekday: 3, start: "16:00", end: "19:00" },
    { weekday: 6, start: "13:00", end: "16:00" },
  ],
};
export const pickupPolicy = (config: Config) =>
  config.pickup ?? defaultPickupPolicy;
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
function calendarDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(iso + "T12:00:00Z");
  return !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === iso
    ? date
    : null;
}
export function localDate(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((key) => parts.find((p) => p.type === key)!.value)
    .join("-");
}
export function captureReference(config: Config, now = new Date()) {
  const timeZone = pickupPolicy(config).timeZone;
  return {
    parsedAt: now.toISOString(),
    receivedDate: localDate(now, timeZone),
    timeZone,
  };
}
export function formatClock(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}${minutes ? ":" + String(minutes).padStart(2, "0") : ""} ${hours >= 12 ? "PM" : "AM"}`;
}
export function scheduleText(config: Config) {
  const p = pickupPolicy(config);
  return `${p.location} · ${p.windows.map((w) => `${weekdays[w.weekday]} ${formatClock(w.start)}–${formatClock(w.end)}`).join("; ")} · ${p.timeZone}`;
}
export function isPickupDate(iso: string, config: Config) {
  const date = calendarDate(iso);
  return (
    !!date &&
    pickupPolicy(config).windows.some((w) => w.weekday === date.getUTCDay())
  );
}
export function checkPickup(draft: Draft, config: Config) {
  if (draft.order.fulfillment.method !== "pickup")
    return {
      valid: false,
      reason: "Select pickup explicitly to confirm this location and schedule.",
    };
  const date = calendarDate(draft.order.fulfillment.date_iso ?? "");
  if (!date)
    return {
      valid: false,
      reason:
        "Choose a calendar date; relative wording is not a confirmed pickup date.",
    };
  const windows = pickupPolicy(config).windows.filter(
    (w) => w.weekday === date.getUTCDay(),
  );
  if (!windows.length)
    return {
      valid: false,
      reason: `${weekdays[date.getUTCDay()]} pickup is unavailable. Agree a Wednesday or Saturday date with the customer.`,
    };
  const time = draft.pickup?.time;
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    return {
      valid: false,
      reason: "Choose an exact pickup time in the listed window.",
    };
  if (!windows.some((w) => time >= w.start && time <= w.end))
    return {
      valid: false,
      reason: "Pickup time is outside the available window.",
    };
  return {
    valid: true,
    reason: `${draft.order.fulfillment.date_iso} at ${formatClock(time)} (${pickupPolicy(config).timeZone})`,
  };
}
export function pickupSummary(draft: Draft, config: Config) {
  if (draft.order.fulfillment.method === "delivery")
    return `Delivery details require separate review: ${draft.order.fulfillment.date_iso ?? draft.order.fulfillment.date_text ?? "Date review required"} / ${draft.order.fulfillment.time_text ?? "Time review required"}. This pickup schedule does not confirm delivery.`;
  const checked = checkPickup(draft, config);
  return checked.valid && draft.pickup?.confirmed
    ? `Pickup reviewed: ${checked.reason} · ${pickupPolicy(config).location}`
    : `Pickup review required: ${checked.valid ? "Confirm the selected date, time and location with the customer." : checked.reason}\nAvailable pickup: ${scheduleText(config)}`;
}
// Keep both interpretations visible. Neither is written into a confirmed date.
export function relativeDateCandidates(text: string, referenceDate: string) {
  const date = calendarDate(referenceDate);
  const matched =
    /\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.exec(
      text,
    );
  if (!date || !matched) return [];
  const target = weekdays.findIndex(
    (d) => d.toLowerCase() === matched[1].toLowerCase(),
  );
  const days = (target - date.getUTCDay() + 7) % 7 || 7;
  return [days, days + 7].map((offset) =>
    new Date(date.valueOf() + offset * 86400000).toISOString().slice(0, 10),
  );
}
