import type { Config, Draft } from "../domain/types";
import {
  captureReference,
  checkPickup,
  isPickupDate,
  pickupPolicy,
  relativeDateCandidates,
  scheduleText,
} from "../domain/pickup";
export function PickupReview({
  draft,
  config,
  onChange,
}: {
  draft: Draft;
  config: Config;
  onChange: (d: Draft) => void;
}) {
  const checked = checkPickup(draft, config);
  const candidates = relativeDateCandidates(
    draft.order.fulfillment.date_text ?? "",
    draft.reference?.receivedDate ?? "",
  );
  return (
    <fieldset>
      <legend>Pickup location and schedule</legend>
      <p>{scheduleText(config)}</p>
      <p>
        Agree a date and exact time with the customer. Requested wording is
        preserved; unavailable dates are never moved automatically.
      </p>
      {draft.reference ? (
        <>
          <p>
            Parsed at {draft.reference.parsedAt} · reference timezone{" "}
            {draft.reference.timeZone}
          </p>
          <label>
            Message received date
            <input
              type="date"
              value={draft.reference.receivedDate}
              onChange={(e) =>
                onChange({
                  ...draft,
                  confirmed: false,
                  pickup: {
                    time: draft.pickup?.time ?? null,
                    confirmed: false,
                  },
                  reference: {
                    ...draft.reference!,
                    receivedDate: e.target.value,
                  },
                })
              }
            />
          </label>
          {candidates.length > 0 && (
            <p className="warning">
              “Next” weekday needs clarification:{" "}
              {candidates
                .map(
                  (date) =>
                    `${date}${isPickupDate(date, config) ? " (pickup day)" : " (pickup unavailable)"}`,
                )
                .join(" or ")}
              . These are suggestions, not confirmed pickup dates.
            </p>
          )}
        </>
      ) : (
        <button
          onClick={() =>
            onChange({
              ...draft,
              reference: captureReference(config),
              confirmed: false,
            })
          }
        >
          Use today's date as message reference
        </button>
      )}
      <label>
        Confirmed pickup time ({pickupPolicy(config).timeZone})
        <input
          type="time"
          value={draft.pickup?.time ?? ""}
          onChange={(e) =>
            onChange({
              ...draft,
              confirmed: false,
              pickup: { time: e.target.value || null, confirmed: false },
            })
          }
        />
      </label>
      <p role="status" className={checked.valid ? "" : "warning"}>
        {checked.reason}
      </p>
      <label className="check">
        <input
          type="checkbox"
          disabled={!checked.valid}
          checked={checked.valid && (draft.pickup?.confirmed ?? false)}
          onChange={(e) =>
            onChange({
              ...draft,
              confirmed: false,
              pickup: {
                time: draft.pickup?.time ?? null,
                confirmed: e.target.checked,
              },
            })
          }
        />{" "}
        I confirmed this pickup date, time and location with the customer.
      </label>
    </fieldset>
  );
}
