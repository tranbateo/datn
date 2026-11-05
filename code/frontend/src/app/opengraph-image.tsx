import { ImageResponse } from "next/og";

export const alt = "AI Tutor - Educational platform for schools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            AI
          </div>
          <div style={{ fontSize: 48, fontWeight: 800 }}>AI Tutor</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>
            Smart learning platform for K-12 schools
          </div>
          <div style={{ fontSize: 30, opacity: 0.85 }}>
            Cited RAG answers, teacher-verified AI quizzes, parent portal
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 24 }}>
          {["Student", "Teacher", "Parent", "School Admin"].map((role) => (
            <div
              key={role}
              style={{
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
              }}
            >
              {role}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

