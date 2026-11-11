# P1-04 Port the ZIP encoder to TypeScript

## Context
CPE Online is a browser IDE being migrated from plain JavaScript to Vite + strict TypeScript. The legacy app lives in `src/legacy/`. This package ports one leaf module: the dependency-free ZIP encoder used by "Save all drafts as .zip".

## Files
Create:
- `src/storage/zip.ts`
- `tests/unit/zip.test.ts`

Edit:
- none

Do not touch any other file. Do not edit or delete `src/legacy/js/zip.js`.

## Interface
```ts
/** One file to place in the archive. */
export interface ZipEntry {
  name: string;
  text: string;
}

/** CRC-32 with the standard ZIP polynomial 0xEDB88320. Returns an unsigned 32-bit number. */
export function crc32(bytes: Uint8Array): number;

/** Makes a file name safe to store in a ZIP. Same rules as the legacy `safeName`. */
export function safeName(name: string): string;

/** Builds a STORED (no compression) ZIP archive. `now` sets the timestamp of every entry. */
export function createZipBytes(files: readonly ZipEntry[], now?: Date): Uint8Array;

/** Same archive wrapped in a Blob with type "application/zip". */
export function createZip(files: readonly ZipEntry[], now?: Date): Blob;
```

## Behaviour
1. Read `src/legacy/js/zip.js` first. The archive bytes produced by `createZipBytes` must be identical to what the legacy `createZip` produces for the same files and the same date.
2. Keep the method STORED (compression method 0). Do not add DEFLATE.
3. File names and contents are encoded as UTF-8. Keep whatever general-purpose flag bits the legacy code sets.
4. `safeName` must return exactly what the legacy `safeName` returns for every input.
5. `createZip(files, now)` returns `new Blob([createZipBytes(files, now)], { type: "application/zip" })`.
6. `crc32` uses a lookup table built once, on first use.
7. Keep the explanatory comments from the legacy file where they still apply.

## Tests
Use Vitest (`import { describe, expect, it } from "vitest"`). The package `fflate` is already installed as a dev dependency; use `unzipSync` and `strFromU8` from it as an independent check.

1. `crc32` of the ASCII bytes of `"123456789"` equals `0xcbf43926`.
2. `crc32` of an empty array equals `0`.
3. Round trip: zip three files, one of them containing non-ASCII text (for example `"naïve café ✓"`), unzip with `fflate`, and expect the same names and the same text.
4. An empty file (text `""`) round-trips.
5. Zipping an empty list produces a valid archive that `fflate` unzips to zero entries.
6. `safeName`: at least five cases covering backslashes, a leading slash, `..` segments, an empty string, and a normal name such as `hello.c`. Derive each expected value from the legacy function's rules.
7. Determinism: calling `createZipBytes` twice with the same files and the same fixed `Date` gives byte-identical output.
8. Parity: import the legacy function with `import { createZip as legacyCreateZip } from "../../src/legacy/js/zip.js";`, stub the clock with `vi.useFakeTimers()` and `vi.setSystemTime(fixedDate)`, and expect `new Uint8Array(await legacyCreateZip(files).arrayBuffer())` to equal `createZipBytes(files, fixedDate)`.
9. `createZip` returns a Blob whose `type` is `"application/zip"` and whose size equals the length of `createZipBytes` for the same input.

## Acceptance
All three must pass, run from the repository root:
```
npm run typecheck
npx vitest run tests/unit/zip.test.ts
npm run lint
```

## Constraints
- TypeScript strict mode with `noUncheckedIndexedAccess`. No `any`, no `@ts-ignore`, no `@ts-expect-error`.
- No new dependencies. No network access. No changes to config files.
- Do not commit. Leave the changes in the working tree.

## Output
Only the two files listed above. No summary document.
