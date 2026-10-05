import type { Config, Draft } from "./types";
import { matchProduct } from "./productMatching";
import { money, priceItem } from "./pricing";
import { scaleRecipe } from "./recipeScaling";
import { pickupSummary } from "./pickup";
export const dietaryWarning =
  "Verify ingredients and cross-contact procedures before confirming. Customer requests are not allergen safety certification.";
export function summarize(draft: Draft, config: Config) {
  const lines = draft.order.items.map((item, index) => {
    const match = matchProduct(item, config.products);
    const selected = draft.selections[index];
    const product = selected
      ? config.products.find((p) => p.id === selected && p.enabled)
      : match.status === "MATCHED"
        ? match.matches[0]
        : undefined;
    return {
      item,
      product,
      match,
      price: priceItem(product, item),
      recipe: scaleRecipe(
        config.recipes.find((r) => r.id === product?.recipeId),
        item,
      ),
    };
  });
  const sum = lines.reduce(
    (s, l) => s + (l.price.status === "RESOLVED" ? l.price.cents : 0),
    0,
  );
  const total =
    lines.length &&
    lines.every((l) => l.price.status === "RESOLVED") &&
    Number.isSafeInteger(sum)
      ? sum
      : null;
  const text = [
    `Draft quote${draft.confirmed ? " — operator reviewed" : " — awaiting operator review"}`,
    `Customer: ${draft.order.customer.name ?? "Not specified"}`,
    `Customer requested: ${draft.order.fulfillment.date_text ?? "Date not specified"} / ${draft.order.fulfillment.time_text ?? "Time not specified"}`,
    pickupSummary(draft, config),
    ...lines.map(
      (l) =>
        `${l.item.quantity ?? "?"} ${l.item.unit} ${l.product?.name ?? l.item.raw_name}: ${l.price.status === "RESOLVED" ? money(l.price.cents) : "Price review required"}${l.item.variation_notes.length ? " | " + l.item.variation_notes.join("; ") : ""}${l.item.dietary_notes.length ? " | Customer requested: " + l.item.dietary_notes.join("; ") : ""}${l.item.customer_notes.length ? " | " + l.item.customer_notes.join("; ") : ""}`,
    ),
    total === null
      ? "Total pending price review"
      : `Subtotal / total: ${money(total)} (configured items only; no tax, discounts or specialty surcharges configured)`,
    ...draft.order.general_notes,
    ...draft.order.ambiguities.map((a) => "Clarify: " + a),
    ...(draft.order.items.some((i) => i.dietary_notes.length)
      ? [dietaryWarning]
      : []),
    "This draft does not accept the order. Confirm availability, variations and fulfillment with the customer.",
  ].join("\n");
  return { lines, total, text };
}
