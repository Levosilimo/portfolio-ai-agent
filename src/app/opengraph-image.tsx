import { ImageResponse } from "next/og";
import { loadConfigWithCachingImages } from "@/config/loader";

export const runtime = "nodejs";
export const alt = "Portfolio Open Graph Image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  try {
    const config = await loadConfigWithCachingImages();
    const subtitle = config.summary ?? config.personal.bio.slice(0, 140);

    const siteOrigin =
      process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";
    let avatarUrl = config.personal.avatar?.src ?? `${siteOrigin}/profile.png`;

    if (avatarUrl.startsWith("/")) {
      avatarUrl = `${siteOrigin}${avatarUrl}`;
    }

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(90deg, #075985 0%, #448eff 100%)",
          color: "white",
          padding: 48,
          boxSizing: "border-box",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Avatar"
            width="120"
            height="120"
            style={{ borderRadius: 16, objectFit: "cover" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 44, fontWeight: 700 }}>
              {config.personal.name}
            </div>
            <div style={{ fontSize: 24, opacity: 0.95 }}>
              {config.personal.title}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 20,
            opacity: 0.95,
            marginTop: 18,
            maxWidth: 900,
          }}
        >
          {subtitle}
        </div>
      </div>,
      { ...size },
    );
  } catch (err) {
    console.error("OG Generation Error:", err);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
