import type { Config, Draft, OrderItem, OrderIntent } from "../domain/types";
import { emptyItem } from "../domain/types";
import { matchProduct } from "../domain/productMatching";
import { PickupReview } from "./PickupReview";
export function OrderReview({
  draft,
  config,
  onChange,
}: {
  draft: Draft;
  config: Config;
  onChange: (d: Draft) => void;
}) {
  const update = (order: OrderIntent, selections = draft.selections) =>
    onChange({
      ...draft,
      order,
      selections,
      confirmed: false,
      pickup: { time: draft.pickup?.time ?? null, confirmed: false },
    });
  const editItem = (index: number, patch: Partial<OrderItem>) => {
    const selections = { ...draft.selections };
    if ("raw_name" in patch) {
      delete selections[index];
      patch.normalized_product_hint = null;
    }
    update(
      {
        ...draft.order,
        items: draft.order.items.map((i, n) =>
          n === index ? { ...i, ...patch } : i,
        ),
      },
      selections,
    );
  };
  return (
    <section>
      <h2>2. Review order</h2>
      <p>
        Correct the draft, clarify tentative requests, and verify dietary
        variations before confirming.
      </p>
      <div className="fields">
        {(["name", "phone", "email"] as const).map((key) => (
          <label key={key}>
            Customer {key}
            <input
              value={draft.order.customer[key] ?? ""}
              onChange={(e) =>
                update({
                  ...draft.order,
                  customer: {
                    ...draft.order.customer,
                    [key]: e.target.value || null,
                  },
                })
              }
            />
          </label>
        ))}
        {(["date_text", "date_iso", "time_text"] as const).map((key) => (
          <label key={key}>
            {key === "date_text"
              ? "Requested date"
              : key === "date_iso"
                ? "Confirmed date (ISO)"
                : "Requested time"}
            <input
              value={draft.order.fulfillment[key] ?? ""}
              type={key === "date_iso" ? "date" : "text"}
              onChange={(e) =>
                update({
                  ...draft.order,
                  fulfillment: {
                    ...draft.order.fulfillment,
                    [key]: e.target.value || null,
                  },
                })
              }
            />
          </label>
        ))}
        <label>
          Fulfillment method
          <select
            value={draft.order.fulfillment.method}
            onChange={(e) =>
              update({
                ...draft.order,
                fulfillment: {
                  ...draft.order.fulfillment,
                  method: e.target
                    .value as OrderIntent["fulfillment"]["method"],
                },
              })
            }
          >
            {["unknown", "pickup", "delivery"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <PickupReview draft={draft} config={config} onChange={onChange} />
      {draft.order.items.map((item, index) => {
        const match = matchProduct(item, config.products);
        const selected =
          draft.selections[index] ??
          (match.status === "MATCHED" ? match.matches[0].id : "");
        return (
          <fieldset key={index}>
            <legend>Line {index + 1}</legend>
            <div className="fields">
              <label>
                Requested product
                <input
                  value={item.raw_name}
                  onChange={(e) =>
                    editItem(index, { raw_name: e.target.value })
                  }
                />
              </label>
              <label>
                Catalog product
                <select
                  value={selected}
                  onChange={(e) =>
                    update(draft.order, {
                      ...draft.selections,
                      [index]: e.target.value || "__unselected__",
                    })
                  }
                >
                  <option value="">
                    {match.status === "MATCHED"
                      ? "Select product"
                      : match.status}
                  </option>
                  <option value="__unselected__">Require product review</option>
                  {config.products
                    .filter((p) => p.enabled)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="0.01"
                  max="100000"
                  step="any"
                  value={item.quantity ?? ""}
                  onChange={(e) =>
                    editItem(index, {
                      quantity: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label>
                Unit
                <select
                  value={item.unit}
                  onChange={(e) =>
                    editItem(index, {
                      unit: e.target.value as OrderItem["unit"],
                    })
                  }
                >
                  {[
                    "each",
                    "dozen",
                    "half_dozen",
                    "pie",
                    "cake",
                    "tray",
                    "unknown",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              {(
                ["variation_notes", "dietary_notes", "customer_notes"] as const
              ).map((key) => (
                <label key={key}>
                  {key === "variation_notes"
                    ? "Variations"
                    : key === "dietary_notes"
                      ? "Customer dietary/allergen requests"
                      : "Customer notes / tentative request"}
                  <textarea
                    rows={2}
                    value={item[key].join("\n")}
                    onChange={(e) =>
                      editItem(index, {
                        [key]: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                const selections: Draft["selections"] = {};
                draft.order.items.forEach((_, i) => {
                  if (i !== index && draft.selections[i])
                    selections[i > index ? i - 1 : i] = draft.selections[i];
                });
                update(
                  {
                    ...draft.order,
                    items: draft.order.items.filter((_, i) => i !== index),
                  },
                  selections,
                );
              }}
            >
              Remove line {index + 1}
            </button>
          </fieldset>
        );
      })}
      <button
        onClick={() =>
          update({ ...draft.order, items: [...draft.order.items, emptyItem()] })
        }
      >
        Add manual item
      </button>
      <div className="fields">
        {(["general_notes", "ambiguities"] as const).map((key) => (
          <label key={key}>
            {key === "ambiguities" ? "Ambiguities to clarify" : "General notes"}
            <textarea
              rows={3}
              value={draft.order[key].join("\n")}
              onChange={(e) =>
                update({
                  ...draft.order,
                  [key]: e.target.value.split("\n").filter(Boolean),
                })
              }
            />
          </label>
        ))}
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.confirmed}
          onChange={(e) => onChange({ ...draft, confirmed: e.target.checked })}
        />{" "}
        I reviewed quantities, dates, variations, dietary requests and
        unresolved items. This does not accept the order.
      </label>
    </section>
  );
}
