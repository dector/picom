import * as picom from "../../src/index.js";

// A fresh worker is created for every run, then terminated by the host.
// This isolates accidental loops, not malicious code. No imports are supported.
globalThis.onmessage = (event: MessageEvent<string>) => {
  try {
    const names = Object.keys(picom);
    const evaluate = new Function(...names, `"use strict";\n${event.data}`);
    const result = evaluate(...Object.values(picom));
    if (!result || typeof result !== "object" || !Array.isArray(result.assemblies)) {
      throw new Error("Return a model description: return describe(model, { ground: true });");
    }
    // Revalidate the returned model, even when code didn't call describe().
    const description = picom.describe(result);
    globalThis.postMessage({ description });
  } catch (error) {
    globalThis.postMessage({ error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) });
  }
};
