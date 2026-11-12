import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { createZip, createZipBytes, crc32, safeName } from "../../src/storage/zip";
import type { ZipEntry } from "../../src/storage/zip";

const enc = new TextEncoder();

const FIXED_DATE = new Date(2024, 4, 17, 13, 45, 30);

const SAMPLE_FILES: ZipEntry[] = [
  { name: "hello.c", text: '#include <stdio.h>\nint main(void){ printf("hi\\n"); }\n' },
  { name: "notes.txt", text: "naïve café ✓" },
  { name: "sub/sum.cpp", text: "int sum(int a, int b) { return a + b; }\n" },
];

function unzip(bytes: Uint8Array): Record<string, string> {
  const entries = unzipSync(bytes);
  const out: Record<string, string> = {};
  for (const [name, data] of Object.entries(entries)) out[name] = strFromU8(data);
  return out;
}

describe("crc32", () => {
  it("matches the standard check value for \"123456789\"", () => {
    expect(crc32(enc.encode("123456789"))).toBe(0xcbf43926);
  });

  it("is 0 for empty input", () => {
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
});

describe("createZipBytes", () => {
  it("round-trips names and UTF-8 contents through fflate", () => {
    const archive = createZipBytes(SAMPLE_FILES, FIXED_DATE);
    expect(unzip(archive)).toEqual({
      "hello.c": SAMPLE_FILES[0]?.text,
      "notes.txt": "naïve café ✓",
      "sub/sum.cpp": SAMPLE_FILES[2]?.text,
    });
  });

  it("round-trips a file with empty text", () => {
    const archive = createZipBytes([{ name: "empty.txt", text: "" }], FIXED_DATE);
    expect(unzip(archive)).toEqual({ "empty.txt": "" });
  });

  it("produces a valid archive with zero entries for an empty list", () => {
    const archive = createZipBytes([], FIXED_DATE);
    expect(archive.length).toBe(22);
    expect(unzipSync(archive)).toEqual({});
  });

  it("is deterministic for the same files and date", () => {
    const first = createZipBytes(SAMPLE_FILES, FIXED_DATE);
    const second = createZipBytes(SAMPLE_FILES, FIXED_DATE);
    expect(first).toEqual(second);
  });
});

describe("safeName", () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    ["hello.c", "hello.c"],
    ["dir\\hello.c", "dir/hello.c"],
    ["/hello.c", "hello.c"],
    ["../secret.c", "secret.c"],
    ["", "untitled.txt"],
    ["../../x/../y.c", "x/y.c"],
    ["\\", "untitled.txt"],
  ];

  for (const [input, expected] of cases) {
    it(`maps ${JSON.stringify(input)} to ${JSON.stringify(expected)}`, () => {
      expect(safeName(input)).toBe(expected);
    });
  }
});

describe("createZip", () => {
  it("returns an application/zip Blob matching the raw bytes", () => {
    const blob = createZip(SAMPLE_FILES, FIXED_DATE);
    expect(blob.type).toBe("application/zip");
    expect(blob.size).toBe(createZipBytes(SAMPLE_FILES, FIXED_DATE).length);
  });
});
