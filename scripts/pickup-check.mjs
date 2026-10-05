import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.CRUMBCRAFT_QA_URL ?? "http://127.0.0.1:4174");
await page
  .getByRole("combobox", { name: /^Fulfillment method/ })
  .selectOption("pickup");
await page
  .getByLabel("Requested date", { exact: true })
  .fill("next Friday afternoon");
await page
  .getByRole("button", { name: "Use today's date as message reference" })
  .click();
await page
  .getByLabel("Message received date", { exact: true })
  .fill("2026-10-05");
await page.getByText(/2026-10-09 \(pickup unavailable\)/).waitFor();
await page
  .getByLabel("Confirmed date (ISO)", { exact: true })
  .fill("2026-10-09");
await page
  .getByLabel("Confirmed pickup time (America/Chicago)", { exact: true })
  .fill("17:00");
const confirm = page.getByLabel(
  "I confirmed this pickup date, time and location with the customer.",
  { exact: true },
);
if (!(await confirm.isDisabled()))
  throw new Error("Friday pickup must remain blocked");
await page
  .getByLabel("Confirmed date (ISO)", { exact: true })
  .fill("2026-10-07");
await confirm.check();
let quote = await page.getByLabel("Copy-ready draft").inputValue();
if (
  !quote.includes(
    "Pickup reviewed: 2026-10-07 at 5 PM (America/Chicago) · WinCo parking lot, Midwest City",
  )
)
  throw new Error("Reviewed pickup missing from quote");
await page.reload();
if (await confirm.isChecked())
  throw new Error("Reload must reset pickup confirmation");
if (
  (await page
    .getByLabel("Confirmed pickup time (America/Chicago)", { exact: true })
    .inputValue()) !== "17:00"
)
  throw new Error("Pickup time did not persist");
await page
  .getByLabel("Confirmed pickup time (America/Chicago)", { exact: true })
  .fill("19:01");
if (!(await confirm.isDisabled()))
  throw new Error("Outside-window confirmation must remain blocked");
if (
  await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
)
  throw new Error("Mobile overflow");
if (process.env.CRUMBCRAFT_QA_DIR) {
  await mkdir(process.env.CRUMBCRAFT_QA_DIR, { recursive: true });
  await page.screenshot({
    path: process.env.CRUMBCRAFT_QA_DIR + "/pickup.png",
    fullPage: true,
  });
}
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  JSON.stringify({
    status: "LOCAL_VERIFIED",
    flow: "Friday rejected, relative date candidates, Wednesday pickup reviewed, quote location/time, persistence with confirmation reset, outside-window rejection, mobile overflow",
    pageErrors: errors,
  }),
);
await browser.close();
