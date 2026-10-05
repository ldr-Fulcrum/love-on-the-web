import { useState } from "react";
export function CustomerQuote({ text }: { text: string }) {
  const [status, setStatus] = useState("");
  return (
    <section>
      <h2>3. Customer quote</h2>
      <label htmlFor="quote">Copy-ready draft</label>
      <textarea id="quote" rows={12} value={text} readOnly />
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setStatus("Quote copied.");
          } catch {
            setStatus("Clipboard unavailable. Select and copy the text above.");
          }
        }}
      >
        Copy Quote
      </button>
      <p role="status">{status}</p>
    </section>
  );
}
