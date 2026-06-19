import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Sitewide inertial smooth scroll (the "expensive feel" foundation).
 * Native scroll position is preserved, so IntersectionObserver, position:sticky,
 * and getBoundingClientRect-based effects all keep working. Touch stays native.
 * Disabled entirely for prefers-reduced-motion.
 */

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

/** Smooth-scroll to an element id (or element), accounting for the fixed nav. */
export function lenisScrollTo(target: string | HTMLElement, offset = -72) {
  const el = typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.15 });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

/** Smooth (or instant) scroll back to the top. */
export function lenisScrollTop(immediate = false) {
  if (lenis) {
    lenis.scrollTo(0, { immediate, duration: immediate ? 0 : 1.1 });
  } else {
    window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
  }
}

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // touch stays native for snappy mobile behaviour
    });
    lenis = instance;

    let raf = 0;
    const loop = (time: number) => {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      lenis = null;
    };
  }, []);
}
