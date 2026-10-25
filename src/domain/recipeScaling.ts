import type { Recipe, OrderItem } from "./types";
import { normalizeYield } from "./pricing";
export function scaleRecipe(recipe: Recipe | undefined, item: OrderItem) {
  if (!recipe)
    return { status: "UNRESOLVED" as const, reason: "Recipe not configured" };
  if (
    item.quantity === null ||
    item.quantity <= 0 ||
    !Number.isFinite(item.quantity)
  )
    return {
      status: "UNRESOLVED" as const,
      reason: "Quantity review required",
    };
  const requested = normalizeYield(item.quantity, item.unit),
    base = normalizeYield(recipe.baseYield, recipe.yieldUnit);
  if (
    requested.unit !== base.unit ||
    requested.unit === "unknown" ||
    !Number.isInteger(requested.quantity)
  )
    return {
      status: "UNRESOLVED" as const,
      reason: "Recipe yield unit mismatch",
    };
  const factor = requested.quantity / base.quantity;
  return {
    status: "RESOLVED" as const,
    baseYield: base.quantity,
    requestedYield: requested.quantity,
    factor,
    ingredients: recipe.ingredients.map((i) => ({
      ...i,
      grams: Math.round(i.grams * factor),
    })),
  };
}
