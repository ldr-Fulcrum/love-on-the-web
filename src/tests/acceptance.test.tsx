import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { demoConfig } from "../data/demoConfig";
import {
  emptyDraft,
  emptyItem,
  type Draft,
  type Recipe,
} from "../domain/types";
import { priceItem } from "../domain/pricing";
import { scaleRecipe } from "../domain/recipeScaling";
import { matchProduct } from "../domain/productMatching";
import { dietaryWarning, summarize } from "../domain/quote";
import { parseResponse } from "../ai/orderParser";
import { systemPrompt } from "../ai/prompt";
import { OrderReview } from "../components/OrderReview";
import { PrepSlip } from "../components/PrepSlip";
import { configSchema } from "../domain/schemas";
import { readStored, saveStored, draftSchema } from "../storage/configStore";
vi.mock("../ai/webllm", () => ({
  MODEL_ID: "gemma-2-2b-it-q4f16_1-MLC",
  webgpuAvailable: () => false,
  loadModel: vi.fn(),
  extractOrder: vi.fn(),
}));
import App from "../App";
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
const cookie = {
  ...emptyItem(),
  raw_name: "cookies",
  quantity: 2,
  unit: "dozen" as const,
};
const recipe: Recipe = {
  id: "test-only",
  name: "Synthetic test recipe, not bakery facts",
  baseYield: 24,
  yieldUnit: "each",
  ingredients: [
    { name: "Test ingredient A", grams: 100 },
    { name: "Test ingredient B", grams: 75 },
  ],
};
const fixture: Draft = {
  ...emptyDraft(),
  order: {
    customer: { name: "Sarah", phone: null, email: null },
    fulfillment: {
      date_text: "next Friday",
      date_iso: null,
      time_text: "afternoon",
      method: "unknown",
    },
    items: [
      {
        ...cookie,
        variation_notes: [
          "One dozen of the two dozen requested gluten-free if possible",
        ],
        dietary_notes: ["Gluten-free request for one dozen"],
        customer_notes: [],
      },
      {
        ...emptyItem(),
        raw_name: "9-inch pecan pie",
        quantity: 1,
        unit: "pie",
        customer_notes: ["Tentative: may also need"],
      },
    ],
    general_notes: [],
    ambiguities: ["Confirm possible pie and gluten-free availability."],
  },
};
describe("frozen acceptance", () => {
  it("AT-P01 configured 24-cookie and 2-dozen pricing", () => {
    expect(priceItem(demoConfig.products[0], cookie)).toMatchObject({
      status: "RESOLVED",
      cents: 3000,
    });
    expect(
      priceItem(demoConfig.products[0], {
        ...cookie,
        quantity: 24,
        unit: "each",
      }),
    ).toMatchObject({ cents: 3000 });
  });
  it("AT-P02 missing price never zero", () =>
    expect(
      priceItem(demoConfig.products[1], {
        ...cookie,
        unit: "pie",
        quantity: 1,
      }),
    ).toMatchObject({ status: "UNRESOLVED" }));
  it("AT-P03 scales each ingredient 2x and rounds explicitly", () =>
    expect(
      scaleRecipe(recipe, { ...cookie, quantity: 48, unit: "each" }),
    ).toMatchObject({
      factor: 2,
      ingredients: [{ grams: 200 }, { grams: 150 }],
    }));
  it("AT-P04 alias resolves", () =>
    expect(matchProduct(cookie, demoConfig.products)).toMatchObject({
      status: "MATCHED",
      matches: [{ id: "cookies" }],
    }));
  it("AT-N01 unknown stays unmatched", () =>
    expect(
      matchProduct(
        { ...cookie, raw_name: "mystery bread" },
        demoConfig.products,
      ).status,
    ).toBe("UNMATCHED"));
  it("AT-N02 duplicate alias requires selection", () =>
    expect(
      matchProduct(cookie, [
        demoConfig.products[0],
        { ...demoConfig.products[0], id: "other" },
      ]).status,
    ).toBe("AMBIGUOUS"));
  it("AT-N03 malformed model output recoverable", () => {
    for (const text of ["hello", "{broken}", JSON.stringify({ items: [] })])
      expect(parseResponse(text).ok).toBe(false);
  });
  it("AT-N04 missing recipe no ingredient math", () => {
    expect(scaleRecipe(undefined, cookie)).toEqual({
      status: "UNRESOLVED",
      reason: "Recipe not configured",
    });
    render(<PrepSlip draft={fixture} config={demoConfig} />);
    expect(screen.getAllByText("Recipe not configured")).toHaveLength(2);
  });
  it("AT-N05 incomplete quote has no final total", () => {
    const result = summarize(fixture, demoConfig);
    expect(result.total).toBeNull();
    expect(result.text).toContain("Total pending price review");
    expect(result.text).not.toContain("Subtotal / total:");
  });
  it("AT-S01 dietary request warning without safety certification", () => {
    expect(summarize(fixture, demoConfig).text).toContain(dietaryWarning);
    expect(summarize(fixture, demoConfig).text).toContain(
      "Customer requested: Gluten-free",
    );
  });
  it("AT-L01 integer cents and unsafe values rejected", () => {
    expect(
      configSchema.safeParse({
        ...demoConfig,
        products: [
          {
            ...demoConfig.products[0],
            pricingTiers: [{ quantity: 24, unit: "each", priceCents: 30.01 }],
          },
        ],
      }).success,
    ).toBe(false);
    const d = {
      ...fixture,
      order: { ...fixture.order, items: [cookie, cookie, cookie] },
    };
    expect(summarize(d, demoConfig).total).toBe(9000);
  });
  it("AT-I01 validated representative demo JSON yields editable draft", async () => {
    const parsed = parseResponse(
      "```json\n" + JSON.stringify(fixture.order) + "\n```",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const onChange = vi.fn();
    render(
      <OrderReview
        draft={{ ...fixture, order: parsed.order }}
        config={demoConfig}
        onChange={onChange}
      />,
    );
    await userEvent.type(screen.getByLabelText("Customer name"), " X");
    expect(onChange).toHaveBeenCalled();
    expect(parsed.order.items[0].quantity).toBe(2);
    expect(parsed.order.items[1].customer_notes[0]).toContain("Tentative");
  });
  it("AT-I02 resolved quote copy-ready", () => {
    const result = summarize(
      { ...fixture, order: { ...fixture.order, items: [cookie] } },
      demoConfig,
    );
    expect(result.total).toBe(3000);
    expect(result.text).toContain("Subtotal / total: $30.00");
    expect(result.text).toContain("Sarah");
  });
  it("AT-I03 recipe-backed slip scaled grams and print action", () => {
    render(
      <PrepSlip
        draft={{
          ...fixture,
          order: { ...fixture.order, items: [{ ...cookie, quantity: 4 }] },
        }}
        config={{
          products: [{ ...demoConfig.products[0], recipeId: recipe.id }],
          recipes: [recipe],
        }}
      />,
    );
    expect(screen.getByText("Test ingredient A: 200 g")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Print Prep Slip" }),
    ).toBeTruthy();
  });
  it("AT-I04 no WebGPU allows startup and manual pricing", async () => {
    render(<App />);
    expect(screen.getByText(/WebGPU: unavailable/)).toBeTruthy();
    await userEvent.click(
      screen.getByRole("button", { name: "Add manual item" }),
    );
    await userEvent.type(screen.getByLabelText("Requested product"), "cookies");
    await userEvent.type(screen.getByLabelText("Quantity"), "24");
    expect(
      (screen.getByLabelText("Copy-ready draft") as HTMLTextAreaElement).value,
    ).toContain("$30.00");
  });
});
describe("boundary regressions", () => {
  it("no prices in model context", () =>
    expect(systemPrompt(demoConfig)).not.toContain("3000"));
  it("conflicting hint and raw match is ambiguous", () =>
    expect(
      matchProduct(
        { ...cookie, normalized_product_hint: "pecan pie" },
        demoConfig.products,
      ).status,
    ).toBe("AMBIGUOUS"));
  it("half dozen normalization but no invented small tier", () =>
    expect(
      priceItem(demoConfig.products[0], {
        ...cookie,
        quantity: 1,
        unit: "half_dozen",
      }).status,
    ).toBe("UNRESOLVED"));
  it("recipe unit mismatch unresolved", () =>
    expect(scaleRecipe(recipe, { ...cookie, unit: "pie" }).status).toBe(
      "UNRESOLVED",
    ));
  it("storage recovery and round trip", () => {
    window.localStorage.setItem("broken", "{");
    expect(readStored("broken", draftSchema, emptyDraft())).toEqual(
      emptyDraft(),
    );
    expect(saveStored("draft", fixture)).toBeNull();
    expect(readStored("draft", draftSchema, emptyDraft())).toEqual(fixture);
  });
  it("manual product selection clears review and updates quote", async () => {
    const change = vi.fn();
    render(
      <OrderReview
        draft={{ ...fixture, confirmed: true }}
        config={demoConfig}
        onChange={change}
      />,
    );
    await userEvent.selectOptions(
      screen.getAllByLabelText("Catalog product")[0],
      "pecan-pie",
    );
    expect(change.mock.lastCall?.[0].confirmed).toBe(false);
    expect(change.mock.lastCall?.[0].selections[0]).toBe("pecan-pie");
  });
});
