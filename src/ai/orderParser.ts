import { orderSchema } from "../domain/schemas";
export function parseResponse(text: string) {
  try {
    const clean = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    return { ok: true as const, order: orderSchema.parse(JSON.parse(clean)) };
  } catch {
    return {
      ok: false as const,
      error:
        "Gemma returned an invalid order draft. Retry or enter the order manually.",
    };
  }
}
