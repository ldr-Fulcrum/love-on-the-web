import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const output = process.env.CRUMBCRAFT_QA_DIR;
if (!output)
  throw new Error("Set CRUMBCRAFT_QA_DIR to an external evidence directory.");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.setDefaultTimeout(60000);
await page.goto(process.env.CRUMBCRAFT_QA_URL ?? "http://127.0.0.1:5173", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.getByRole("heading", { name: "CrumbCraft", exact: true }).waitFor();
await page
  .getByRole("button", { name: "Load Demo Order", exact: true })
  .click();
if (!(await page.getByLabel("Customer message").inputValue()).includes("Sarah"))
  throw new Error("Demo input missing");
await page
  .getByRole("button", { name: "Add manual item", exact: true })
  .click();
await page
  .getByLabel("Customer name", { exact: true })
  .fill("Browser QA customer");
await page.getByLabel("Requested product", { exact: true }).fill("cookies");
await page.getByLabel("Quantity", { exact: true }).fill("24");
let quote = await page.getByLabel("Copy-ready draft").inputValue();
if (!quote.includes("Subtotal / total: $30.00"))
  throw new Error("Configured quote failed");
await page
  .getByRole("button", { name: "Add manual item", exact: true })
  .click();
await page
  .getByLabel("Requested product", { exact: true })
  .nth(1)
  .fill("pecan pie");
await page.getByLabel("Quantity", { exact: true }).nth(1).fill("1");
await page.getByRole("combobox", { name: /^Unit/ }).nth(1).selectOption("pie");
quote = await page.getByLabel("Copy-ready draft").inputValue();
if (
  !quote.includes("Total pending price review") ||
  quote.includes("Subtotal / total:")
)
  throw new Error("Unresolved total failed");
await page.screenshot({ path: output + "/desktop.png", fullPage: true });
await page.reload();
if (
  (await page.getByLabel("Customer name", { exact: true }).inputValue()) !==
  "Browser QA customer"
)
  throw new Error("Persistence failed");
await page.emulateMedia({ media: "print" });
await page.screenshot({ path: output + "/print.png", fullPage: true });
await page.emulateMedia({ media: "screen" });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: output + "/mobile.png", fullPage: true });
if (
  await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
)
  throw new Error("Mobile horizontal overflow");
if (errors.length) throw new Error(errors.join("\n"));
await page
  .getByText(
    "Edit products, aliases, price tiers, recipes and known allergens",
    { exact: true },
  )
  .click();
const config = JSON.parse(
  await page.getByLabel("Validated bakery configuration (JSON)").inputValue(),
);
config.products[0].recipeId = "qa-synthetic";
config.recipes = [
  {
    id: "qa-synthetic",
    name: "Synthetic browser QA only",
    baseYield: 12,
    yieldUnit: "each",
    ingredients: [{ name: "Synthetic ingredient", grams: 100 }],
  },
];
await page
  .getByLabel("Validated bakery configuration (JSON)")
  .fill(JSON.stringify(config));
await page.getByRole("button", { name: "Save Settings", exact: true }).click();
await page.getByText("Synthetic ingredient: 200 g", { exact: true }).waitFor();
await page.reload();
await page.getByText("Synthetic ingredient: 200 g", { exact: true }).waitFor();
await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
await page.getByRole("button", { name: "Copy Quote", exact: true }).click();
await page.getByText("Quote copied.", { exact: true }).waitFor();
if (
  !(await page.evaluate(() => navigator.clipboard.readText())).includes(
    "Total pending price review",
  )
)
  throw new Error("Clipboard quote mismatch");
await page.evaluate(() => {
  window.print = () => {
    document.documentElement.dataset.printRequested = "yes";
  };
});
await page
  .getByRole("button", { name: "Print Prep Slip", exact: true })
  .click();
if (
  (await page.evaluate(
    () => document.documentElement.dataset.printRequested,
  )) !== "yes"
)
  throw new Error("Print handler failed");
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  JSON.stringify({
    status: "LOCAL_VERIFIED",
    flow: "startup, demo input, manual cookie price, unresolved pie, draft/config reload persistence, settings save, synthetic recipe scaling, clipboard, print handler/CSS, mobile overflow",
    pageErrors: errors,
    webgpu: await page.evaluate(() => "gpu" in navigator),
    inference: "DEVICE_VERIFICATION_REQUIRED",
  }),
);
await browser.close();
