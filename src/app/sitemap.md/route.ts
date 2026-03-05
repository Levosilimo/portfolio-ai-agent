export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";

  const sitemapMd = `
  # Sitemap for AI Agents
  
  - [Home](${siteUrl}/) - Main portfolio content
    `.trim();

  return new Response(sitemapMd, {
    headers: { "Content-Type": "text/markdown" },
  });
}
