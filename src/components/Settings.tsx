import { useState } from "react";
import type { Config } from "../domain/types";
import { configSchema } from "../domain/schemas";
import { pickupPolicy, scheduleText } from "../domain/pickup";
export function Settings({
  config,
  save,
  reset,
}: {
  config: Config;
  save: (c: Config) => void;
  reset: () => void;
}) {
  const settingsText = () =>
    JSON.stringify({ ...config, pickup: pickupPolicy(config) }, null, 2);
  const [text, setText] = useState(settingsText);
  const [status, setStatus] = useState("");
  return (
    <section>
      <h2>Bakery settings</h2>
      <p>Pickup: {scheduleText(config)}</p>
      <p>
        The only seeded price is 24 cookies / 2 dozen = $30. Recipes and
        allergen metadata start unconfigured. Set exact tiers in integer cents.
        Recipes use base yields and ingredient grams.
      </p>
      <details>
        <summary>
          Edit products, aliases, price tiers, recipes and known allergens
        </summary>
        <label htmlFor="configuration">
          Validated bakery configuration (JSON)
        </label>
        <textarea
          className="code"
          id="configuration"
          rows={20}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="actions">
          <button
            onClick={() => {
              try {
                const next = configSchema.parse(JSON.parse(text));
                save(next);
                setStatus("Configuration saved. Order review reset.");
              } catch {
                setStatus(
                  "Invalid configuration. Use unique IDs, positive yields, valid units and integer price cents.",
                );
              }
            }}
          >
            Save Settings
          </button>
          <button
            onClick={() => {
              setText(settingsText());
              setStatus("Editor refreshed from saved settings.");
            }}
          >
            Reload saved settings
          </button>
        </div>
        <p role="status">{status}</p>
      </details>
      <button
        onClick={() => {
          if (
            window.confirm("Reset configuration and draft to demo defaults?")
          ) {
            reset();
            setText("");
            setStatus(
              "Demo defaults restored. Use Reload saved settings to edit.",
            );
          }
        }}
      >
        Reset Demo Data
      </button>
    </section>
  );
}
