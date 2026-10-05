import type { Config } from "../domain/types";
export const demoText =
  "Hey Dani, this is Sarah. Can I get 2 dozen chocolate chip cookies for next Friday afternoon? Make one dozen gluten-free if you can. I may also need a 9-inch pecan pie.";
export const demoConfig: Config = {
  products: [
    {
      id: "cookies",
      name: "Chocolate chip cookies",
      aliases: ["cookies", "chocolate chip cookie"],
      sellingUnit: "each",
      pricingTiers: [{ quantity: 24, unit: "each", priceCents: 3000 }],
      recipeId: null,
      knownAllergens: [],
      enabled: true,
    },
    {
      id: "pecan-pie",
      name: "9-inch pecan pie",
      aliases: ["pecan pie"],
      sellingUnit: "pie",
      pricingTiers: [],
      recipeId: null,
      knownAllergens: [],
      enabled: true,
    },
  ],
  recipes: [],
};
