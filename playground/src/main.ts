import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting, indentOnInput } from "@codemirror/language";
import type { Description } from "../../src/types.js";
import { examples } from "./examples.js";
import { Preview } from "./preview.js";
import "./style.css";

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing element: ${id}`);
  return value as T;
}
const status = element("status");
const errorBox = element("error");
const live = element<HTMLInputElement>("live");
const storageKey = "picom.playground.code.v1";
let source = examples["Desk sculpture"];
try { source = localStorage.getItem(storageKey) ?? source; } catch { /* Storage may be blocked. */ }
let preview: Preview | undefined;
try {
  preview = new Preview(element("viewport"));
} catch (error) {
  element("viewport").textContent = "3D preview needs WebGL. Try another browser or enable hardware acceleration.";
  errorBox.textContent = String(error);
  errorBox.hidden = false;
}
let worker: Worker | undefined;
let timeout: ReturnType<typeof setTimeout> | undefined;
let debounce: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
let storageFailed = false;
const editor = new EditorView({
  parent: element("editor"),
  state: EditorState.create({
    doc: source,
    extensions: [
      lineNumbers(), history(), drawSelection(), highlightActiveLine(),
      javascript(), bracketMatching(), indentOnInput(), syntaxHighlighting(defaultHighlightStyle),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": "Model JavaScript code", spellcheck: "false", autocapitalize: "off", autocorrect: "off" }),
      keymap.of([{ key: "Mod-Enter", run: () => { run(); return true; } }, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.theme({ "&": { height: "100%", backgroundColor: "transparent", color: "#d4deee" }, ".cm-scroller": { overflow: "auto", fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: "13px", lineHeight: "1.7" }, ".cm-content": { padding: "18px 0", caretColor: "#a8e4c0" }, ".cm-gutters": { backgroundColor: "transparent", color: "#677489", border: "none" }, ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#ffffff06" }, "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "#34506c !important" }, ".cm-cursor": { borderLeftColor: "#a8e4c0" } }, { dark: true }),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        try { localStorage.setItem(storageKey, update.state.doc.toString()); storageFailed = false; } catch { storageFailed = true; }
        cancelRun();
        clearTimeout(debounce);
        status.textContent = storageFailed ? "Edited · local saving unavailable" : "Edited · saved on this device";
        if (live.checked) debounce = setTimeout(run, 650);
      }),
    ],
  }),
});

function cancelRun() {
  revision++;
  worker?.terminate();
  worker = undefined;
  clearTimeout(timeout);
}
function showError(message: string) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  status.textContent = "Couldn't build · previous preview kept";
}
function run() {
  clearTimeout(debounce);
  cancelRun();
  const current = revision;
  errorBox.hidden = true;
  status.textContent = "Building…";
  const start = performance.now();
  try {
    worker = new Worker(new URL("./runner.worker.ts", import.meta.url), { type: "module" });
    timeout = setTimeout(() => {
      cancelRun();
      showError("Execution stopped after 3 seconds. Check for an infinite loop or reduce the model complexity.");
    }, 3000);
    worker.onmessage = (event: MessageEvent<{ description?: Description; error?: string }>) => {
      if (current !== revision) return;
      cancelRun();
      if (event.data.error) { showError(event.data.error); return; }
      try {
        const description = event.data.description!;
        preview?.setModel(description);
        element("model-name").textContent = description.name;
        const parts = description.assemblies.reduce((sum, a) => sum + a.parts.length, 0);
        element("stats").textContent = `${parts} parts · ${description.triangleCount.toLocaleString()} triangles`;
        status.textContent = `${preview ? "Updated" : "Built · WebGL unavailable"} in ${Math.round(performance.now() - start)} ms${storageFailed ? " · not saved" : ""}`;
      } catch (error) { showError(String(error)); }
    };
    worker.onerror = (event) => { event.preventDefault(); if (current !== revision) return; cancelRun(); showError(event.message || "Worker failed to start."); };
    worker.postMessage(editor.state.doc.toString());
  } catch (error) { cancelRun(); showError(String(error)); }
}

element("run").addEventListener("click", run);
live.addEventListener("change", () => { clearTimeout(debounce); if (live.checked) run(); });
element("fit").addEventListener("click", () => preview?.fit());
element("wireframe").addEventListener("click", (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const enabled = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(enabled));
  preview?.setWireframe(enabled);
});
const select = element<HTMLSelectElement>("examples");
for (const name of Object.keys(examples)) select.add(new Option(name, name));
select.addEventListener("change", () => {
  if (!select.value) return;
  if (editor.state.doc.toString() !== examples[select.value] && !confirm("Replace your code with this example? Your current edits will be overwritten.")) { select.value = ""; return; }
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: examples[select.value] } });
  select.value = "";
  run();
});
for (const view of ["code", "preview"]) {
  element(`${view}-tab`).addEventListener("click", () => {
    document.querySelector<HTMLElement>(".workspace")!.dataset.view = view;
    element("code-tab").setAttribute("aria-pressed", String(view === "code"));
    element("preview-tab").setAttribute("aria-pressed", String(view === "preview"));
    if (view === "code") editor.requestMeasure();
  });
}
window.addEventListener("pagehide", () => { cancelRun(); clearTimeout(debounce); });
window.addEventListener("pageshow", (event) => { if (event.persisted) run(); });
run();
