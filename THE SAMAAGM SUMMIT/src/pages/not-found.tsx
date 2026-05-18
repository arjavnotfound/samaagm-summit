import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Mono', monospace",
      color: "#ffffff",
      padding: "2rem",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(204,0,0,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <p style={{
        fontSize: "clamp(10px, 1.2vw, 13px)",
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.35)",
        textTransform: "uppercase",
        marginBottom: "2rem",
      }}>
        TSS — The Samaagm Summit
      </p>

      <div style={{
        fontSize: "clamp(80px, 18vw, 160px)",
        fontFamily: "'Cinzel Decorative', serif",
        fontWeight: 700,
        lineHeight: 1,
        color: "#cc0000",
        letterSpacing: "-0.02em",
        marginBottom: "1.5rem",
      }}>
        404
      </div>

      <div style={{
        width: "40px",
        height: "1px",
        background: "rgba(204,0,0,0.5)",
        margin: "0 auto 1.5rem",
      }} />

      <p style={{
        fontSize: "clamp(13px, 1.5vw, 16px)",
        color: "rgba(255,255,255,0.55)",
        maxWidth: "360px",
        lineHeight: 1.7,
        marginBottom: "2.5rem",
      }}>
        This page doesn't exist — or it did, and the room decided otherwise.
      </p>

      <button
        onClick={() => navigate("/")}
        style={{
          background: "transparent",
          border: "1px solid rgba(204,0,0,0.5)",
          color: "#ffffff",
          padding: "0.7rem 1.8rem",
          fontFamily: "'DM Mono', monospace",
          fontSize: "12px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "border-color 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#cc0000";
          (e.currentTarget as HTMLButtonElement).style.color = "#cc0000";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(204,0,0,0.5)";
          (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
        }}
      >
        Back to TSS →
      </button>

      <p style={{
        position: "absolute",
        bottom: "2rem",
        fontSize: "11px",
        letterSpacing: "0.15em",
        color: "rgba(255,255,255,0.15)",
        textTransform: "uppercase",
      }}>
        ✦ The Room Decides
      </p>
    </div>
  );
}
