import { useEffect, useRef, useState } from "react";
import {
  Zap,
  Wand2,
  Trophy,
  Sparkles,
  User,
  ChevronDown,
} from "lucide-react";
import {
  FaInstagram as Instagram,
  FaWhatsapp as Whatsapp,
} from "react-icons/fa";

function FloatingRunes() {
  const HP_RUNES = ["✦", "✧", "⊹", "✶", "✵", "✴", "⋆", "˚", "·", "★"];
  return (
    <div className="hp-runes-wrap" aria-hidden>
      {[...Array(14)].map((_, i) => (
        <span
          key={i}
          className="hp-rune"
          style={{
            left: `${5 + ((i * 6.5) % 90)}%`,
            top: `${10 + ((i * 13) % 75)}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + (i % 5)}s`,
            fontSize: `${10 + (i % 3) * 4}px`,
            opacity: 0.15 + (i % 4) * 0.06,
          }}
        >
          {HP_RUNES[i % HP_RUNES.length]}
        </span>
      ))}
    </div>
  );
}

function GoldenSnitch() {
  return (
    <div className="hp-snitch" aria-hidden>
      <div className="snitch-ball" />
      <div className="snitch-wing snitch-wing-l" />
      <div className="snitch-wing snitch-wing-r" />
    </div>
  );
}

export default function Register() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Platform 9¾ — The Samaagm Summit";
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? "";
    desc?.setAttribute(
      "content",
      "Platform 9¾ is a Harry Potter-themed cultural event by The Samaagm Summit, Indore. 350+ attendees. A night of magic, music, and memories — April 12, 2026.",
    );
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? "";
    canonical?.setAttribute(
      "href",
      "https://thesamaagmsummit.netlify.app/event",
    );
    return () => {
      document.title = prev;
      desc?.setAttribute("content", prevDesc);
      canonical?.setAttribute("href", prevCanonical);
    };
  }, []);

  const [lumosMode, setLumosMode] = useState(false);
  const [lumosInteracted, setLumosInteracted] = useState(false);

  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle("lumos", lumosMode);
    return () => document.body.classList.remove("lumos");
  }, [lumosMode]);

  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;
    let rafId: number;
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    };
    const loop = () => {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      rafId = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    rafId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    const make = () => {
      const p = document.createElement("div");
      const isGold = Math.random() > 0.6;
      p.className = `ptcl${isGold ? " ptcl-gold" : ""}`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.width = p.style.height = `${Math.random() * 3 + 1}px`;
      p.style.animationDuration = `${12 + Math.random() * 16}s`;
      p.style.animationDelay = `${Math.random() * 4}s`;
      container.appendChild(p);
      setTimeout(
        () => container.contains(p) && container.removeChild(p),
        28000,
      );
    };
    for (let i = 0; i < 22; i++) make();
    const iv = setInterval(make, 800);
    return () => {
      clearInterval(iv);
      container.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("visible"),
        ),
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div className="bg-effects">
        <div className="glow-top" />
        <div className="glow-bottom-left" />
        <div className="noise-layer" />
        <div className="scanline-layer" />
        <div className="particles-wrap" ref={particlesRef} />
      </div>

      <div className="cursor-dot" ref={cursorDotRef} />
      <div className="cursor-ring" ref={cursorRingRef} />

      <GoldenSnitch />

      <div className="page-wrap">
        <div className="container">

          {/* ── TSS HEADER ── */}
          <header className="p934-nav">
            <div className="p934-nav-inner">
              <a href="/" className="p934-back">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M5 12l7-7M5 12l7 7" />
                </svg>
                TSS
              </a>
              <div className="p934-nav-brand">
                <span className="p934-nav-logo">TSS</span>
                <span className="p934-nav-sep">—</span>
                <span className="p934-nav-title">Platform 9¾</span>
              </div>
              <div className="p934-nav-right">
                <a
                  href="https://www.instagram.com/thesamaagmsummit.tss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tss-ig-btn"
                >
                  <Instagram size={14} />
                  <span>@TSS</span>
                </a>
                <div className="lumos-btn-wrap">
                  <button
                    className={`lumos-btn${lumosMode ? " lumos-on" : ""}${lumosInteracted ? " lumos-interacted" : ""}`}
                    onClick={() => {
                      setLumosMode((m) => !m);
                      setLumosInteracted(true);
                    }}
                    title={
                      lumosMode
                        ? "Nox — return to darkness"
                        : "Lumos — let there be light"
                    }
                    aria-label={lumosMode ? "Nox" : "Lumos"}
                  >
                    <span className="lumos-wand-wrap">
                      <Wand2 size={15} strokeWidth={2} />
                      {lumosMode && <span className="lumos-spark" />}
                    </span>
                    <span className="lumos-label">
                      {lumosMode ? "Nox" : "Lumos"}
                    </span>
                  </button>
                  {!lumosInteracted && (
                    <span className="lumos-hint">toggle light</span>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* ── HERO ── */}
          <section className="hero">
            <FloatingRunes />

            <div className="hero-summit" style={{ animationDelay: "0.1s" }}>
              THE &nbsp;<em>SAMAAGM</em>&nbsp; SUMMIT
            </div>
            <div className="hero-presents">PRESENTED</div>

            <div className="hero-title">
              <span className="hero-platform">
                {"PLATFORM".split("").map((l, i) => (
                  <span
                    key={i}
                    className="platform-letter"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    {l === " " ? "\u00A0" : l}
                  </span>
                ))}
              </span>
              <span className="hero-fraction">
                9¾
                <span className="fraction-glow" aria-hidden />
              </span>
            </div>

            <div className="hero-ended-badge">
              <span className="hero-ended-dot" />
              <span>Mischief Managed · 350+ Registered · April 12, 2026</span>
            </div>

            <div className="hero-rule" />
            <h1 className="hero-tagline">
              An evening of Harry Potter–themed magic, music, and memories that
              Indore won't forget.
            </h1>
            <div className="hero-pills">
              <span className="hero-pill">Rave</span>
              <span className="hero-pill">HP Challenges</span>
              <span className="hero-pill">Prizes</span>
              <span className="hero-pill">Surprises</span>
              <span className="hero-pill hero-pill-ended">✦ Event Concluded</span>
            </div>

            <div className="scroll-hint">
              <span className="scroll-hint-text">Relive</span>
              <div className="scroll-hint-line" />
              <ChevronDown
                size={16}
                className="scroll-hint-arrow"
                strokeWidth={1.5}
              />
            </div>
          </section>

          {/* ── HP QUOTE ── */}
          <section className="hp-quote-section reveal">
            <div className="hp-quote-wrap">
              <div className="hp-quote-mark">"</div>
              <blockquote className="hp-quote-text">
                It does not do to dwell on dreams and forget to live.
              </blockquote>
              <div className="hp-quote-attr">— Albus Dumbledore</div>
            </div>
          </section>

          {/* ── EVENT CONCLUDED ── */}
          <section className="countdown-section reveal">
            <div className="cdt-ended-wrap">
              <div className="cdt-ended-constellation" aria-hidden>
                {["✦", "·", "⊹", "·", "★", "·", "✧", "·", "✶"].map(
                  (r, i) => (
                    <span
                      key={i}
                      className="cdt-ended-star"
                      style={
                        {
                          "--star-i": i,
                          left: `${8 + i * 10}%`,
                          top: `${20 + ((i * 17) % 60)}%`,
                        } as React.CSSProperties
                      }
                    >
                      {r}
                    </span>
                  ),
                )}
              </div>
              <div className="cdt-ended-stamp">
                <span>✦</span>
                <span className="cdt-ended-stamp-text">Mischief Managed</span>
                <span>✦</span>
              </div>
              <div className="cdt-ended-title">The Night Was Magic</div>
              <div className="cdt-ended-sub">
                Platform 9¾ has closed its gates. Thank you for being part of
                something unforgettable — the magic lives on.
              </div>
              <div className="cdt-ended-meta">
                <span className="cdt-ended-meta-item">Platform 9¾ · TSS</span>
                <span className="cdt-ended-meta-sep">·</span>
                <span className="cdt-ended-meta-item">12 April 2026</span>
                <span className="cdt-ended-meta-sep">·</span>
                <span className="cdt-ended-meta-item">
                  Underdoggs, High Street Apollo, Indore
                </span>
              </div>
            </div>
          </section>

          {/* ── RECAP: WHAT HAPPENED ── */}
          <section className="details-section reveal">
            <span className="section-eyebrow">The Night</span>
            <h2 className="section-title">
              What <span className="accent">happened</span>
            </h2>
            <p className="section-sub" style={{ marginBottom: "40px" }}>
              350+ witches, wizards, and muggles. One magical night in Indore.
            </p>

            <div className="exp-grid">
              {[
                {
                  icon: <Zap size={22} strokeWidth={1.5} />,
                  title: "The Rave",
                  desc: "Live DJ. Bass you felt in your chest. A proper dance floor that went all night.",
                  hp: "Wingardium Leviosa",
                },
                {
                  icon: <Wand2 size={22} strokeWidth={1.5} />,
                  title: "HP Challenges",
                  desc: "Duels, trivia, house tasks. The best witches and wizards proved their worth.",
                  hp: "Expecto Patronum",
                },
                {
                  icon: <Trophy size={22} strokeWidth={1.5} />,
                  title: "Prizes",
                  desc: "Exclusive collectibles & merch. The best houses took the spoils.",
                  hp: "Accio Rewards",
                },
                {
                  icon: <Sparkles size={22} strokeWidth={1.5} />,
                  title: "Surprises",
                  desc: "Things we didn't announce. Those who were there know.",
                  hp: "Alohomora",
                },
              ].map((item, i) => (
                <div
                  className="exp-item reveal-item"
                  key={item.title}
                  style={{ "--delay": `${i * 0.1}s` } as React.CSSProperties}
                >
                  <span className="exp-item-icon">{item.icon}</span>
                  <div className="exp-item-title">{item.title}</div>
                  <div className="exp-item-desc">{item.desc}</div>
                  <div className="exp-item-spell">✦ {item.hp}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CONTACT ── */}
          <section className="contact-section reveal">
            <span className="section-eyebrow">Get in touch</span>
            <h2 className="section-title">
              Contact <span className="accent">Us</span>
            </h2>
            <div className="contact-grid">
              <div
                className="contact-card reveal-item"
                style={{ "--delay": "0s" } as React.CSSProperties}
              >
                <User
                  className="contact-card-icon"
                  size={20}
                  strokeWidth={1.5}
                />
                <div>
                  <span className="contact-role">Founder &amp; CEO | TSS</span>
                  <div className="contact-name">Somya Khandare</div>
                  <a href="tel:+918962092386" className="contact-number">
                    +91 89620 92386
                  </a>
                  <a
                    href="https://wa.me/918962092386"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-whatsapp"
                  >
                    <Whatsapp size={13} /> WhatsApp
                  </a>
                </div>
              </div>
              <div
                className="contact-card reveal-item"
                style={{ "--delay": "0.1s" } as React.CSSProperties}
              >
                <User
                  className="contact-card-icon"
                  size={20}
                  strokeWidth={1.5}
                />
                <div>
                  <span className="contact-role">Founder &amp; CMO | TSS</span>
                  <div className="contact-name">Arjav Badjatya</div>
                  <a href="tel:+919406861126" className="contact-number">
                    +91 94068 61126
                  </a>
                  <a
                    href="https://wa.me/919406861126"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-whatsapp"
                  >
                    <Whatsapp size={13} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
            <div className="contact-actions">
              <a
                href="https://www.instagram.com/thesamaagmsummit.tss"
                target="_blank"
                rel="noopener noreferrer"
                className="ig-link-btn"
              >
                <Instagram size={16} />
                Follow us on Instagram
              </a>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="footer">
            <div className="footer-hp-line">✦ Mischief Managed ✦</div>
            <div className="footer-name">
              Platform 9¾ TSS · The Samaagm Summit
            </div>
            <div className="footer-sub">
              venue: Underdoggs · 12 April 2026
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
