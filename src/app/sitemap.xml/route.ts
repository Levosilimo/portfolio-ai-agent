// import { loadConfigWithCachedImages } from "@/config/loader";

export async function GET() {
    // const config = await loadConfigWithCachedImages();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";
    const pages = ["/"/*, "/about", "/projects", "/resume", "/contact"*/];
    //const projectUrls = (config.projects || []).map((p) => `/projects/${p.id}`);

    const urls = [...pages, /*...projectUrls*/].map((p) => `${siteUrl}${p}`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
        .map(
            (url) => `
      <url>
        <loc>${url}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
      </url>`
        )
        .join("\n")}
  </urlset>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
