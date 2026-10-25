import type { BakeryProduct, OrderItem } from "./types";
const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ");
export function matchProduct(item: OrderItem, products: BakeryProduct[]) {
  const terms = [item.raw_name, item.normalized_product_hint ?? ""]
    .map(normalize)
    .filter(Boolean);
  const matches = products.filter(
    (p) =>
      p.enabled &&
      [p.name, ...p.aliases].some((a) => terms.includes(normalize(a))),
  );
  return {
    status:
      matches.length === 1
        ? "MATCHED"
        : matches.length
          ? "AMBIGUOUS"
          : "UNMATCHED",
    matches,
  } as const;
}
