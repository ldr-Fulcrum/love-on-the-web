import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  captureReference,
  checkPickup,
  defaultPickupPolicy,
  localDate,
  pickupSummary,
  relativeDateCandidates,
} from "../domain/pickup";
import { demoConfig } from "../data/demoConfig";
import { emptyDraft, type Draft } from "../domain/types";
import { summarize } from "../domain/quote";
import { configSchema } from "../domain/schemas";
import { draftSchema } from "../storage/configStore";
import { PickupReview } from "../components/PickupReview";
import { OrderReview } from "../components/OrderReview";
import { PrepSlip } from "../components/PrepSlip";
afterEach(cleanup);
const draftAt = (date: string, time: string): Draft => ({
  ...emptyDraft(),
  order: {
    ...emptyDraft().order,
    fulfillment: {
      date_text: "next Friday afternoon",
      date_iso: date,
      time_text: "afternoon",
      method: "pickup",
    },
  },
  pickup: { time, confirmed: false },
  reference: {
    parsedAt: "2026-10-05T17:00:00Z",
    receivedDate: "2026-10-05",
    timeZone: "America/Chicago",
  },
});
describe("LDR pickup contract", () => {
  it.each([
    ["2026-10-07", "16:00"],
    ["2026-10-07", "19:00"],
    ["2026-10-10", "13:00"],
    ["2026-10-10", "16:00"],
  ])("permits %s at %s Central", (date, time) =>
    expect(checkPickup(draftAt(date, time), demoConfig).valid).toBe(true),
  );
  it.each([
    ["2026-10-07", "15:59"],
    ["2026-10-07", "19:01"],
    ["2026-10-10", "12:59"],
    ["2026-10-10", "16:01"],
    ["2026-10-09", "16:00"],
    ["2026-02-30", "16:00"],
  ])("rejects %s at %s without moving it", (date, time) => {
    const draft = draftAt(date, time);
    expect(checkPickup(draft, demoConfig).valid).toBe(false);
    expect(draft.order.fulfillment.date_iso).toBe(date);
  });
  it("captures the business date near UTC midnight and DST", () => {
    expect(localDate(new Date("2026-10-06T01:00:00Z"), "America/Chicago")).toBe(
      "2026-10-05",
    );
    expect(localDate(new Date("2026-11-02T05:30:00Z"), "America/Chicago")).toBe(
      "2026-11-01",
    );
    expect(
      captureReference(demoConfig, new Date("2026-10-06T01:00:00Z"))
        .receivedDate,
    ).toBe("2026-10-05");
  });
  it("next Friday has two candidates; an older message uses its own reference", () => {
    expect(
      relativeDateCandidates("next Friday afternoon", "2026-10-05"),
    ).toEqual(["2026-10-09", "2026-10-16"]);
    expect(relativeDateCandidates("next Friday", "2026-09-28")).toEqual([
      "2026-10-02",
      "2026-10-09",
    ]);
  });
  it("valid schedule is not a customer-confirmed pickup until explicitly reviewed", () => {
    const draft = draftAt("2026-10-07", "17:00");
    expect(pickupSummary(draft, demoConfig)).toContain(
      "Pickup review required",
    );
    draft.pickup!.confirmed = true;
    expect(pickupSummary(draft, demoConfig)).toContain(
      "Pickup reviewed: 2026-10-07 at 5 PM",
    );
    expect(summarize(draft, demoConfig).text).toContain(
      "WinCo parking lot, Midwest City",
    );
  });
  it("legacy configuration/drafts survive and invalid policy is rejected", () => {
    const legacy = { products: demoConfig.products, recipes: [] };
    expect(configSchema.safeParse(legacy).success).toBe(true);
    expect(draftSchema.safeParse(emptyDraft()).success).toBe(true);
    expect(pickupSummary(draftAt("2026-10-09", "17:00"), legacy)).toContain(
      defaultPickupPolicy.location,
    );
    expect(
      configSchema.safeParse({
        ...demoConfig,
        pickup: {
          ...defaultPickupPolicy,
          windows: [{ weekday: 3, start: "19:00", end: "16:00" }],
        },
      }).success,
    ).toBe(false);
  });
  it("Friday candidates are visibly unavailable and cannot be confirmed", () => {
    render(
      <PickupReview
        draft={draftAt("2026-10-09", "17:00")}
        config={demoConfig}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/2026-10-09 \(pickup unavailable\)/)).toBeTruthy();
    expect(
      (
        screen.getByLabelText(
          "I confirmed this pickup date, time and location with the customer.",
        ) as HTMLInputElement
      ).disabled,
    ).toBe(true);
  });
  it("editing order date revokes pickup confirmation", async () => {
    const draft = draftAt("2026-10-07", "17:00");
    draft.pickup!.confirmed = true;
    const change = vi.fn();
    render(<OrderReview draft={draft} config={demoConfig} onChange={change} />);
    await userEvent.clear(screen.getByLabelText("Confirmed date (ISO)"));
    expect(change.mock.lastCall?.[0].pickup.confirmed).toBe(false);
  });
  it("print slip carries location and confirmed date/time", () => {
    const draft = draftAt("2026-10-10", "14:00");
    draft.pickup!.confirmed = true;
    render(<PrepSlip draft={draft} config={demoConfig} />);
    expect(
      screen.getByText(
        /Pickup reviewed: 2026-10-10 at 2 PM.*WinCo parking lot/,
      ),
    ).toBeTruthy();
  });
});
