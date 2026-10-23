# picom playground

From the repository root:

```sh
bun install
bun run playground
```

Open the URL printed by Vite. For a phone on the same trusted Wi-Fi network, use your computer's LAN IP and port 5173. The development server listens on all interfaces; don't expose it to the public internet.

```sh
bun run playground:build    # static site in playground/dist/
bun run playground:preview  # serve that build locally
```

Edit JavaScript on the left; see the model on the right. On narrow screens, switch between Code and Preview. Drag to orbit, scroll or pinch to zoom, and use Fit view to reset the camera. Wireframe reveals the geometry.

All core picom exports are in scope. Don't use imports; finish with `return describe(model, { ground: true });`. See the repository README for the library API. Three examples are included.

Auto-run waits briefly after typing. Turn it off to run manually, or press Ctrl/⌘ + Enter. Edits persist in local storage when available. Loading an example asks before replacing the current code. Failed runs keep the previous preview.

Each run uses a fresh worker with a 3-second timeout, keeping accidental infinite loops off the UI thread. This is **not a security sandbox**: scripts can use worker browser APIs, including networking. Only paste code you trust. Very large meshes can still exhaust memory or slow down rendering. JavaScript syntax/runtime errors are shown below the workspace.
