import { createServer } from "vite";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

// External kernel is supplied explicitly; no private kernel source is copied into this MIT app.
const kernelPath = process.env.CRUMBCRAFT_CONTRADICTOR_PATH;
const evidenceRoot = process.env.CRUMBCRAFT_CONTRADICTOR_EVIDENCE;
if (!kernelPath || !evidenceRoot)
  throw new Error(
    "Set CRUMBCRAFT_CONTRADICTOR_PATH and CRUMBCRAFT_CONTRADICTOR_EVIDENCE.",
  );
const kernelHash = createHash("sha256")
  .update(readFileSync(kernelPath))
  .digest("hex");
const expectedKernel =
  "59f56724a2e8b62a673633de2381900180914b50dd852e2b5c34e85486642715";
if (kernelHash !== expectedKernel)
  throw new Error(
    "Kernel differs from the inspected version; review and repin explicitly.",
  );
const dirty = execFileSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
}).trim();
if (dirty)
  throw new Error(
    "Commit the candidate first; Contradictor evidence must bind to clean committed code.",
  );
const build = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const executableHash =
  "sha256:" +
  createHash("sha256")
    .update(readFileSync(new URL(import.meta.url)))
    .digest("hex");
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const kernel = await server.ssrLoadModule(resolve(kernelPath));
  const { emptyDraft, emptyItem } = await server.ssrLoadModule(
    resolve("src/domain/types.ts"),
  );
  const { demoConfig } = await server.ssrLoadModule(
    resolve("src/data/demoConfig.ts"),
  );
  const { summarize } = await server.ssrLoadModule(
    resolve("src/domain/quote.ts"),
  );
  const { checkPickup, relativeDateCandidates } = await server.ssrLoadModule(
    resolve("src/domain/pickup.ts"),
  );
  const { parseResponse } = await server.ssrLoadModule(
    resolve("src/ai/orderParser.ts"),
  );
  const { draftSchema } = await server.ssrLoadModule(
    resolve("src/storage/configStore.ts"),
  );
  const cookie = {
    ...emptyItem(),
    raw_name: "cookies",
    quantity: 2,
    unit: "dozen",
  };
  const order = (date = "2026-10-07", time = "17:00", confirmed = false) => ({
    mode: "order",
    draft: {
      ...emptyDraft(),
      order: {
        ...emptyDraft().order,
        fulfillment: {
          date_text: "next Friday afternoon",
          date_iso: date,
          time_text: "afternoon",
          method: "pickup",
        },
        items: [cookie],
      },
      pickup: { time, confirmed },
    },
  });
  let state = null,
    subject = "";
  const adapter = {
    descriptor: {
      tool_id: "crumbcraft",
      tool_build: build,
      adapter_id: "crumbcraft-domain",
      adapter_version: "1.0.0",
      capabilities: ["current-result"],
    },
    async newSession(label) {
      subject = label;
      state = null;
    },
    async submit(input) {
      const data = JSON.parse(input);
      let observed;
      if (data.mode === "parse")
        observed = { validDraft: parseResponse(data.response).ok };
      else if (data.mode === "relative")
        observed = {
          candidates: relativeDateCandidates(data.text, data.reference),
        };
      else {
        const draft = draftSchema.parse(data.draft),
          result = summarize(draft, demoConfig);
        observed = {
          total: result.total,
          pickupValid: checkPickup(draft, demoConfig).valid,
          quote: result.text,
          matches: result.lines.map((l) => l.match.status),
          recipes: result.lines.map((l) => l.recipe.status),
          date: draft.order.fulfillment.date_iso,
        };
      }
      state = {
        status: "observed",
        subjectId: subject,
        observedAt: kernel.timestamp(),
        currentResultText: JSON.stringify(observed),
        semanticSnapshot: { schema: "crumbcraft.domain.v1", data: observed },
      };
      return state;
    },
    async readLiveState() {
      if (!state) throw new Error("No submission in this session");
      return state;
    },
  };
  const cases = [
    [
      "CC01",
      "Two dozen configured cookies resolve to exactly 3000 integer cents",
      order(),
      (d) => d.total === 3000,
    ],
    [
      "CC02",
      "An unpriced pie suppresses the final total",
      {
        ...order(),
        draft: {
          ...order().draft,
          order: {
            ...order().draft.order,
            items: [
              cookie,
              {
                ...emptyItem(),
                raw_name: "pecan pie",
                quantity: 1,
                unit: "pie",
              },
            ],
          },
        },
      },
      (d) => d.total === null && d.quote.includes("Total pending price review"),
    ],
    [
      "CC03",
      "Unknown product is unmatched",
      {
        ...order(),
        draft: {
          ...order().draft,
          order: {
            ...order().draft.order,
            items: [{ ...cookie, raw_name: "unknown bread" }],
          },
        },
      },
      (d) => d.matches[0] === "UNMATCHED" && d.total === null,
    ],
    [
      "CC04",
      "Missing recipes produce no scaling result",
      order(),
      (d) => d.recipes[0] === "UNRESOLVED",
    ],
    [
      "CC05",
      "Malformed model output is rejected",
      { mode: "parse", response: "not JSON" },
      (d) => d.validDraft === false,
    ],
    [
      "CC06",
      "Wrong model field types are rejected",
      {
        mode: "parse",
        response: JSON.stringify({ customer: "Sarah", items: [] }),
      },
      (d) => d.validDraft === false,
    ],
    [
      "CC07",
      "Friday pickup is rejected without date substitution",
      order("2026-10-09"),
      (d) => d.pickupValid === false && d.date === "2026-10-09",
    ],
    [
      "CC08",
      "Wednesday before 4 PM is rejected",
      order("2026-10-07", "15:59"),
      (d) => d.pickupValid === false,
    ],
    [
      "CC09",
      "Saturday after 4 PM is rejected",
      order("2026-10-10", "16:01"),
      (d) => d.pickupValid === false,
    ],
    [
      "CC10",
      "Valid slot remains pending without human pickup confirmation",
      order(),
      (d) =>
        d.pickupValid &&
        d.quote.includes("Pickup review required") &&
        !d.quote.includes("Pickup reviewed:"),
    ],
    [
      "CC11",
      "Reviewed pickup includes exact location and date/time",
      order("2026-10-07", "17:00", true),
      (d) =>
        d.quote.includes(
          "Pickup reviewed: 2026-10-07 at 5 PM (America/Chicago) · WinCo parking lot, Midwest City",
        ),
    ],
    [
      "CC12",
      "Next Friday preserves two candidate dates for clarification",
      {
        mode: "relative",
        text: "next Friday afternoon",
        reference: "2026-10-05",
      },
      (d) => JSON.stringify(d.candidates) === '["2026-10-09","2026-10-16"]',
    ],
  ];
  const probes = cases.map(([id, expected, fixture, check]) => ({
    id,
    probe_version: "1.0.0",
    kind: "categorical",
    invariantClass: "Insufficiency Gating",
    target: "CrumbCraft deterministic domain boundary",
    expected,
    definitionContext: { executable_hash: executableHash, fixture },
    input: () => JSON.stringify(fixture),
    assertion: (obs) => ({
      pass: check(obs.semanticSnapshot.data),
      evidence: JSON.stringify(obs.semanticSnapshot.data),
    }),
  }));
  const store = new kernel.FileExecutionStore(resolve(evidenceRoot));
  const rows = await kernel.runAllProbes(
    adapter,
    {
      toolName: "CrumbCraft",
      buildVersion: build,
      categories: ["Orders", "Pickup"],
      knownRiskAreas: [],
      inputSurfaces: ["Validated draft", "Parser response", "Date reference"],
    },
    probes,
    { store },
  );
  const summary = {
    candidate: build,
    kernelSHA256: kernelHash,
    adapterExecutable: executableHash,
    scope:
      "Deterministic domain only; not real Gemma inference, UI, independent acceptance or release",
    passed: rows.filter((r) => r.execution_state === "passed").length,
    total: rows.length,
    rows,
  };
  writeFileSync(
    resolve(evidenceRoot, "summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
    { flag: "wx" },
  );
  console.log(
    JSON.stringify({
      candidate: build,
      passed: summary.passed,
      total: summary.total,
      evidence: resolve(evidenceRoot),
    }),
  );
  if (summary.passed !== summary.total) process.exitCode = 1;
} finally {
  await server.close();
}
