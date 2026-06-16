import { useEffect, useRef } from "react";

export interface UseMousePosOptions {
  enabled?: boolean;
}

export function useMousePos(options: UseMousePosOptions = {}) {
  const { enabled = true } = options;

  const pos = useRef({ x: -200, y: -200 });
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !window.matchMedia("(pointer: fine)").matches) return;

    let raf: number;

    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const tick = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      if (ringRef.current) {
        const rx = parseFloat(
          ringRef.current.style.getPropertyValue("--rx") || String(pos.current.x)
        );
        const ry = parseFloat(
          ringRef.current.style.getPropertyValue("--ry") || String(pos.current.y)
        );
        const nx = rx + (pos.current.x - rx) * 0.12;
        const ny = ry + (pos.current.y - ry) * 0.12;

        ringRef.current.style.setProperty("--rx", String(nx));
        ringRef.current.style.setProperty("--ry", String(ny));
        ringRef.current.style.transform = `translate(${nx - 18}px, ${ny - 18}px)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return { dotRef, ringRef };
}
