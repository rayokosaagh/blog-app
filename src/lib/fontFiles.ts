import "server-only";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { FONT_URL_RE, FORMAT_EXT, type CustomFont, type FontFileFormat } from "@/lib/fontLibrary";

const FONTS_DIR = path.join(process.cwd(), "public", "uploads", "fonts");

/** Write an already-sniffed font file under a random name; returns its public URL. */
export async function saveFontFile(bytes: Buffer, format: FontFileFormat): Promise<string> {
  await mkdir(FONTS_DIR, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${FORMAT_EXT[format]}`;
  await writeFile(path.join(FONTS_DIR, name), bytes);
  return `/uploads/fonts/${name}`;
}

/** Delete one uploaded font file. Refuses anything that isn't exactly a file directly in uploads/fonts. */
export async function deleteFontFile(url: string): Promise<boolean> {
  if (!FONT_URL_RE.test(url)) return false;
  const target = path.resolve(FONTS_DIR, path.basename(url));
  if (path.dirname(target) !== FONTS_DIR) return false;
  try {
    await unlink(target);
    return true;
  } catch {
    return false;
  }
}

export function fileUrlsOf(fonts: readonly CustomFont[]): Set<string> {
  return new Set(fonts.flatMap((f) => (f.source === "upload" ? f.files.map((x) => x.url) : [])));
}

/** After a library save: delete files the old library had and the new one doesn't. */
export async function deleteRemovedFiles(before: readonly CustomFont[], after: readonly CustomFont[]): Promise<void> {
  const keep = fileUrlsOf(after);
  await Promise.all([...fileUrlsOf(before)].filter((u) => !keep.has(u)).map(deleteFontFile));
}
