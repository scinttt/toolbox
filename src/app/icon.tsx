import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 108,
        }}
      >
        {/* Back card - Chinese */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 60,
            width: 260,
            height: 180,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 100,
            fontWeight: 800,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          中
        </div>
        {/* Front card - English */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            right: 60,
            width: 260,
            height: 180,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 90,
            fontWeight: 800,
            color: "#764ba2",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          En
        </div>
        {/* Arrow line */}
        <div
          style={{
            position: "absolute",
            top: 232,
            left: 240,
            width: 56,
            height: 6,
            background: "rgba(255,255,255,0.8)",
            borderRadius: 3,
            display: "flex",
          }}
        />
        {/* Arrow head top-right */}
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 278,
            width: 20,
            height: 20,
            borderTop: "6px solid rgba(255,255,255,0.8)",
            borderRight: "6px solid rgba(255,255,255,0.8)",
            transform: "rotate(45deg)",
            display: "flex",
          }}
        />
        {/* Arrow head bottom-left */}
        <div
          style={{
            position: "absolute",
            top: 228,
            left: 236,
            width: 20,
            height: 20,
            borderBottom: "6px solid rgba(255,255,255,0.8)",
            borderLeft: "6px solid rgba(255,255,255,0.8)",
            transform: "rotate(45deg)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
