// src/app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.resolve(
  process.cwd(),
  "data",
  "admin-settings.json",
);
const ADMIN_TOKEN = process.env.PORTFOLIO_ADMIN_TOKEN ?? "";

type Settings = {
  editorAdminOnly?: boolean;
  lastUpdatedAt?: string;
};

function readSettings(): Settings {
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")) as Settings;
    } catch {
      return {};
    }
  }
  return {};
}

async function writeSettings(settings: Settings) {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await fs.promises.writeFile(
    SETTINGS_PATH,
    JSON.stringify(settings, null, 2),
    "utf-8",
  );
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json({ ok: true, settings }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("x-admin-token") ?? "";
    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const body = await req.json().catch(() => ({}));
    const { editorAdminOnly } = body;
    const current = readSettings();
    const next = {
      ...current,
      editorAdminOnly: !!editorAdminOnly,
      lastUpdatedAt: new Date().toISOString(),
    };
    await writeSettings(next);
    return NextResponse.json({ ok: true, settings: next }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message: "Unknown Error." },
      { status: 500 },
    );
  }
}
