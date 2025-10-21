import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filename = url.pathname.split("/").pop();
  if (!filename) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  try {
    const filePath = path.join(process.cwd(), "app", "public", filename);
    const data = await fs.readFile(filePath);
    const contentType = filename.toLowerCase().endsWith(".png")
      ? "image/png"
      : filename.toLowerCase().endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}


