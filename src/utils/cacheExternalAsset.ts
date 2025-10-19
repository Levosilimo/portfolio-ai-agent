import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";

const PUBLIC_CACHE_DIR = path.join(process.cwd(), "public", "cache");
const TTL = Number(process.env.ASSETS_CACHE_TTL ?? 60 * 60 * 24 * 30);

const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

function ensureCacheDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function isLocalPath(url: string) {
  return url.startsWith("/") || url.startsWith("./") || url.startsWith("../");
}

function isDataUrl(url: string) {
  return url.startsWith("data:");
}

function sanitizeFilenameFromUrl(urlString: string) {
  try {
    const u = new URL(urlString);
    const pathname = u.pathname;
    const hash = crypto
      .createHash("sha1")
      .update(urlString)
      .digest("hex")
      .slice(0, 10);
    const ext = path.extname(pathname) || "";
    const base = pathname.replace(/[^a-z0-9.-]/gi, "_").replace(/^_+/, "");
    const name = `${base}_${hash}${ext}`;
    return name;
  } catch (err) {
    const hash = crypto
      .createHash("sha1")
      .update(urlString)
      .digest("hex")
      .slice(0, 12);
    return `asset_${hash}.img`;
  }
}

export async function cacheExternalAsset(
  url: string,
  fallback?: string,
  subDir?: string,
): Promise<string> {
  const dir = subDir ? path.join(PUBLIC_CACHE_DIR, subDir) : PUBLIC_CACHE_DIR;
  ensureCacheDir(dir);

  if (!url) return fallback ?? "";

  if (isLocalPath(url) || isDataUrl(url)) {
    return url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (err) {
    return fallback ?? url;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return fallback ?? url;
  }

  const filename = sanitizeFilenameFromUrl(url);
  const outPath = path.join(dir, filename);
  const publicPath = `/cache${subDir ? `/${subDir}/` : ""}${filename}`;

  try {
    // if cached and fresh, reuse
    if (fs.existsSync(outPath)) {
      const stat = fs.statSync(outPath);
      const age = (Date.now() - stat.mtimeMs) / 1000;
      if (age < TTL) {
        return publicPath;
      }
    }

    const res = await fetch(url, {
      headers: {
        "user-agent": `PortfolioImageCache/1.0${NEXT_PUBLIC_SITE_URL ? ` (+${NEXT_PUBLIC_SITE_URL})}` : ""}`,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buffer, { mode: 0o644 });
    return publicPath;
  } catch (err) {
    console.error("cacheExternalAsset error:", err);
    return fallback ?? url;
  }
}
