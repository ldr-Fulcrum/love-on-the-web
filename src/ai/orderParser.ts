import { orderSchema } from "../domain/schemas";
export function parseResponse(text: string) {
  const clean = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let candidate: unknown;
  try {
    candidate = JSON.parse(clean);
  } catch {
    return {
      ok: false as const,
      error:
        "Gemma returned malformed JSON. Retry or enter the order manually.",
      issues: ["Response is not a complete JSON object."],
    };
  }
  const parsed = orderSchema.safeParse(candidate);
  if (parsed.success) return { ok: true as const, order: parsed.data };
  return {
    ok: false as const,
    error:
      "Gemma returned invalid order fields. Retry or enter the order manually.",
    issues: parsed.error.issues.map(
      (i) => `${i.path.join(".") || "order"}: ${i.message}`,
    ),
  };
}
