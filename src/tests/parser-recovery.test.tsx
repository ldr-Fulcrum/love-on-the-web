import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { emptyDraft } from "../domain/types";
import { OrderParseError } from "../ai/completion";
vi.mock("../ai/webllm", () => ({
  MODEL_ID: "gemma-2-2b-it-q4f16_1-MLC",
  webgpuAvailable: () => true,
  loadModel: vi.fn().mockResolvedValue(undefined),
  extractOrder: vi.fn(),
}));
import { extractOrder } from "../ai/webllm";
import App from "../App";
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.clearAllMocks();
});
it("failed extraction preserves the previous draft and exposes local diagnostics, then recovers", async () => {
  const draft = emptyDraft();
  draft.order.customer.name = "Existing draft";
  window.localStorage.setItem("crumbcraft.draft.v1", JSON.stringify(draft));
  vi.mocked(extractOrder).mockRejectedValueOnce(
    new OrderParseError("Invalid fields", {
      rawResponse: '{"customer":{}}',
      finishReason: "stop",
      issues: ["customer.name: missing"],
    }),
  );
  render(<App />);
  await userEvent.click(
    screen.getByRole("button", { name: "Load Local Gemma" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Load Demo Order" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Parse with Local Gemma" }),
  );
  expect(
    (screen.getByLabelText("Customer name") as HTMLInputElement).value,
  ).toBe("Existing draft");
  expect(
    (screen.getByLabelText("Raw model response") as HTMLTextAreaElement).value,
  ).toBe('{"customer":{}}');
  expect(window.localStorage.getItem("crumbcraft.draft.v1")).not.toContain(
    "finishReason",
  );
  const corrected = emptyDraft().order;
  corrected.customer.name = "New valid draft";
  vi.mocked(extractOrder).mockResolvedValueOnce(corrected);
  await userEvent.click(
    screen.getByRole("button", { name: "Parse with Local Gemma" }),
  );
  expect(
    (screen.getByLabelText("Customer name") as HTMLInputElement).value,
  ).toBe("New valid draft");
  expect(screen.queryByLabelText("Raw model response")).toBeNull();
});
