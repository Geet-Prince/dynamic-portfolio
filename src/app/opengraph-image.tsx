import { ImageResponse } from "next/og";
import { getSiteData } from "@/lib/data-fetcher";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  let name = "Prince Raj (Geet-Prince)";
  let headline = "Software Engineer & Data Science Specialist";
  try {
    const { profile } = await getSiteData();
    name = `${profile.full_name} (${profile.handle})`;
    headline = profile.headline;
  } catch {
    /* fallback copy */
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#FBFBFD",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: 24,
            color: "#10B981",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#10B981",
            }}
          />
          geetprince.me
        </div>
        <div style={{ fontSize: 72, fontWeight: 650, color: "#1D1D1F", letterSpacing: "-0.03em", marginTop: 16 }}>
          {name}
        </div>
        <div style={{ fontSize: 30, color: "#6E6E73", marginTop: 12 }}>{headline}</div>
        <div style={{ fontSize: 22, color: "#0066CC", marginTop: 20 }}>
          NIET Greater Noida · 270+ DSA · AWS Certified
        </div>
      </div>
    ),
    { ...size }
  );
}
