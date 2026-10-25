import type { MLCEngine } from "@mlc-ai/web-llm";
import { z } from "zod";
import { orderSchema } from "../domain/schemas";
import type { Config } from "../domain/types";
import { systemPrompt } from "./prompt";
import { parseResponse } from "./orderParser";

// Derive generation shape from the same frozen schema used for runtime validation.
export const extractionSchema = z.toJSONSchema(orderSchema, {
  target: "draft-7",
});
export type ParseDiagnostics = {
  rawResponse: string;
  issues: string[];
  finishReason: string;
};
export class OrderParseError extends Error {
  constructor(
    message: string,
    public diagnostics: ParseDiagnostics,
  ) {
    super(message);
    this.name = "OrderParseError";
  }
}

export async function extractWithClient(
  client: Pick<MLCEngine, "chat">,
  text: string,
  config: Config,
) {
  const completion = await client.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt(config) },
      { role: "user", content: text },
    ],
    stream: false,
    temperature: 0.1,
    max_tokens: 2048,
    response_format: {
      type: "json_object",
      schema: JSON.stringify(extractionSchema),
    },
  });
  const choice = completion.choices[0];
  const rawResponse = choice?.message.content ?? "";
  const finishReason = choice?.finish_reason ?? "missing choice";
  if (finishReason === "length") {
    throw new OrderParseError(
      "Gemma's response was cut short. Try a shorter order or enter it manually.",
      {
        rawResponse,
        finishReason,
        issues: [
          "Output/context token limit reached. Partial drafts are not accepted.",
        ],
      },
    );
  }
  const parsed = parseResponse(rawResponse);
  if (!parsed.ok)
    throw new OrderParseError(parsed.error, {
      rawResponse,
      finishReason,
      issues: parsed.issues,
    });
  return parsed.order;
}
