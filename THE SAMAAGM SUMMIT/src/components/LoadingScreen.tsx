import { useEffect, useState } from "react";

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 2900);
    const t2 = setTimeout(() => onDone(), 3480);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className={`ls-root${phase === "out" ? " ls-root--out" : ""}`} aria-hidden>
      <div className="ls-ambient" />

      <div className="ls-scene">
        <div className="ls-badge">
          <svg viewBox="0 0 160 160" className="ls-ring-svg" aria-hidden>
            <circle cx="80" cy="80" r="68" className="ls-ring-track" />
            <circle cx="80" cy="80" r="68" className="ls-ring-fill" />
          </svg>
          <div className="ls-ring-glow" />
          <div className="ls-monogram">
            {["T", "S", "S"].map((l, i) => (
              <span key={i} className="ls-letter" style={{ "--i": i } as React.CSSProperties}>
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="ls-rule" />

        <div className="ls-wordmark">
          <span className="ls-wordmark-the">The</span>
          <span className="ls-wordmark-main">Samaagm Summit</span>
        </div>

        <div className="ls-subtitle">India's First Democratic Summit</div>
      </div>

      <div className="ls-bottom">
        <div className="ls-progress-track">
          <div className="ls-progress-fill" />
        </div>
        <div className="ls-bottom-label">
          <span className="ls-bottom-tss">TSS</span>
          <span className="ls-bottom-year">EST. 2026</span>
        </div>
      </div>

      <div className="ls-corner ls-corner--tl">✦</div>
      <div className="ls-corner ls-corner--tr">✦</div>
      <div className="ls-corner ls-corner--bl">✦</div>
      <div className="ls-corner ls-corner--br">✦</div>
    </div>
  );
}
