// Tab strip above the editor: one tab per open file.

import { el } from "./dom";
import { icon } from "./icons";
import type { Workspace } from "./workspace";

export function createEditorTabs(host: HTMLElement, workspace: Workspace): void {
  host.setAttribute("role", "tablist");
  host.setAttribute("aria-label", "Open files");

  function render(): void {
    const activeId = workspace.activeFile?.id ?? null;
    const byId = new Map(workspace.files.map((file) => [file.id, file]));

    host.replaceChildren(
      ...workspace.openIds.flatMap((id) => {
        const file = byId.get(id);
        if (!file) return [];
        const active = id === activeId;

        const select = el(
          "button",
          { type: "button", class: "tab-select", role: "tab", "aria-selected": active ? "true" : "false" },
          [file.name],
        );
        select.addEventListener("click", () => workspace.open(id));
        // Middle click closes, as in desktop editors.
        select.addEventListener("auxclick", (event) => {
          if (event.button === 1) workspace.closeTab(id);
        });

        const close = el("button", { type: "button", class: "tab-close", "aria-label": `Close ${file.name}` }, [
          icon("x"),
        ]);
        close.addEventListener("click", () => workspace.closeTab(id));

        const tab = el("div", { class: active ? "tab is-active" : "tab" }, [select, close]);
        if (active) queueMicrotask(() => tab.scrollIntoView({ block: "nearest", inline: "nearest" }));
        return [tab];
      }),
    );
  }

  workspace.subscribe(render);
  render();
}
