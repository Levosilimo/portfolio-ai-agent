import { ImageResponse } from "@vercel/og";
import { loadConfigWithCachingImages } from "@/config/loader";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const config = await loadConfigWithCachingImages();
        const subtitle = config.summary ?? config.personal.bio.slice(0, 140);
        const avatar = config.personal.avatar?.src ?? `${process.env.NEXT_PUBLIC_SITE_ORIGIN}/profile.png`;

        return new ImageResponse(
            (
                <div
                    style={{
                        display: "flex",
                        height: "100%",
                        width: "100%",
                        background:
                            "linear-gradient(90deg, rgba(7,89,133,1) 0%, rgba(68,142,255,1) 100%)",
                        color: "white",
                        padding: 48,
                        boxSizing: "border-box",
                        fontFamily: "Inter, system-ui, sans-serif",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <img src={avatar} width={120} height={120} style={{ borderRadius: 16, objectFit: "cover" }} />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ fontSize: 44, fontWeight: 700 }}>{config.personal.name}</div>
                                <div style={{ fontSize: 24, opacity: 0.95 }}>{config.personal.title}</div>
                            </div>
                        </div>
                        <div style={{ fontSize: 20, opacity: 0.95, marginTop: 18, maxWidth: 900 }}>{subtitle}</div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (err) {
        console.error("OG error", err);
        return new Response("Failed to generate image", { status: 500 });
    }
}
