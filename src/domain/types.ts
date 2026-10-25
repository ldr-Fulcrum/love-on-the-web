import { z } from "zod";
import { configSchema, itemSchema, orderSchema, unitSchema } from "./schemas";
export type OrderIntent = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof itemSchema>;
export type Config = z.infer<typeof configSchema>;
export type BakeryProduct = Config["products"][number];
export type Recipe = Config["recipes"][number];
export type Unit = z.infer<typeof unitSchema>;
export type Draft = {
  order: OrderIntent;
  selections: Record<number, string>;
  confirmed: boolean;
  reference?: { parsedAt: string; receivedDate: string; timeZone: string };
  pickup?: { time: string | null; confirmed: boolean };
};
export const emptyItem = (): OrderItem => ({
  raw_name: "",
  normalized_product_hint: null,
  quantity: null,
  unit: "each",
  variation_notes: [],
  dietary_notes: [],
  customer_notes: [],
});
export const emptyDraft = (): Draft => ({
  order: {
    customer: { name: null, phone: null, email: null },
    fulfillment: {
      date_text: null,
      date_iso: null,
      time_text: null,
      method: "unknown",
    },
    items: [],
    general_notes: [],
    ambiguities: [],
  },
  selections: {},
  confirmed: false,
});
