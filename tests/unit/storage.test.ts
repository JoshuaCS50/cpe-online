import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { extensionForLanguage, languageFromFilename } from "../../src/storage/file-types";
import { openIdbStore, openStore } from "../../src/storage/idb-store";
import { createMemoryStore } from "../../src/storage/memory-store";
import { DEFAULT_SETTINGS, loadSettings, sanitizeSettings, saveSettings } from "../../src/storage/settings";
import type { AppStore, FileRecord, ProjectRecord } from "../../src/storage/types";

let databaseCounter = 0;
const freshName = () => `test-db-${++databaseCounter}`;

const project = (id: string, createdAt = 1): ProjectRecord => ({ id, name: id, createdAt, activeFileId: null });
const file = (id: string, projectId: string, createdAt = 1): FileRecord => ({
  id,
  projectId,
  name: `${id}.c`,
  language: "c",
  doc: `// ${id}`,
  createdAt,
  savedAt: createdAt,
});

const stores: [string, () => Promise<AppStore>][] = [
  ["memory", async () => createMemoryStore()],
  ["IndexedDB", () => openIdbStore(freshName())],
];

describe.each(stores)("%s store", (_name, open) => {
  it("stores and returns projects, oldest first", async () => {
    const store = await open();
    await store.putProject(project("b", 2));
    await store.putProject(project("a", 1));
    expect((await store.listProjects()).map((p) => p.id)).toEqual(["a", "b"]);
    expect(await store.getProject("a")).toEqual(project("a", 1));
    expect(await store.getProject("missing")).toBeUndefined();
  });

  it("lists only the files of the asked project, oldest first", async () => {
    const store = await open();
    await store.putFile(file("late", "p1", 30));
    await store.putFile(file("early", "p1", 10));
    await store.putFile(file("other", "p2", 20));
    expect((await store.listFiles("p1")).map((f) => f.id)).toEqual(["early", "late"]);
    expect(await store.listFiles("nobody")).toEqual([]);
  });

  it("replaces a file saved again under the same id", async () => {
    const store = await open();
    await store.putFile(file("f", "p"));
    await store.putFile({ ...file("f", "p"), doc: "changed" });
    expect((await store.getFile("f"))?.doc).toBe("changed");
    expect(await store.listFiles("p")).toHaveLength(1);
  });

  it("does not let callers change stored records through objects they hold", async () => {
    const store = await open();
    const record = file("f", "p");
    await store.putFile(record);
    record.doc = "mutated after save";
    const loaded = await store.getFile("f");
    expect(loaded?.doc).toBe("// f");
    if (loaded) loaded.doc = "mutated after load";
    expect((await store.getFile("f"))?.doc).toBe("// f");
  });

  it("deletes a file", async () => {
    const store = await open();
    await store.putFile(file("f", "p"));
    await store.deleteFile("f");
    expect(await store.getFile("f")).toBeUndefined();
  });

  it("deleting a project deletes its files and nothing else", async () => {
    const store = await open();
    await store.putProject(project("p1"));
    await store.putProject(project("p2"));
    await store.putFile(file("a", "p1"));
    await store.putFile(file("b", "p1"));
    await store.putFile(file("c", "p2"));
    await store.deleteProject("p1");
    expect(await store.getProject("p1")).toBeUndefined();
    expect(await store.listFiles("p1")).toEqual([]);
    expect((await store.listFiles("p2")).map((f) => f.id)).toEqual(["c"]);
  });

  it("stores named values", async () => {
    const store = await open();
    expect(await store.getValue("k")).toBeUndefined();
    await store.setValue("k", { n: 1 });
    expect(await store.getValue("k")).toEqual({ n: 1 });
  });

  it("imports a snapshot", async () => {
    const store = await open();
    await store.importSnapshot({
      projects: [project("p")],
      files: [file("a", "p", 1), file("b", "p", 2)],
      values: { flag: true },
    });
    expect((await store.listFiles("p")).map((f) => f.id)).toEqual(["a", "b"]);
    expect(await store.getValue("flag")).toBe(true);
  });

  it("imports all of a snapshot or none of it", async () => {
    const store = await open();
    const broken = { ...file("bad", "p"), id: "" };
    await expect(
      store.importSnapshot({ projects: [project("p")], files: [file("good", "p"), broken], values: { flag: true } }),
    ).rejects.toThrow();
    expect(await store.getProject("p")).toBeUndefined();
    expect(await store.getFile("good")).toBeUndefined();
    expect(await store.getValue("flag")).toBeUndefined();
  });

  it("keeps both changes when two settings are saved back to back", async () => {
    const store = await open();
    const first = { ...DEFAULT_SETTINGS, theme: "light" as const };
    const second = { ...first, fontSize: 18 };
    await Promise.all([saveSettings(store, first), saveSettings(store, second)]);
    expect(await loadSettings(store)).toEqual(second);
  });

  it("loads default settings from an empty store, then saves a patch", async () => {
    const store = await open();
    expect(await loadSettings(store)).toEqual(DEFAULT_SETTINGS);
    const saved = await saveSettings(store, { theme: "light", fontSize: 18 });
    expect(saved).toEqual({ ...DEFAULT_SETTINGS, theme: "light", fontSize: 18 });
    expect(await loadSettings(store)).toEqual(saved);
  });
});

describe("IndexedDB store", () => {
  it("reports itself as persistent and keeps data across reopen", async () => {
    const name = freshName();
    const first = await openIdbStore(name);
    expect(first.persistent).toBe(true);
    await first.putFile(file("kept", "p"));
    first.close();
    const second = await openIdbStore(name);
    expect((await second.getFile("kept"))?.doc).toBe("// kept");
  });
});

describe("openStore", () => {
  it("falls back to a non-persistent memory store when IndexedDB is missing", async () => {
    const original = globalThis.indexedDB;
    vi.stubGlobal("indexedDB", undefined);
    try {
      const store = await openStore(freshName());
      expect(store.persistent).toBe(false);
      await store.putFile(file("f", "p"));
      expect((await store.getFile("f"))?.id).toBe("f");
    } finally {
      vi.stubGlobal("indexedDB", original);
    }
  });
});

describe("sanitizeSettings", () => {
  it("returns the defaults for junk", () => {
    for (const junk of [null, undefined, 5, "x", []]) expect(sanitizeSettings(junk)).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid values, drops unknown keys and fixes wrong types", () => {
    expect(
      sanitizeSettings({ theme: "catppuccin", fontSize: 17.6, wrap: true, outputWrap: "yes", streamingMode: true }),
    ).toEqual({ ...DEFAULT_SETTINGS, theme: "catppuccin", fontSize: 18, wrap: true });
  });

  it("clamps the font size and rejects unknown themes", () => {
    expect(sanitizeSettings({ fontSize: 99 }).fontSize).toBe(22);
    expect(sanitizeSettings({ fontSize: 1 }).fontSize).toBe(12);
    expect(sanitizeSettings({ fontSize: Number.NaN }).fontSize).toBe(15);
    expect(sanitizeSettings({ theme: "neon" }).theme).toBe("vscode");
  });
});

describe("file types", () => {
  it("maps file names to languages by extension, ignoring case", () => {
    const cases: [string, string][] = [
      ["hello.c", "c"],
      ["util.h", "c"],
      ["main.cpp", "cpp"],
      ["a.CC", "cpp"],
      ["a.cxx", "cpp"],
      ["a.hpp", "cpp"],
      ["a.hh", "cpp"],
      ["script.py", "python"],
      ["Main.java", "java"],
      ["plot_data.m", "matlab"],
      ["SCRIPT.M", "matlab"],
      ["notes.txt", "text"],
      ["readings.CSV", "text"],
      ["log.dat", "text"],
      ["Makefile", "c"],
      ["archive.tar.py", "python"],
    ];
    for (const [name, language] of cases) expect(languageFromFilename(name)).toBe(language);
  });

  it("gives each language a save extension that maps back to it", () => {
    for (const language of ["c", "cpp", "python", "java", "matlab", "text"] as const) {
      expect(languageFromFilename(`x.${extensionForLanguage(language)}`)).toBe(language);
    }
  });
});
