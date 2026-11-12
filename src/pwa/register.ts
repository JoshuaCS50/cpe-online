// Registers the service worker (public/sw.js, filled in at build time) and
// tells the user when a new version of the app has been installed.

/** Called once when an updated app is ready and a reload would switch to it. */
export function registerServiceWorker(onUpdated?: () => void): void {
  // The dev server serves modules that change constantly; caching them there
  // would only cause confusion.
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;

  // A page already under a worker's control is seeing an update, not a first install.
  const hadController = navigator.serviceWorker.controller !== null;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) onUpdated?.();
  });

  // Relative URL: the app may be served from a sub-folder.
  navigator.serviceWorker.register("sw.js").catch((error: unknown) => {
    console.warn("Offline support could not be set up:", error);
  });
}
