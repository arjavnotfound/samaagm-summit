import { useEffect } from "react";

export interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  selector?: string;
}

export function useReveal(options: UseRevealOptions = {}) {
  const {
    threshold = 0.07,
    rootMargin = "0px 0px -40px 0px",
    selector = ".h-reveal",
  } = options;

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("h-visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold, rootMargin }
    );

    document.querySelectorAll(selector).forEach((el) => obs.observe(el));

    return () => obs.disconnect();
  }, [threshold, rootMargin, selector]);
}
