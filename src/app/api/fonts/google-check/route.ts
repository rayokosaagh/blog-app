import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkGoogleFont } from "@/lib/googleFonts";

// GET /api/fonts/google-check?family=Poppins&weights=400,700&italic=0 (admin only)
export async function GET(req: Request) {
  if ((await auth())?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  const result = await checkGoogleFont({
    family: sp.get("family") ?? "",
    weights: (sp.get("weights") ?? "").split(",").filter(Boolean).map(Number),
    italic: sp.get("italic") === "1",
  });
  return result.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false, error: result.error }, { status: result.status });
}
