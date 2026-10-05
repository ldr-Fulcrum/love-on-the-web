export function ModelStatus({
  status,
  model,
  progress,
  supported,
  load,
  busy,
}: {
  status: string;
  model: string;
  progress: string;
  supported: boolean;
  load: () => void;
  busy: boolean;
}) {
  return (
    <section className="model">
      <h2>Local model</h2>
      <p>
        WebGPU:{" "}
        {supported ? "available (adapter checked on load)" : "unavailable"} ·
        Model: <strong>{status}</strong>
      </p>
      <p className="muted">
        {model || "Supported model configuration unavailable"}
      </p>
      <p>
        First use downloads model assets online. Inference runs on this device;
        offline reuse depends on browser caching.
      </p>
      <button
        onClick={load}
        disabled={!supported || busy || status === "ready"}
      >
        Load Local Gemma
      </button>
      <p role="status" aria-live="polite">
        {progress}
      </p>
    </section>
  );
}
