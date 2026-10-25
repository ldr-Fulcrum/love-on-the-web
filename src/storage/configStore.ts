import { z } from "zod";
import { configSchema, orderSchema } from "../domain/schemas";
import type { Config, Draft } from "../domain/types";
export const draftSchema = z.object({
  order: orderSchema,
  selections: z.record(z.string(), z.string()),
  confirmed: z.boolean(),
  reference: z
    .object({
      parsedAt: z.string(),
      receivedDate: z.string(),
      timeZone: z.string(),
    })
    .optional(),
  pickup: z
    .object({ time: z.string().nullable(), confirmed: z.boolean() })
    .optional(),
});
export function readStored<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  try {
    const text = window.localStorage.getItem(key);
    return text ? schema.parse(JSON.parse(text)) : fallback;
  } catch {
    return fallback;
  }
}
export function saveStored(key: string, value: Config | Draft) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return null;
  } catch {
    return "Local storage unavailable or full. Changes remain in this session only.";
  }
}
export { configSchema };
