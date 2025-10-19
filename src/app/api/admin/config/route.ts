import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PortfolioConfigSchema } from "@/types/portfolio-schema";
import {
  loadConfigWithCachingImages,
  loadConfigSync,
  invalidateConfigCache,
} from "@/config/loader";
import { cacheConfigAssets } from "@/utils/cacheConfigImages";
import { z, ZodError } from "zod";

const DEFAULT_CONFIG_FILE = "data/portfolio-config.example.json";
const CONFIG_PATH =
  process.env.PORTFOLIO_CONFIG_PATH ??
  path.resolve(process.cwd(), DEFAULT_CONFIG_FILE);

const ADMIN_TOKEN = process.env.PORTFOLIO_ADMIN_TOKEN ?? "";

export async function GET() {
  try {
    const cfg = loadConfigSync({});
    return NextResponse.json({ ok: true, config: cfg }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to load config",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const action = (body.action as string) ?? "save";

    if (action === "save" || action === "reload") {
      const token = req.headers.get("x-admin-token") ?? "";
      if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
    }

    if (action === "reload") {
      invalidateConfigCache();
      await loadConfigWithCachingImages();
      return NextResponse.json(
        { ok: true, message: "Reloaded config" },
        { status: 200 },
      );
    }

    if (action === "save") {
      const content = body.content;
      if (!content || typeof content !== "string") {
        return NextResponse.json(
          { ok: false, error: "Missing content to save" },
          { status: 400 },
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        return NextResponse.json(
          { ok: false, error: "Invalid JSON" },
          { status: 400 },
        );
      }

      let validated;
      try {
        validated = PortfolioConfigSchema.parse(parsed);
      } catch (err) {
        return NextResponse.json(
          {
            ok: false,
            error: "Validation failed",
            details: err instanceof ZodError ? z.prettifyError(err) : err,
          },
          { status: 400 },
        );
      }

      try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        await fs.promises.writeFile(
          CONFIG_PATH,
          JSON.stringify(validated, null, 2),
          "utf-8",
        );

        invalidateConfigCache();
        await loadConfigWithCachingImages();

        return NextResponse.json(
          { ok: true, saved: true, path: CONFIG_PATH },
          { status: 200 },
        );
      } catch (writeErr) {
        const base64 = Buffer.from(JSON.stringify(validated, null, 2)).toString(
          "base64",
        );
        try {
          invalidateConfigCache();
          await cacheConfigAssets(validated);
        } catch (_) {}
        return NextResponse.json(
          {
            ok: true,
            saved: false,
            message:
              "Unable to write file on this host. Use provided base64 string as PORTFOLIO_CONFIG_BASE64 env variable.",
            base64,
          },
          { status: 200 },
        );
      }
    }

    return NextResponse.json(
      { ok: false, error: "Unknown action" },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Server error",
      },
      { status: 500 },
    );
  }
}
