// Entry point. The new IDE shell is being built next to the original app and
// is opened with ?shell=2 until it has every feature the original has.

const useNewShell = new URLSearchParams(window.location.search).get("shell") === "2";

if (useNewShell) {
  const { bootShell } = await import("./shell/shell");
  await bootShell();
} else {
  await import("./legacy/css/app.css");
  await import("./legacy/js/app.js");
}

export {};

// index.html hides the page until its styles are in, to avoid a flash of
// unstyled markup.
document.documentElement.dataset.ready = "true";
