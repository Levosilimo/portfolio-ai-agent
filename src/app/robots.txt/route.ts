// src/app/robots.txt/route.ts
export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";
  const body = `User-agent: *
Allow: /api/og/*
Disallow:

Sitemap: ${siteUrl}/sitemap.xml
Host: ${siteUrl}
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
