import { useEffect, useState } from "react";

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPct(100);
      const t = setTimeout(onDone, 420);
      return () => clearTimeout(t);
    }

    const duration = 1950;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 2.2);
      setPct(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setTimeout(() => setPhase("out"), 280);
        setTimeout(onDone, 980);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className={`ls-root${phase === "out" ? " ls-root--out" : ""}`} aria-hidden>
      <div className="ls-mark">
        <span className="ls-tss">TSS</span>
        <div className="ls-rule" />
        <span className="ls-name">The Samaagm Summit</span>
        <div className="ls-progress">
          <span
            className="ls-progress-bar"
            style={{ transform: `scaleX(${pct / 100})` }}
          />
        </div>
        <span className="ls-count">
          {String(pct).padStart(3, "0")}
          <i>%</i>
        </span>
      </div>
    </div>
  );
}
