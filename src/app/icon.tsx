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
          background: "#000000",
          borderRadius: 108,
        }}
      >
        {/* White badge with T cutout */}
        <div
          style={{
            width: 296,
            height: 296,
            background: "#ffffff",
            borderRadius: 44,
            overflow: "hidden",
            display: "flex",
            position: "relative",
          }}
        >
          {/* Left cutout — creates left side of T stem gap */}
          <div
            style={{
              position: "absolute",
              top: 82,
              left: 0,
              width: 114,
              height: 214,
              background: "#000000",
              borderTopRightRadius: 14,
              borderBottomLeftRadius: 44,
              display: "flex",
            }}
          />
          {/* Right cutout — creates right side of T stem gap */}
          <div
            style={{
              position: "absolute",
              top: 82,
              right: 0,
              width: 114,
              height: 214,
              background: "#000000",
              borderTopLeftRadius: 14,
              borderBottomRightRadius: 44,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
