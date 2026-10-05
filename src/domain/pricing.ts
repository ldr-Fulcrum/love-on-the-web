import type { BakeryProduct, OrderItem, Unit } from "./types";
export function normalizeYield(quantity: number, unit: Unit) {
  return {
    quantity:
      quantity * (unit === "dozen" ? 12 : unit === "half_dozen" ? 6 : 1),
    unit: unit === "dozen" || unit === "half_dozen" ? "each" : unit,
  };
}
export type Price =
  | { status: "RESOLVED"; cents: number; explanation: string }
  | { status: "UNRESOLVED"; explanation: string };
export function priceItem(
  product: BakeryProduct | undefined,
  item: OrderItem,
): Price {
  if (
    !product ||
    !product.enabled ||
    item.quantity === null ||
    !Number.isFinite(item.quantity) ||
    item.quantity <= 0 ||
    item.unit === "unknown"
  )
    return {
      status: "UNRESOLVED",
      explanation: "Select a product and enter a valid quantity/unit.",
    };
  const requested = normalizeYield(item.quantity, item.unit);
  if (!Number.isInteger(requested.quantity))
    return {
      status: "UNRESOLVED",
      explanation: "Whole selling units required.",
    };
  const tiers = product.pricingTiers.filter((t) => {
    const n = normalizeYield(t.quantity, t.unit);
    return n.unit === requested.unit && n.quantity === requested.quantity;
  });
  if (tiers.length !== 1 || !Number.isSafeInteger(tiers[0].priceCents))
    return {
      status: "UNRESOLVED",
      explanation: "Price review required: configure one exact quantity tier.",
    };
  return {
    status: "RESOLVED",
    cents: tiers[0].priceCents,
    explanation: `Configured ${tiers[0].quantity} ${tiers[0].unit} tier`,
  };
}
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
