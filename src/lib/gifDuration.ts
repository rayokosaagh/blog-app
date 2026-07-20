// Best-effort total play time (ms) of one GIF loop, by summing the per-frame
// delays in its Graphic Control Extension blocks. Returns 0 if it can't parse
// (caller should fall back to a default). Client-side only (uses fetch).
export async function gifDurationMs(url: string): Promise<number> {
  try {
    const res = await fetch(url);
    if (!res.ok) return 0;
    const buf = new Uint8Array(await res.arrayBuffer());

    // "GIF" magic
    if (buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) return 0;

    let i = 6 + 7; // header (6) + logical screen descriptor (7)
    const packed = buf[10];
    if (packed & 0x80) i += 3 * (1 << ((packed & 7) + 1)); // global color table

    const skipSubBlocks = () => {
      while (i < buf.length && buf[i] !== 0) i += buf[i] + 1;
      i += 1; // block terminator
    };

    let total = 0;
    while (i < buf.length) {
      const block = buf[i++];
      if (block === 0x3b) break; // trailer
      if (block === 0x21) {
        // extension
        const label = buf[i++];
        if (label === 0xf9) {
          const size = buf[i++]; // graphic control ext block size (4)
          const delay = buf[i + 1] | (buf[i + 2] << 8); // centiseconds, LE
          total += (delay || 0) * 10;
          i += size; // skip block data
          i += 1; // block terminator
        } else {
          skipSubBlocks();
        }
      } else if (block === 0x2c) {
        // image descriptor: left,top,w,h (8) + packed (1)
        i += 8;
        const ipacked = buf[i++];
        if (ipacked & 0x80) i += 3 * (1 << ((ipacked & 7) + 1)); // local color table
        i += 1; // LZW min code size
        skipSubBlocks();
      } else {
        break; // unexpected — bail with what we have
      }
    }

    return total;
  } catch {
    return 0;
  }
}
