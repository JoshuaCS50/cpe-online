// Explorer: the list of files in the project, with create, rename and delete.

import { dateStamp, downloadFile, pickTextFiles } from "../storage/device-files";
import { createZip } from "../storage/zip";
import { button, el } from "./dom";
import { icon } from "./icons";
import type { Workspace } from "./workspace";

export interface ExplorerOptions {
  workspace: Workspace;
  /** Called after the user picks a file (phones switch to the editor). */
  onOpen: () => void;
}

export function createExplorer(host: HTMLElement, options: ExplorerOptions): void {
  const { workspace, onOpen } = options;
  let renamingId: string | null = null;
  let renameError: string | null = null;

  const list = el("ul", { class: "file-list", role: "list" });
  const title = el("span", { class: "side-title" }, ["Explorer"]);
  const actions = el("div", { class: "side-actions" }, [
    button({
      label: "New file",
      icon: "plus",
      class: "btn btn-icon btn-quiet",
      onClick: async () => {
        const file = await workspace.createFile();
        renamingId = file.id;
        renameError = null;
        render();
      },
    }),
    button({
      label: "Open files from this device",
      icon: "upload",
      class: "btn btn-icon btn-quiet",
      onClick: async () => {
        const picked = await pickTextFiles();
        for (const file of picked) await workspace.addFile(file.name, file.text);
        if (picked.length > 0) onOpen();
      },
    }),
    button({
      label: "Save the open file to this device",
      icon: "download",
      class: "btn btn-icon btn-quiet",
      onClick: async () => {
        const file = workspace.activeFile;
        if (!file) return;
        await workspace.flush();
        downloadFile(file.name, file.doc);
      },
    }),
    button({
      label: "Save all files as one zip",
      icon: "fileZip",
      class: "btn btn-icon btn-quiet",
      onClick: async () => {
        if (workspace.files.length === 0) return;
        await workspace.flush();
        const archive = createZip(workspace.files.map((file) => ({ name: file.name, text: file.doc })));
        downloadFile(`cpe-online-files-${dateStamp()}.zip`, archive);
      },
    }),
  ]);
  const header = el("div", { class: "side-header" }, [title, actions]);
  const project = el("div", { class: "side-project" });
  host.append(header, project, list);

  function renameRow(id: string, currentName: string): HTMLLIElement {
    const input = el("input", {
      class: "file-rename",
      type: "text",
      value: currentName,
      "aria-label": "File name",
      autocapitalize: "off",
      autocomplete: "off",
      spellcheck: "false",
    });
    const row = el("li", { class: "file-row is-renaming" }, [icon("fileCode"), input]);
    if (renameError) row.append(el("p", { class: "file-error", role: "alert" }, [renameError]));

    let finished = false;
    async function commit(): Promise<void> {
      if (finished) return;
      const error = await workspace.rename(id, input.value);
      if (error) {
        renameError = error;
        render();
        return;
      }
      finished = true;
      renamingId = null;
      renameError = null;
      render();
    }
    function cancel(): void {
      finished = true;
      renamingId = null;
      renameError = null;
      render();
    }
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void commit();
      else if (event.key === "Escape") cancel();
    });
    input.addEventListener("blur", () => void commit());

    queueMicrotask(() => {
      input.focus();
      // Select the name without the extension, so typing replaces just that.
      const dot = currentName.lastIndexOf(".");
      input.setSelectionRange(0, dot > 0 ? dot : currentName.length);
    });
    return row;
  }

  function fileRow(id: string, name: string, active: boolean): HTMLLIElement {
    const open = el("button", { type: "button", class: "file-open", "aria-current": active ? "true" : undefined }, [
      icon("fileCode"),
      el("span", { class: "file-name" }, [name]),
    ]);
    open.addEventListener("click", () => {
      workspace.open(id);
      onOpen();
    });
    const actions = el("span", { class: "file-actions" }, [
      button({
        label: `Rename ${name}`,
        icon: "pencil",
        class: "btn btn-icon btn-quiet",
        onClick: () => {
          renamingId = id;
          renameError = null;
          render();
        },
      }),
      button({
        label: `Delete ${name}`,
        icon: "trash",
        class: "btn btn-icon btn-quiet",
        onClick: () => {
          if (window.confirm(`Delete ${name}? This cannot be undone.`)) void workspace.remove(id);
        },
      }),
    ]);
    return el("li", { class: active ? "file-row is-active" : "file-row" }, [open, actions]);
  }

  function render(): void {
    project.textContent = workspace.project.name;
    const activeId = workspace.activeFile?.id ?? null;
    list.replaceChildren(
      ...workspace.files.map((file) =>
        file.id === renamingId ? renameRow(file.id, file.name) : fileRow(file.id, file.name, file.id === activeId),
      ),
    );
    if (workspace.files.length === 0) {
      list.append(el("li", { class: "side-empty" }, ["No files yet. Use the plus button above to create one."]));
    }
  }

  workspace.subscribe(render);
  render();
}
