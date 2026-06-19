import { useEffect, useRef, useState } from "react";

/**
 * Shared motion/interaction primitives for the "invitation that unfolds" feel.
 * Every effect is GPU-friendly (transform/opacity only) and bails out cleanly
 * for reduced-motion / coarse-pointer users.
 */

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const finePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: fine)").matches;

/** Drives the top reading-progress bar via a CSS var on <html>. */
export function useScrollProgress() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const update = () => {
      const max = root.scrollHeight - root.clientHeight;
      const p = max > 0 ? Math.min(Math.max(root.scrollTop / max, 0), 1) : 0;
      root.style.setProperty("--scroll-progress", String(p));
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
}

/** Subtle cursor-driven depth — writes --par-px/--par-py (range ~-1..1) to <html>. */
export function usePointerParallax() {
  useEffect(() => {
    if (prefersReduced() || !finePointer()) return;
    const root = document.documentElement;
    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      root.style.setProperty("--par-px", x.toFixed(3));
      root.style.setProperty("--par-py", y.toFixed(3));
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}

/** Returns the id of the section currently in view (scroll-spy for the nav). */
export function useScrollSpy(ids: string[], offset = 140) {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  const key = ids.join(",");
  useEffect(() => {
    const onScroll = () => {
      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset]);
  return active;
}

/** Counts a number up from 0 the first time it scrolls into view. */
export function useCountUp(
  end: number,
  opts: { duration?: number; decimals?: number } = {},
) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { duration = 1500, decimals = 0 } = opts;
    const fmt = (n: number) =>
      n.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    if (prefersReduced()) {
      el.textContent = fmt(end);
      return;
    }
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min((t - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(end * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(end);
      };
      requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true;
            run();
            obs.disconnect();
          }
        }),
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end]);
  return ref;
}

/** A number that counts up into view. Keep children to the numeral only. */
export function Counter({
  end,
  decimals = 0,
  className,
}: {
  end: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useCountUp(end, { decimals });
  return (
    <span ref={ref} className={className}>
      {end.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

/** Springy magnetic pull toward the cursor for primary CTAs. */
export function useMagnetic<T extends HTMLElement = HTMLElement>(strength = 0.25) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced() || !finePointer()) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
    };
    const reset = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, [strength]);
  return ref;
}
