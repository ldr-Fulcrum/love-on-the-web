import { useEffect, useState } from "react";
import { demoConfig } from "./data/demoConfig";
import { emptyDraft, type Config, type Draft } from "./domain/types";
import {
  configSchema,
  draftSchema,
  readStored,
  saveStored,
} from "./storage/configStore";
import { summarize } from "./domain/quote";
import { OrderIntake } from "./components/OrderIntake";
import { OrderReview } from "./components/OrderReview";
import { CustomerQuote } from "./components/CustomerQuote";
import { PrepSlip } from "./components/PrepSlip";
import { Settings } from "./components/Settings";
import { ModelStatus } from "./components/ModelStatus";
import { OrderParseError, type ParseDiagnostics } from "./ai/completion";
import {
  MODEL_ID,
  extractOrder,
  loadModel,
  webgpuAvailable,
} from "./ai/webllm";
export default function App() {
  const [config, setConfig] = useState<Config>(() =>
    readStored("crumbcraft.config.v1", configSchema, demoConfig),
  );
  const [draft, setDraft] = useState<Draft>(() => ({
    ...readStored("crumbcraft.draft.v1", draftSchema, emptyDraft()),
    confirmed: false,
  }));
  const [text, setText] = useState("");
  const [status, setStatus] = useState("unloaded");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [diagnostics, setDiagnostics] = useState<ParseDiagnostics | null>(null);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    setStorageError(
      saveStored("crumbcraft.config.v1", config) ??
        saveStored("crumbcraft.draft.v1", draft) ??
        "",
    );
  }, [config, draft]);
  async function load() {
    setBusy(true);
    setStatus("loading");
    setError("");
    try {
      await loadModel(setProgress);
      setStatus("ready");
      setProgress("Local Gemma ready.");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Model load failed.");
    } finally {
      setBusy(false);
    }
  }
  async function parse() {
    setBusy(true);
    setError("");
    setDiagnostics(null);
    try {
      const order = await extractOrder(text, config);
      setDraft({ order, selections: {}, confirmed: false });
    } catch (e) {
      if (e instanceof OrderParseError) setDiagnostics(e.diagnostics);
      setError(
        e instanceof Error
          ? e.message
          : "Parsing failed. Manual entry remains available.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header>
        <div>
          <h1>CrumbCraft</h1>
          <p>The Baker’s Sentry</p>
        </div>
        <span>Local Gemma · {status}</span>
      </header>
      <main>
        <p className="principle">
          AI interprets. Code calculates. Human confirms.
        </p>
        {error && (
          <p role="alert" className="warning">
            {error}
          </p>
        )}
        {storageError && (
          <p role="alert" className="warning">
            {storageError}
          </p>
        )}
        {diagnostics && (
          <details className="no-print">
            <summary>Local parser diagnostics</summary>
            <p>
              This response stays in this session. Share only synthetic test
              orders.
            </p>
            <p>Finish reason: {diagnostics.finishReason}</p>
            <ul>
              {diagnostics.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
            <label htmlFor="parser-response">Raw model response</label>
            <textarea
              id="parser-response"
              readOnly
              rows={10}
              value={diagnostics.rawResponse}
            />
          </details>
        )}
        <div className="intake-layout">
          <OrderIntake
            text={text}
            setText={setText}
            parse={() => void parse()}
            busy={busy}
            ready={status === "ready"}
          />
          <ModelStatus
            status={status}
            model={MODEL_ID}
            progress={progress}
            supported={webgpuAvailable()}
            load={() => void load()}
            busy={busy}
          />
        </div>
        <OrderReview draft={draft} config={config} onChange={setDraft} />
        <div className="output-layout">
          <CustomerQuote text={summarize(draft, config).text} />
          <PrepSlip draft={draft} config={config} />
        </div>
        <Settings
          config={config}
          save={(c) => {
            setConfig(c);
            setDraft((d) => ({ ...d, confirmed: false }));
          }}
          reset={() => {
            setConfig(structuredClone(demoConfig));
            setDraft(emptyDraft());
          }}
        />
        <footer>
          Customer drafts and bakery settings stay in this browser. Clear or
          reset them on shared devices. No order is accepted automatically.
        </footer>
      </main>
    </>
  );
}
