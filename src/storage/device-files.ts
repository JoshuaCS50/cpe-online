// Moving files between the app and the user's device.

/** File types offered when opening from the device. */
export const OPENABLE_EXTENSIONS = ".c,.cpp,.cc,.cxx,.h,.hpp,.hh,.py,.java,.m,.txt,.csv,.tsv,.dat,.log,.json,.md";

/** Saves `contents` to the device's downloads as `name`. */
export function downloadFile(name: string, contents: string | Blob, mime = "text/plain"): void {
  const blob = typeof contents === "string" ? new Blob([contents], { type: mime }) : contents;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // The download starts asynchronously; give it time before freeing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Asks the user to pick files and resolves with their names and text. */
export function pickTextFiles(): Promise<{ name: string; text: string }[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = OPENABLE_EXTENSIONS;
    input.addEventListener("change", () => {
      const picked = [...(input.files ?? [])];
      void Promise.all(picked.map(async (file) => ({ name: file.name, text: await file.text() }))).then(resolve);
    });
    // Closing the picker without choosing anything.
    input.addEventListener("cancel", () => resolve([]));
    input.click();
  });
}

/** Today's date as YYYY-MM-DD, for backup file names. */
export function dateStamp(now: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
