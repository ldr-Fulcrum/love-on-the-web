import type { MLCEngine } from "@mlc-ai/web-llm";
import type { Config } from "../domain/types";
import { systemPrompt } from "./prompt";
import { parseResponse } from "./orderParser";
// Verified against WebLLM 0.2.85 prebuiltAppConfig; rechecked when loaded.
export const MODEL_ID = "gemma-2-2b-it-q4f16_1-MLC";
export const webgpuAvailable = () =>
  typeof navigator !== "undefined" && "gpu" in navigator;
let engine: MLCEngine | undefined;
export async function loadModel(progress: (text: string) => void) {
  if (!webgpuAvailable())
    throw new Error("WebGPU unavailable. Manual entry remains available.");
  const { CreateMLCEngine, prebuiltAppConfig } =
    await import("@mlc-ai/web-llm");
  if (!prebuiltAppConfig.model_list.some((m) => m.model_id === MODEL_ID))
    throw new Error(
      "Supported Gemma 2 2B model missing from installed WebLLM.",
    );
  engine = await CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (r) => progress(r.text),
  });
}
export async function extractOrder(text: string, config: Config) {
  if (!engine) throw new Error("Load Local Gemma first.");
  const completion = await engine.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt(config) },
      { role: "user", content: text },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });
  const result = parseResponse(completion.choices[0]?.message.content ?? "");
  if (!result.ok) throw new Error(result.error);
  return result.order;
}
