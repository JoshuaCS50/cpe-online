// Entry point: start the IDE shell, then the service worker that makes the
// app work offline.

import { registerServiceWorker } from "./pwa/register";
import { bootShell } from "./shell/shell";

await bootShell();

// index.html hides the page until its styles are in, to avoid a flash of
// unstyled markup.
document.documentElement.dataset.ready = "true";

registerServiceWorker(() => document.dispatchEvent(new CustomEvent("cpe:updated")));
