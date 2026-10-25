import { demoText } from "../data/demoConfig";
export function OrderIntake({
  text,
  setText,
  parse,
  busy,
  ready,
}: {
  text: string;
  setText: (v: string) => void;
  parse: () => void;
  busy: boolean;
  ready: boolean;
}) {
  return (
    <section>
      <h2>1. Order intake</h2>
      <p>
        Paste a customer message. Local Gemma extracts a draft for your review.
      </p>
      <label htmlFor="message">Customer message</label>
      <textarea
        id="message"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste an order here…"
      />
      <div className="actions">
        <button onClick={() => setText(demoText)}>Load Demo Order</button>
        <button
          className="primary"
          disabled={!ready || busy || !text.trim()}
          onClick={parse}
        >
          {busy ? "Parsing…" : "Parse with Local Gemma"}
        </button>
      </div>
      <p className="muted">
        No WebGPU? Add items manually below. Demo text is an example, never a
        precomputed parser response.
      </p>
    </section>
  );
}
