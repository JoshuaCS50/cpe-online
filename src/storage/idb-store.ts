// IndexedDB AppStore: projects, files and settings that survive reloads.

import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import { createMemoryStore } from "./memory-store";
import { assertValidSnapshot, sortByCreation } from "./types";
import type { AppStore, FileRecord, ProjectRecord, StoreSnapshot } from "./types";

export const DATABASE_NAME = "cpe-online";
const DATABASE_VERSION = 1;

interface Schema extends DBSchema {
  projects: { key: string; value: ProjectRecord };
  files: { key: string; value: FileRecord; indexes: { byProject: string } };
  /** Settings and small flags, keyed by name. */
  kv: { key: string; value: unknown };
}

function wrap(db: IDBPDatabase<Schema>): AppStore {
  return {
    persistent: true,
    async listProjects() {
      return sortByCreation(await db.getAll("projects"));
    },
    getProject: (id) => db.get("projects", id),
    async putProject(project) {
      await db.put("projects", project);
    },
    async deleteProject(id) {
      const tx = db.transaction(["projects", "files"], "readwrite");
      const fileKeys = await tx.objectStore("files").index("byProject").getAllKeys(id);
      await Promise.all([
        tx.objectStore("projects").delete(id),
        ...fileKeys.map((key) => tx.objectStore("files").delete(key)),
        tx.done,
      ]);
    },
    async listFiles(projectId) {
      return sortByCreation(await db.getAllFromIndex("files", "byProject", projectId));
    },
    getFile: (id) => db.get("files", id),
    async putFile(file) {
      await db.put("files", file);
    },
    async deleteFile(id) {
      await db.delete("files", id);
    },
    async getValue<T>(key: string) {
      return (await db.get("kv", key)) as T | undefined;
    },
    async setValue(key, value) {
      await db.put("kv", value, key);
    },
    async importSnapshot(snapshot: StoreSnapshot) {
      assertValidSnapshot(snapshot);
      // One transaction: if any write fails, IndexedDB rolls all of them back.
      const tx = db.transaction(["projects", "files", "kv"], "readwrite");
      await Promise.all([
        ...snapshot.projects.map((project) => tx.objectStore("projects").put(project)),
        ...snapshot.files.map((file) => tx.objectStore("files").put(file)),
        ...Object.entries(snapshot.values).map(([key, value]) => tx.objectStore("kv").put(value, key)),
        tx.done,
      ]);
    },
    close: () => db.close(),
  };
}

export async function openIdbStore(name: string = DATABASE_NAME): Promise<AppStore> {
  const db = await openDB<Schema>(name, DATABASE_VERSION, {
    upgrade(database) {
      database.createObjectStore("projects", { keyPath: "id" });
      const files = database.createObjectStore("files", { keyPath: "id" });
      files.createIndex("byProject", "projectId");
      database.createObjectStore("kv");
    },
  });
  return wrap(db);
}

/**
 * Opens the device store. If the browser has no IndexedDB or refuses to open
 * it, the app still works for this visit on an in-memory store; check
 * `persistent` to warn the user that nothing will be kept.
 */
export async function openStore(name: string = DATABASE_NAME): Promise<AppStore> {
  if (typeof indexedDB === "undefined") return createMemoryStore();
  try {
    return await openIdbStore(name);
  } catch (error) {
    console.warn("IndexedDB unavailable; files will not be kept after this visit.", error);
    return createMemoryStore();
  }
}
