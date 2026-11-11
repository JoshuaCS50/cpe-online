// Tiny pure-JS ZIP encoder (STORED, no compression).
//
// Why STORED instead of DEFLATE: student source files are small (a few KB)
// and we want zero dependencies / works-offline. STORED is just file headers
// plus the raw bytes. The resulting file opens in Windows Explorer, macOS
// Finder, 7-Zip, Files on iOS, every Android file manager — anything that
// understands ZIP at all.
//
// Usage:
//   import { createZip } from "./zip.js";
//   const blob = createZip([
//     { name: "hello.c", text: "int main(){...}" },
//     { name: "sum.c",   text: "..." },
//   ]);
//   downloadFile("drafts.zip", blob, "application/zip");

const enc = new TextEncoder();

// CRC-32 (standard ZIP polynomial 0xEDB88320). Lazily-built lookup table.
let CRC_TABLE = null;
function buildCrcTable() {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  CRC_TABLE = t;
}
function crc32(bytes) {
  if (!CRC_TABLE) buildCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Pack the current date into MS-DOS time / date words (used by ZIP).
function dosTime(d = new Date()) {
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((Math.floor(d.getSeconds() / 2)) & 0x1f);
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0xf) << 5) |
    (d.getDate() & 0x1f);
  return { time, date };
}

// Sanitize a filename for the ZIP: forbid backslashes, leading slashes, and
// path-traversal segments. We keep it simple — students' filenames are
// typically just "hello.c" / "sum.c".
function safeName(name) {
  let n = String(name || "untitled.txt").replace(/\\/g, "/");
  n = n.replace(/^\/+/, "").replace(/\.\.\//g, "");
  if (!n) n = "untitled.txt";
  return n;
}

export function createZip(files) {
  const { time, date } = dosTime();
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  let totalEntries = 0;

  for (const f of files) {
    const nameBytes = enc.encode(safeName(f.name));
    const dataBytes =
      typeof f.text === "string" ? enc.encode(f.text) : new Uint8Array(f.bytes || []);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes) + filename + data
    const lh = new ArrayBuffer(30 + nameBytes.length);
    const lhV = new DataView(lh);
    lhV.setUint32(0, 0x04034b50, true); // local file header signature
    lhV.setUint16(4, 20, true);          // version needed
    lhV.setUint16(6, 0, true);           // flags
    lhV.setUint16(8, 0, true);           // method: STORED
    lhV.setUint16(10, time, true);       // mod time
    lhV.setUint16(12, date, true);       // mod date
    lhV.setUint32(14, crc, true);        // CRC-32
    lhV.setUint32(18, size, true);       // compressed size
    lhV.setUint32(22, size, true);       // uncompressed size
    lhV.setUint16(26, nameBytes.length, true); // filename length
    lhV.setUint16(28, 0, true);          // extra length
    new Uint8Array(lh, 30).set(nameBytes);

    localChunks.push(new Uint8Array(lh));
    localChunks.push(dataBytes);

    // Central directory record (46 bytes) + filename
    const cd = new ArrayBuffer(46 + nameBytes.length);
    const cdV = new DataView(cd);
    cdV.setUint32(0, 0x02014b50, true);  // central dir signature
    cdV.setUint16(4, 20, true);          // version made by
    cdV.setUint16(6, 20, true);          // version needed
    cdV.setUint16(8, 0, true);           // flags
    cdV.setUint16(10, 0, true);          // method
    cdV.setUint16(12, time, true);
    cdV.setUint16(14, date, true);
    cdV.setUint32(16, crc, true);
    cdV.setUint32(20, size, true);
    cdV.setUint32(24, size, true);
    cdV.setUint16(28, nameBytes.length, true);
    cdV.setUint16(30, 0, true);          // extra length
    cdV.setUint16(32, 0, true);          // comment length
    cdV.setUint16(34, 0, true);          // disk number
    cdV.setUint16(36, 0, true);          // internal attrs
    cdV.setUint32(38, 0, true);          // external attrs
    cdV.setUint32(42, offset, true);     // local header offset
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

  return new Blob(
    [...localChunks, ...centralChunks, new Uint8Array(eocd)],
    { type: "application/zip" }
  );
}
