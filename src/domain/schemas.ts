import { z } from "zod";
export const unitSchema = z.enum([
  "each",
  "dozen",
  "half_dozen",
  "pie",
  "cake",
  "tray",
  "unknown",
]);
const nullableText = z.string().max(1000).nullable();
const notes = z.array(z.string().max(2000)).max(50);
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const pickupPolicySchema = z.object({
  location: z.string().min(1),
  timeZone: z.string().refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Use a valid IANA timezone"),
  windows: z
    .array(
      z
        .object({
          weekday: z.number().int().min(0).max(6),
          start: clockTime,
          end: clockTime,
        })
        .refine(
          (w) => w.start < w.end,
          "Pickup window must end after it starts",
        ),
    )
    .min(1),
});
export const itemSchema = z.object({
  raw_name: z.string().max(1000),
  normalized_product_hint: nullableText,
  quantity: z.number().positive().finite().max(100000).nullable(),
  unit: unitSchema,
  variation_notes: notes,
  dietary_notes: notes,
  customer_notes: notes,
});
export const orderSchema = z.object({
  customer: z.object({
    name: nullableText,
    phone: nullableText,
    email: nullableText,
  }),
  fulfillment: z.object({
    date_text: nullableText,
    date_iso: nullableText,
    time_text: nullableText,
    method: z.enum(["pickup", "delivery", "unknown"]),
  }),
  items: z.array(itemSchema).max(100),
  general_notes: notes,
  ambiguities: notes,
});
export const configSchema = z
  .object({
    pickup: pickupPolicySchema.optional(),
    products: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        aliases: z.array(z.string()),
        sellingUnit: unitSchema,
        pricingTiers: z.array(
          z.object({
            quantity: z.number().positive().finite(),
            unit: unitSchema,
            priceCents: z
              .number()
              .int()
              .nonnegative()
              .max(Number.MAX_SAFE_INTEGER),
          }),
        ),
        recipeId: z.string().nullable(),
        knownAllergens: z.array(z.string()),
        enabled: z.boolean(),
      }),
    ),
    recipes: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        baseYield: z.number().positive().finite(),
        yieldUnit: unitSchema,
        ingredients: z.array(
          z.object({
            name: z.string().min(1),
            grams: z.number().nonnegative().finite(),
          }),
        ),
      }),
    ),
  })
  .superRefine((c, ctx) => {
    for (const key of ["products", "recipes"] as const) {
      if (new Set(c[key].map((x) => x.id)).size !== c[key].length)
        ctx.addIssue({ code: "custom", message: `Duplicate ${key} IDs` });
    }
  });
