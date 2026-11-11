// The open project: its files, which ones are open in tabs, and which one is
// active. Views subscribe and re-render; all changes go through here so the
// device store and the screen cannot drift apart.

import { extensionForLanguage, languageFromFilename } from "../storage/file-types";
import type { AppStore, FileRecord, ProjectRecord } from "../storage/types";

const OPEN_TABS_KEY = "workspace.openTabs";
const SAVE_DELAY_MS = 400;

const HELLO_C = `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`;

export interface Workspace {
  readonly project: ProjectRecord;
  readonly files: readonly FileRecord[];
  readonly openIds: readonly string[];
  readonly activeFile: FileRecord | null;
  subscribe(listener: () => void): () => void;
  /** Opens the file in a tab if needed and makes it active. */
  open(id: string): void;
  /** Closes the tab. The file itself stays in the project. */
  closeTab(id: string): void;
  createFile(): Promise<FileRecord>;
  /** Returns an error message for the user, or null on success. */
  rename(id: string, name: string): Promise<string | null>;
  remove(id: string): Promise<void>;
  /** Records an edit; the store is updated shortly after typing stops. */
  updateDoc(id: string, doc: string): void;
  /** Writes pending edits now. */
  flush(): Promise<void>;
}

function newId(): string {
  return crypto.randomUUID();
}

function uniqueName(taken: ReadonlySet<string>, base: string, extension: string): string {
  let name = `${base}.${extension}`;
  for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base}-${n}.${extension}`;
  return name;
}

export async function openWorkspace(store: AppStore): Promise<Workspace> {
  let project = (await store.listProjects())[0];
  if (!project) {
    const now = Date.now();
    const id = newId();
    const hello: FileRecord = {
      id: newId(),
      projectId: id,
      name: "hello.c",
      language: "c",
      doc: HELLO_C,
      createdAt: now,
      savedAt: now,
    };
    project = { id, name: "My files", createdAt: now, activeFileId: hello.id };
    await store.importSnapshot({ projects: [project], files: [hello], values: {} });
  }
  const current: ProjectRecord = project;

  let files = await store.listFiles(current.id);
  const known = new Set(files.map((file) => file.id));
  const savedTabs = (await store.getValue<string[]>(OPEN_TABS_KEY)) ?? [];
  let openIds = savedTabs.filter((id) => known.has(id));
  let activeId = current.activeFileId !== null && known.has(current.activeFileId) ? current.activeFileId : null;
  if (activeId === null) activeId = openIds[0] ?? files[0]?.id ?? null;
  if (activeId !== null && !openIds.includes(activeId)) openIds = [...openIds, activeId];

  const listeners = new Set<() => void>();
  const dirty = new Set<string>();
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const find = (id: string): FileRecord | undefined => files.find((file) => file.id === id);
  const notify = (): void => listeners.forEach((listener) => listener());

  /** Remembers the tab layout. Failures here must not interrupt editing. */
  function persistLayout(): void {
    current.activeFileId = activeId;
    void store.putProject(current).catch(console.warn);
    void store.setValue(OPEN_TABS_KEY, openIds).catch(console.warn);
  }

  async function flush(): Promise<void> {
    clearTimeout(saveTimer);
    const pending = [...dirty];
    dirty.clear();
    await Promise.all(
      pending.map((id) => {
        const file = find(id);
        return file ? store.putFile(file) : Promise.resolve();
      }),
    );
  }

  const workspace: Workspace = {
    get project() {
      return current;
    },
    get files() {
      return files;
    },
    get openIds() {
      return openIds;
    },
    get activeFile() {
      return activeId === null ? null : (find(activeId) ?? null);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open(id) {
      if (!find(id)) return;
      if (!openIds.includes(id)) openIds = [...openIds, id];
      activeId = id;
      persistLayout();
      notify();
    },
    closeTab(id) {
      const index = openIds.indexOf(id);
      if (index < 0) return;
      openIds = openIds.filter((open) => open !== id);
      // Like a desktop editor: closing the active tab activates its neighbour.
      if (activeId === id) activeId = openIds[index] ?? openIds[index - 1] ?? null;
      persistLayout();
      notify();
    },
    async createFile() {
      const language = workspace.activeFile?.language ?? "c";
      const taken = new Set(files.map((file) => file.name.toLowerCase()));
      const now = Date.now();
      const file: FileRecord = {
        id: newId(),
        projectId: current.id,
        name: uniqueName(taken, "untitled", extensionForLanguage(language)),
        language,
        doc: "",
        createdAt: now,
        savedAt: now,
      };
      await store.putFile(file);
      files = [...files, file];
      workspace.open(file.id);
      return file;
    },
    async rename(id, name) {
      const file = find(id);
      const trimmed = name.trim();
      if (!file) return "That file no longer exists.";
      if (trimmed === "") return "A file needs a name.";
      if (/[\\/]/.test(trimmed)) return "File names cannot contain slashes.";
      const clash = files.some((other) => other.id !== id && other.name.toLowerCase() === trimmed.toLowerCase());
      if (clash) return `"${trimmed}" already exists.`;
      file.name = trimmed;
      file.language = languageFromFilename(trimmed);
      file.savedAt = Date.now();
      await store.putFile(file);
      notify();
      return null;
    },
    async remove(id) {
      if (!find(id)) return;
      dirty.delete(id);
      await store.deleteFile(id);
      files = files.filter((file) => file.id !== id);
      if (openIds.includes(id)) workspace.closeTab(id);
      else notify();
    },
    updateDoc(id, doc) {
      const file = find(id);
      if (!file || file.doc === doc) return;
      file.doc = doc;
      file.savedAt = Date.now();
      dirty.add(id);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => void flush().catch(console.warn), SAVE_DELAY_MS);
    },
    flush,
  };
  return workspace;
}
