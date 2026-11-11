// In-memory AppStore. Used when IndexedDB is unavailable, and in tests.
// Records are cloned on the way in and out, as IndexedDB does, so callers
// cannot change stored data by mutating an object they hold.

import { assertValidSnapshot, sortByCreation } from "./types";
import type { AppStore, FileRecord, ProjectRecord, StoreSnapshot } from "./types";

export function createMemoryStore(): AppStore {
  const projects = new Map<string, ProjectRecord>();
  const files = new Map<string, FileRecord>();
  const values = new Map<string, unknown>();

  return {
    persistent: false,
    async listProjects() {
      return sortByCreation([...projects.values()].map((p) => structuredClone(p)));
    },
    async getProject(id) {
      return structuredClone(projects.get(id));
    },
    async putProject(project) {
      projects.set(project.id, structuredClone(project));
    },
    async deleteProject(id) {
      projects.delete(id);
      for (const file of [...files.values()]) {
        if (file.projectId === id) files.delete(file.id);
      }
    },
    async listFiles(projectId) {
      const own = [...files.values()].filter((file) => file.projectId === projectId);
      return sortByCreation(own.map((file) => structuredClone(file)));
    },
    async getFile(id) {
      return structuredClone(files.get(id));
    },
    async putFile(file) {
      files.set(file.id, structuredClone(file));
    },
    async deleteFile(id) {
      files.delete(id);
    },
    async getValue<T>(key: string) {
      return structuredClone(values.get(key)) as T | undefined;
    },
    async setValue(key, value) {
      values.set(key, structuredClone(value));
    },
    async importSnapshot(snapshot: StoreSnapshot) {
      // Validate and clone everything first, so a bad record changes nothing.
      assertValidSnapshot(snapshot);
      const copy = structuredClone(snapshot);
      for (const project of copy.projects) projects.set(project.id, project);
      for (const file of copy.files) files.set(file.id, file);
      for (const [key, value] of Object.entries(copy.values)) values.set(key, value);
    },
    close() {},
  };
}
