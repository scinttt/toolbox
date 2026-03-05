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
          background: "#000000",
          borderRadius: 38,
        }}
      >
        {/* White badge with T cutout */}
        <div
          style={{
            width: 104,
            height: 104,
            background: "#ffffff",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            position: "relative",
          }}
        >
          {/* Left cutout */}
          <div
            style={{
              position: "absolute",
              top: 29,
              left: 0,
              width: 40,
              height: 75,
              background: "#000000",
              borderTopRightRadius: 5,
              borderBottomLeftRadius: 16,
              display: "flex",
            }}
          />
          {/* Right cutout */}
          <div
            style={{
              position: "absolute",
              top: 29,
              right: 0,
              width: 40,
              height: 75,
              background: "#000000",
              borderTopLeftRadius: 5,
              borderBottomRightRadius: 16,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
