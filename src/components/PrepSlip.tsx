import type { Config, Draft } from "../domain/types";
import { dietaryWarning, summarize } from "../domain/quote";
import { pickupSummary } from "../domain/pickup";
export function PrepSlip({ draft, config }: { draft: Draft; config: Config }) {
  const { lines } = summarize(draft, config);
  return (
    <section className="prep">
      <h2>Kitchen prep slip</h2>
      <p>
        <strong>
          {draft.confirmed
            ? "Operator reviewed draft"
            : "DRAFT — review required"}
        </strong>
      </p>
      <p>
        {draft.order.customer.name ?? "Customer not specified"} ·{" "}
        {draft.order.fulfillment.date_iso ??
          draft.order.fulfillment.date_text ??
          "Date review required"}{" "}
        · {draft.order.fulfillment.time_text ?? "Time review required"} ·{" "}
        {draft.order.fulfillment.method}
      </p>
      <p>{pickupSummary(draft, config)}</p>
      {lines.map((l, i) => (
        <div className="prep-line" key={i}>
          <h3>
            {l.item.quantity ?? "?"} {l.item.unit} ·{" "}
            {l.product?.name ?? l.item.raw_name}
          </h3>
          {l.item.variation_notes.map((n, j) => (
            <p key={j}>Variation: {n}</p>
          ))}
          {l.item.customer_notes.map((n, j) => (
            <p key={j}>Customer note: {n}</p>
          ))}
          {l.item.dietary_notes.map((n, j) => (
            <p key={j}>Customer requested: {n}</p>
          ))}
          <p>
            Bakery-known allergens:{" "}
            {l.product?.knownAllergens.length
              ? l.product.knownAllergens.join(", ")
              : "Not configured; not an absence-of-allergens claim"}
          </p>
          {l.recipe.status === "RESOLVED" ? (
            <>
              <p>
                Base yield {l.recipe.baseYield}; requested{" "}
                {l.recipe.requestedYield}; scale factor{" "}
                {l.recipe.factor.toFixed(3)}. Grams rounded to nearest integer.
              </p>
              <ul>
                {l.recipe.ingredients.map((g, j) => (
                  <li key={j}>
                    {g.name}: {g.grams} g
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>{l.recipe.reason}</p>
          )}
        </div>
      ))}
      {draft.order.general_notes.map((n, i) => (
        <p key={i}>{n}</p>
      ))}
      {draft.order.ambiguities.map((n, i) => (
        <p key={i}>Clarify: {n}</p>
      ))}
      <p className="warning">{dietaryWarning}</p>
      <button className="no-print" onClick={() => window.print()}>
        Print Prep Slip
      </button>
    </section>
  );
}
