import { useEffect, useState } from "react";

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 2100);
    const t2 = setTimeout(() => onDone(), 2680);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`ls-root${phase === "out" ? " ls-root--out" : ""}`} aria-hidden>
      <div className="ls-mark">
        <span className="ls-tss">TSS</span>
        <div className="ls-rule" />
        <span className="ls-name">The Samaagm Summit</span>
      </div>
    </div>
  );
}
