import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: 38,
        }}
      >
        {/* Back card - Chinese */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 20,
            width: 92,
            height: 64,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
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
            bottom: 26,
            right: 20,
            width: 92,
            height: 64,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 800,
            color: "#764ba2",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          En
        </div>
        {/* Arrow line */}
        <div
          style={{
            position: "absolute",
            top: 84,
            left: 82,
            width: 20,
            height: 3,
            background: "rgba(255,255,255,0.8)",
            borderRadius: 2,
            display: "flex",
          }}
        />
        {/* Arrow head top-right */}
        <div
          style={{
            position: "absolute",
            top: 79,
            left: 94,
            width: 8,
            height: 8,
            borderTop: "3px solid rgba(255,255,255,0.8)",
            borderRight: "3px solid rgba(255,255,255,0.8)",
            transform: "rotate(45deg)",
            display: "flex",
          }}
        />
        {/* Arrow head bottom-left */}
        <div
          style={{
            position: "absolute",
            top: 82,
            left: 80,
            width: 8,
            height: 8,
            borderBottom: "3px solid rgba(255,255,255,0.8)",
            borderLeft: "3px solid rgba(255,255,255,0.8)",
            transform: "rotate(45deg)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
