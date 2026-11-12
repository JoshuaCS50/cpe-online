// Tiny pure-JS ZIP encoder (STORED, no compression).
//
// Why STORED instead of DEFLATE: student source files are small (a few KB)
// and we want zero dependencies / works-offline. STORED is just file headers
// plus the raw bytes. The resulting file opens in Windows Explorer, macOS
// Finder, 7-Zip, Files on iOS, every Android file manager — anything that
// understands ZIP at all.
//
// Ported from src/legacy/js/zip.js. For the same files and the same timestamp
// this produces byte-identical archives.
//
// Usage:
//   const blob = createZip([
//     { name: "hello.c", text: "int main(){...}" },
//     { name: "sum.c",   text: "..." },
//   ]);
//   downloadFile("drafts.zip", blob, "application/zip");

const enc = new TextEncoder();

/** One file to place in the archive. */
export interface ZipEntry {
  name: string;
  text: string;
}

// CRC-32 (standard ZIP polynomial 0xEDB88320). Lazily-built lookup table,
// built once on first use.
let CRC_TABLE: Uint32Array | null = null;

function buildCrcTable(): Uint32Array {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  return t;
}

function getCrcTable(): Uint32Array {
  if (CRC_TABLE === null) CRC_TABLE = buildCrcTable();
  return CRC_TABLE;
}

/** CRC-32 with the standard ZIP polynomial 0xEDB88320. Returns an unsigned 32-bit number. */
export function crc32(bytes: Uint8Array): number {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    // The loop bound guarantees both indices are in range; the `?? 0`
    // fallbacks only satisfy noUncheckedIndexedAccess and never run.
    const byte = bytes[i] ?? 0;
    c = (table[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Pack a date into MS-DOS time / date words (used by ZIP).
function dosTime(d: Date): { time: number; date: number } {
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    (Math.floor(d.getSeconds() / 2) & 0x1f);
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0xf) << 5) |
    (d.getDate() & 0x1f);
  return { time, date };
}

// Sanitize a filename for the ZIP: forbid backslashes, leading slashes, and
// path-traversal segments. We keep it simple — students' filenames are
// typically just "hello.c" / "sum.c".
export function safeName(name: string): string {
  let n = String(name || "untitled.txt").replace(/\\/g, "/");
  n = n.replace(/^\/+/, "").replace(/\.\.\//g, "");
  if (!n) n = "untitled.txt";
  return n;
}

/**
 * Builds a STORED (no compression) ZIP archive. `now` sets the timestamp of
 * every entry.
 *
 * The return type names the ArrayBuffer explicitly (rather than the default
 * `ArrayBufferLike`) so the bytes can be handed straight to a Blob, which
 * rejects SharedArrayBuffer-backed views.
 */
export function createZipBytes(
  files: readonly ZipEntry[],
  now: Date = new Date(),
): Uint8Array<ArrayBuffer> {
  const { time, date } = dosTime(now);
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;
  let totalEntries = 0;

  for (const f of files) {
    const nameBytes = enc.encode(safeName(f.name));
    const dataBytes = enc.encode(f.text);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes) + filename + data
    const lh = new ArrayBuffer(30 + nameBytes.length);
    const lhV = new DataView(lh);
    lhV.setUint32(0, 0x04034b50, true); // local file header signature
    lhV.setUint16(4, 20, true); // version needed
    lhV.setUint16(6, 0, true); // flags
    lhV.setUint16(8, 0, true); // method: STORED
    lhV.setUint16(10, time, true); // mod time
    lhV.setUint16(12, date, true); // mod date
    lhV.setUint32(14, crc, true); // CRC-32
    lhV.setUint32(18, size, true); // compressed size
    lhV.setUint32(22, size, true); // uncompressed size
    lhV.setUint16(26, nameBytes.length, true); // filename length
    lhV.setUint16(28, 0, true); // extra length
    new Uint8Array(lh, 30).set(nameBytes);

    localChunks.push(new Uint8Array(lh));
    localChunks.push(dataBytes);

    // Central directory record (46 bytes) + filename
    const cd = new ArrayBuffer(46 + nameBytes.length);
    const cdV = new DataView(cd);
    cdV.setUint32(0, 0x02014b50, true); // central dir signature
    cdV.setUint16(4, 20, true); // version made by
    cdV.setUint16(6, 20, true); // version needed
    cdV.setUint16(8, 0, true); // flags
    cdV.setUint16(10, 0, true); // method
    cdV.setUint16(12, time, true);
    cdV.setUint16(14, date, true);
    cdV.setUint32(16, crc, true);
    cdV.setUint32(20, size, true);
    cdV.setUint32(24, size, true);
    cdV.setUint16(28, nameBytes.length, true);
    cdV.setUint16(30, 0, true); // extra length
    cdV.setUint16(32, 0, true); // comment length
    cdV.setUint16(34, 0, true); // disk number
    cdV.setUint16(36, 0, true); // internal attrs
    cdV.setUint32(38, 0, true); // external attrs
    cdV.setUint32(42, offset, true); // local header offset
    new Uint8Array(cd, 46).set(nameBytes);

    centralChunks.push(new Uint8Array(cd));

    offset += 30 + nameBytes.length + size;
    totalEntries += 1;
  }

  const cdSize = centralChunks.reduce((s, c) => s + c.length, 0);
  const cdOffset = offset;

  // End of central directory record (22 bytes, no comment)
  const eocd = new ArrayBuffer(22);
  const eV = new DataView(eocd);
  eV.setUint32(0, 0x06054b50, true);
  eV.setUint16(4, 0, true);
  eV.setUint16(6, 0, true);
  eV.setUint16(8, totalEntries, true);
  eV.setUint16(10, totalEntries, true);
  eV.setUint32(12, cdSize, true);
  eV.setUint32(16, cdOffset, true);
  eV.setUint16(20, 0, true);

  const chunks = [...localChunks, ...centralChunks, new Uint8Array(eocd)];
  const totalLength = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

/** Same archive wrapped in a Blob with type "application/zip". */
export function createZip(files: readonly ZipEntry[], now?: Date): Blob {
  return new Blob([createZipBytes(files, now)], { type: "application/zip" });
}
