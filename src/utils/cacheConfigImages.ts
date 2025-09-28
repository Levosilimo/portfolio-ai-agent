import { PortfolioConfig } from "@/types/portfolio-schema";
import { cacheExternalAsset } from "./cacheExternalAsset";

export async function cacheConfigAssets(config: PortfolioConfig) {
  const out = JSON.parse(JSON.stringify(config)) as PortfolioConfig;

  if (out.personal?.avatar) {
    out.personal.avatar.src = await cacheExternalAsset(out.personal.avatar.src ?? "", out.personal.avatar.fallback ?? "", "avatars");
    out.personal.avatar.fallback = out.personal.avatar.fallback ? await cacheExternalAsset(out.personal.avatar.fallback, "", "avatars") : out.personal.avatar.fallback;
  }

  for (const p of out.projects) {
    if (Array.isArray(p.images)) {
      p.images = await Promise.all((p.images || []).map(async (img) => {
        const src = img.src;
        const cached = await cacheExternalAsset(src, src, "images");
        return { src: cached, alt: img.alt };
      }));
    }
  }

  if (out.resume?.url) {
    out.resume.url = await cacheExternalAsset(out.resume.url, undefined, "resumes");
  }

  return out;
}
