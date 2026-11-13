// Records kept on the device.

/** "text" is a data file (notes, CSV, logs): editable, readable by programs, not runnable. */
export type Language = "c" | "cpp" | "python" | "java" | "matlab" | "text";

export const LANGUAGES: readonly Language[] = ["c", "cpp", "python", "java", "matlab", "text"];

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/** One source file. */
export interface FileRecord {
  id: string;
  projectId: string;
  name: string;
  language: Language;
  doc: string;
  /** Milliseconds since the epoch. Files list in creation order. */
  createdAt: number;
  savedAt: number;
}

/** A folder of files shown in the explorer. */
export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  /** File open in the editor, restored on the next visit. */
  activeFileId: string | null;
}

export type ThemeName = "vscode" | "catppuccin" | "auto" | "light";

export interface Settings {
  theme: ThemeName;
  fontSize: number;
  wrap: boolean;
  outputWrap: boolean;
  seenOnboarding: boolean;
  dismissedInstallBanner: boolean;
  /** Explanations use the hand-written text for young readers. Applies to lessons and error cards. */
  kidMode: boolean;
}

/** Everything a store holds, for atomic imports. */
export interface StoreSnapshot {
  projects: ProjectRecord[];
  files: FileRecord[];
  values: Record<string, unknown>;
}

/**
 * Where projects, files and settings live. Two implementations exist:
 * IndexedDB (kept between visits) and memory (used when the browser refuses
 * IndexedDB, for example in some private windows).
 */
export interface AppStore {
  /** False when data will be lost on reload; the UI should say so. */
  readonly persistent: boolean;
  listProjects(): Promise<ProjectRecord[]>;
  getProject(id: string): Promise<ProjectRecord | undefined>;
  putProject(project: ProjectRecord): Promise<void>;
  /** Deletes the project and every file in it. */
  deleteProject(id: string): Promise<void>;
  /** Files of one project, oldest first. */
  listFiles(projectId: string): Promise<FileRecord[]>;
  getFile(id: string): Promise<FileRecord | undefined>;
  putFile(file: FileRecord): Promise<void>;
  deleteFile(id: string): Promise<void>;
  getValue<T>(key: string): Promise<T | undefined>;
  setValue(key: string, value: unknown): Promise<void>;
  /** Writes every record or none. Existing records with the same key are replaced. */
  importSnapshot(snapshot: StoreSnapshot): Promise<void>;
  close(): void;
}

function byCreation<T extends { createdAt: number; id: string }>(a: T, b: T): number {
  return a.createdAt - b.createdAt || a.id.localeCompare(b.id);
}

/** Oldest first; ties broken by id so the order never flickers. */
export function sortByCreation<T extends { createdAt: number; id: string }>(records: T[]): T[] {
  return [...records].sort(byCreation);
}

/** Rejects records an import must not store. Shared by both stores so they fail the same way. */
export function assertValidSnapshot(snapshot: StoreSnapshot): void {
  for (const project of snapshot.projects) {
    if (typeof project.id !== "string" || project.id === "") throw new Error("Project without an id");
  }
  for (const file of snapshot.files) {
    if (typeof file.id !== "string" || file.id === "") throw new Error("File without an id");
    if (typeof file.projectId !== "string" || file.projectId === "") {
      throw new Error(`File ${file.id} has no project`);
    }
  }
}
