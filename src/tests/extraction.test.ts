import { describe, expect, it, vi } from "vitest";
import type { MLCEngine } from "@mlc-ai/web-llm";
import {
  extractionSchema,
  extractWithClient,
  OrderParseError,
} from "../ai/completion";
import { parseResponse } from "../ai/orderParser";
import { emptyDraft } from "../domain/types";
import { demoConfig, demoText } from "../data/demoConfig";

function clientFor(content: string, finish_reason = "stop") {
  const create = vi
    .fn()
    .mockResolvedValue({ choices: [{ message: { content }, finish_reason }] });
  return {
    create,
    client: { chat: { completions: { create } } } as unknown as Pick<
      MLCEngine,
      "chat"
    >,
  };
}
describe("structured extraction boundary (mock transport, not inference proof)", () => {
  it("sends the contract as a JSON constraint on every request", async () => {
    const { client, create } = clientFor(JSON.stringify(emptyDraft().order));
    await extractWithClient(client, demoText, demoConfig);
    const request = create.mock.calls[0][0];
    expect(request.response_format.type).toBe("json_object");
    expect(JSON.parse(request.response_format.schema)).toEqual(
      extractionSchema,
    );
    expect(request.messages[1].content).toBe(demoText);
    expect(request.messages[0].content).not.toContain("3000");
  });
  it("reports malformed output and preserves the actual response", async () => {
    const { client } = clientFor("not JSON");
    await expect(
      extractWithClient(client, demoText, demoConfig),
    ).rejects.toMatchObject({
      name: "OrderParseError",
      diagnostics: { rawResponse: "not JSON", finishReason: "stop" },
    });
  });
  it("reports field paths without inventing missing fields", () => {
    const result = parseResponse(
      JSON.stringify({ customer: { name: "Sarah" }, items: [] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues.some((i) => i.startsWith("customer.phone:"))).toBe(
        true,
      );
  });
  it("rejects length-truncated output even if it happens to form JSON", async () => {
    const { client } = clientFor(JSON.stringify(emptyDraft().order), "length");
    await expect(
      extractWithClient(client, demoText, demoConfig),
    ).rejects.toMatchObject({ diagnostics: { finishReason: "length" } });
  });
  it("rejects invalid quantities without relaxing validation", async () => {
    const order = emptyDraft().order;
    order.items = [
      {
        raw_name: "cookies",
        normalized_product_hint: null,
        quantity: 0,
        unit: "each",
        variation_notes: [],
        dietary_notes: [],
        customer_notes: [],
      },
    ];
    const { client } = clientFor(JSON.stringify(order));
    await expect(
      extractWithClient(client, demoText, demoConfig),
    ).rejects.toBeInstanceOf(OrderParseError);
  });
});
