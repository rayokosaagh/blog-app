import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getThemeSettings } from "@/lib/settings";
import { EXT_FORMAT, FONT_FILE_MAX_BYTES, guessWeightStyle, sniffFontFormat } from "@/lib/fontLibrary";
import { deleteFontFile, fileUrlsOf, saveFontFile } from "@/lib/fontFiles";

const isAdmin = async () => (await auth())?.user?.role === "ADMIN";
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * POST /api/fonts — upload ONE font file (admin only). The format comes from
 * the file's own bytes, not its name or the browser's MIME type (browsers
 * send .ttf/.otf as application/octet-stream). Saved under a random name.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return bad("Forbidden", 403);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return bad("No file provided");
  const ext = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
  if (!(ext in EXT_FORMAT)) return bad("Use a .woff2, .woff, .ttf or .otf file");
  if (file.size === 0) return bad("That file is empty");
  if (file.size > FONT_FILE_MAX_BYTES) return bad("Font files must be 5 MB or smaller");
  const bytes = Buffer.from(await file.arrayBuffer());
  const format = sniffFontFormat(bytes);
  if (!format) return bad("That file isn't a font");
  const url = await saveFontFile(bytes, format);
  return NextResponse.json({ url, format, fileName: file.name, ...guessWeightStyle(file.name) });
}

/**
 * DELETE /api/fonts?url=… — remove an uploaded file that isn't part of the
 * SAVED library (the add/edit dialog uses it to discard uploads it won't
 * keep). Files in the saved library go away via a library save instead.
 */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return bad("Forbidden", 403);
  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (fileUrlsOf((await getThemeSettings()).customFonts).has(url)) {
    return bad("That file belongs to a saved font — remove it from the font instead", 409);
  }
  return (await deleteFontFile(url)) ? NextResponse.json({ ok: true }) : bad("Not a deletable font file");
}
