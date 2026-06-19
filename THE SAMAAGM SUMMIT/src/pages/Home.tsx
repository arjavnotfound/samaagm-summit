import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Instagram,
  ArrowRight,
  Info,
  Users,
  Lightbulb,
  Star,
  Handshake,
  Crown,
  Shield,
  GraduationCap,
  Mic,
  Globe,
  Calendar,
  ChevronUp,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMousePos } from "@/hooks/use-mouse-pos";
import { useReveal } from "@/hooks/use-reveal";
import {
  useScrollProgress,
  useScrollSpy,
  useMagnetic,
  Counter,
} from "@/hooks/use-enhance";
import { lenisScrollTo, lenisScrollTop } from "@/hooks/use-lenis";
import { PinnedStory } from "@/components/PinnedStory";

const FORMS = [
  {
    num: "01",
    Icon: Handshake,
    label: "Collaboration & Sponsorship",
    url: "https://forms.gle/7WRDDa6XfUcnH8cg9",
    desc: "Collaborate, sponsor, or partner with TSS",
    tag: "OPEN",
  },
  {
    num: "02",
    Icon: Crown,
    label: "Core Team Application",
    url: "https://forms.gle/Dp5VFEbwzDiAJm9F9",
    desc: "Be at the heart of TSS",
    tag: "OPEN",
  },
  {
    num: "03",
    Icon: Shield,
    label: "Secretariat Application 2.0",
    url: "https://forms.gle/VV7dgeszyHmZayNp6",
    desc: "Be the force that keeps the summit moving",
    tag: "OPEN",
  },
  {
    num: "04",
    Icon: GraduationCap,
    label: "Intern Application",
    url: "https://forms.gle/LmaBU4jy92iwcjez6",
    desc: "Get hands-on conference experience",
    tag: "OPEN",
  },
  {
    num: "05",
    Icon: Crown,
    label: "Executive Board",
    url: "https://forms.gle/E2yPwFmndCUq7Pmx5",
    desc: "Lead as Chair, Vice-Chair or Rapporteur for 8 committees (6 voted + 2 special)",
    tag: "NOW OPEN",
  },
];

const MARQUEE_TEXT = [
  "THE SAMAAGM SUMMIT",
  "YOUTH · MUN · INNOVATION",
  "THE ROOM DECIDES",
  "INDIA'S FIRST DEMOCRATIC SUMMIT",
  "DELEGATE REG OPEN · PHASE I",
  "APPLICATIONS OPEN",
];

const NAV_ITEMS = [
  { id: "about", label: "About", Icon: Info },
  { id: "join", label: "Join", Icon: Users },
  { id: "vision", label: "Vision", Icon: Lightbulb },
  { id: "founders", label: "Founders", Icon: Star },
];

function scrollTo(id: string) {
  lenisScrollTo(id);
}

export default function Home() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPill, setShowPill] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0 });

  useEffect(() => {
    const target = new Date("2026-07-31T00:00:00").getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / 864e5),
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const pillRef = useRef<HTMLDivElement>(null);
  const { dotRef, ringRef } = useMousePos();
  useReveal();
  useScrollProgress();
  const activeSection = useScrollSpy(["about", "join", "vision", "founders"]);
  const heroCtaRef = useMagnetic<HTMLButtonElement>();

  // Kinetic hero — scroll-linked parallax departure + 3D cursor tilt
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, 140]);
  const heroFade = useTransform(scrollY, [0, 520], [1, 0]);
  const heroRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const hero = heroRef.current;
    const title = heroTitleRef.current;
    if (!hero || !title) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    )
      return;
    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      title.style.setProperty("--h-rx", (px * 10).toFixed(2));
      title.style.setProperty("--h-ry", (-py * 8).toFixed(2));
    };
    const reset = () => {
      title.style.setProperty("--h-rx", "0");
      title.style.setProperty("--h-ry", "0");
    };
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", reset);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", reset);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setShowPill(y > window.innerHeight * 0.55);
      setShowTop(y > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu if the viewport grows to desktop width.
  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => {
      if (window.innerWidth > 980) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  useEffect(() => {
    if (!pillOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setPillOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [pillOpen]);

  function goEvent() {
    navigate("/event");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <div className="h-root" itemScope itemType="https://schema.org/WebPage">
      <div className="h-scroll-progress" aria-hidden />
      <div className="h-cursor-dot" ref={dotRef} />
      <div className="h-cursor-ring" ref={ringRef} />

      <div className="h-bg-fx" aria-hidden>
        <div className="h-bg-noise" />
        <div className="h-bg-scan" />
        <div className="h-bg-glow h-bg-glow--top" />
        <div className="h-bg-glow h-bg-glow--mid" />
        <div className="h-bg-glow h-bg-glow--bot" />
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`h-ptcl ${i % 5 === 0 ? "h-ptcl--gold" : ""}`}
            style={{
              left: `${(i * 4.5 + 3) % 100}%`,
              width: `${1.5 + (i % 3) * 1.5}px`,
              height: `${1.5 + (i % 3) * 1.5}px`,
              animationDuration: `${7 + (i % 9) * 2}s`,
              animationDelay: `${(i * 0.7) % 8}s`,
            }}
          />
        ))}
        <svg
          className="h-orbital"
          aria-hidden
          viewBox="0 0 600 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse
            cx="300"
            cy="300"
            rx="260"
            ry="95"
            fill="none"
            stroke="rgba(204,0,0,0.5)"
            strokeWidth="1"
          />
          <ellipse
            cx="300"
            cy="300"
            rx="170"
            ry="255"
            fill="none"
            stroke="rgba(204,0,0,0.35)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* NAV */}
      <header className={`h-nav${scrolled ? " h-nav--solid" : ""}`} role="banner">
        <div className="h-nav-inner">
          <button
            className="h-logo"
            onClick={() => lenisScrollTop()}
          >
            <span className="h-logo-tss">TSS</span>
            <span className="h-logo-sep" aria-hidden>
              —
            </span>
            <span className="h-logo-name">The Samaagm Summit</span>
          </button>

          <nav className="h-nav-links">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`h-nav-link${activeSection === id ? " h-nav-link--active" : ""}`}
                onClick={() => scrollTo(id)}
                title={label}
              >
                <span className="h-nav-link-icon">
                  <Icon size={14} strokeWidth={1.5} />
                </span>
                <span className="h-nav-link-text">{label}</span>
              </button>
            ))}
            <a
              className="h-nav-link"
              href="/mun"
              title="MUN Conference"
            >
              <span className="h-nav-link-icon">
                <Globe size={14} strokeWidth={1.5} />
              </span>
              <span className="h-nav-link-text">MUN</span>
            </a>
            <a
              className="h-nav-link h-nav-link--ig"
              href="https://www.instagram.com/thesamaagmsummit.tss"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
            >
              <span className="h-nav-link-icon">
                <Instagram size={13} />
              </span>
              <span className="h-nav-link-text">Instagram</span>
            </a>
          </nav>

          <a
            href="https://forms.gle/G3i22pDqRbDT8sNt5"
            target="_blank"
            rel="noopener noreferrer"
            className="h-reg-btn h-reg-btn--delegate"
            aria-label="Register as Delegate — Phase I"
          >
            Register Now →
          </a>

          <button
            className={`h-ham${menuOpen ? " h-ham--open" : ""}`}
            aria-label={menuOpen ? "Close" : "Menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {menuOpen && (
          <div className="h-mobile-menu">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className="h-mobile-link"
                onClick={() => {
                  scrollTo(id);
                  setMenuOpen(false);
                }}
              >
                <span className="h-mobile-icon">
                  <Icon size={14} strokeWidth={1.5} />
                </span>
                {label}
              </button>
            ))}
            <a className="h-mobile-link" href="/mun">
              <span className="h-mobile-icon">
                <Globe size={14} strokeWidth={1.5} />
              </span>
              Explore MUN — Committees & Agendas
            </a>
            <a
              className="h-mobile-link"
              href="https://www.instagram.com/thesamaagmsummit.tss"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="h-mobile-icon">
                <Instagram size={14} strokeWidth={1.5} />
              </span>
              Instagram
            </a>
            <a
              href="https://forms.gle/G3i22pDqRbDT8sNt5"
              target="_blank"
              rel="noopener noreferrer"
              className="h-reg-btn h-reg-btn--delegate"
              style={{ marginTop: 16, width: "100%", textAlign: "center", display: "block" }}
              onClick={() => setMenuOpen(false)}
            >
              Register Now →
            </a>
          </div>
        )}
      </header>

      <main id="main-content">
      {/* HERO */}
      <section ref={heroRef} className="h-hero" aria-label="The Samaagm Summit — India's First Democratic Youth Summit">
        <div className="h-corner h-corner--tl">
          <span>THE SAMAAGM SUMMIT</span>
        </div>
        <div className="h-corner h-corner--tr">
          <span>YOUTH · MUN · INNOVATION</span>
        </div>
        <div className="h-corner h-corner--bl">
          <span>YOUTH · MUN · INNOVATION</span>
        </div>
        <div className="h-corner h-corner--br">
          <span>INDIA'S FIRST DEMOCRATIC SUMMIT</span>
        </div>

        <div className="h-side-text h-side-text--l" aria-hidden>
          <span>THE SAMAAGM SUMMIT — TSS —</span>
        </div>
        <div className="h-side-text h-side-text--r" aria-hidden>
          <span>YOUTH · MUN · INNOVATION · TSS</span>
        </div>

        <motion.div className="h-hero-inner" style={{ y: heroY, opacity: heroFade }}>
          <p className="h-hero-kicker">
            <span className="h-kicker-line" />
            India's First Democratic Summit
            <span className="h-kicker-line" />
          </p>

          <h1 className="h-hero-title" ref={heroTitleRef}>
            <span className="h-hero-the">The</span>
            <span className="h-hero-main">
              {"Samaagm".split("").map((ch, i) => (
                <motion.span
                  key={i}
                  className="h-hero-ch"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.045, type: "spring", stiffness: 70 }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
            <span className="h-hero-sub">Summit</span>
          </h1>

          <div className="h-hero-rule" aria-hidden />

          <p className="h-hero-desc">
            A youth-driven conference where students, thinkers,
            <br className="h-br" />
            and future leaders come together — to debate, to build, to lead.
          </p>

          <div className="h-hero-btns">
            <button ref={heroCtaRef} className="h-cta h-cta--primary h-magnetic" onClick={goEvent}>
              Explore Platform 9¾ <ArrowRight size={15} />
            </button>
            <button
              className="h-cta h-cta--join"
              onClick={() => scrollTo("join")}
            >
              <Users size={14} strokeWidth={2} />
              Join the Team
            </button>
            <a
              className="h-cta h-cta--secondary"
              href="https://www.instagram.com/thesamaagmsummit.tss"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={14} /><span>Follow</span>
            </a>
          </div>
        </motion.div>

        <div className="h-scroll-cue" onClick={() => scrollTo("about")}>
          <span className="h-scroll-line" />
          <span className="h-scroll-label">Scroll</span>
        </div>
      </section>

      {/* MARQUEE STRIP — Premium cinematic treatment */}
      <div className="h-marquee-strip" aria-hidden>
        <div className="h-marquee-track">
          {[...MARQUEE_TEXT, ...MARQUEE_TEXT, ...MARQUEE_TEXT].map((t, i) => (
            <span key={i} className="h-marquee-item">
              <span className="h-marquee-dot">✦</span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* DATES REVEALED — Dramatically elevated with motion and presence */}
      <section className="h-dates-section" aria-label="Event Dates — July 31 to August 2, 2026, Indore">
        <div className="h-dates-inner">
          <motion.div 
            className="h-dates-announce h-reveal"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="h-dates-announce-dot" />
            <span className="h-dates-announce-text">TSS First Edition</span>
            <span className="h-dates-announce-yr">· 2026</span>
          </motion.div>

          <div className="h-dates-grid h-reveal">
            {[ 
              { num: "31", month: "July", day: "Friday" },
              { num: "01", month: "August", day: "Saturday" },
              { num: "02", month: "August", day: "Sunday" }
            ].map((d, i) => (
              <motion.div 
                key={i}
                className="h-date-block"
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i, type: "spring", stiffness: 90 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <span className="h-date-num">{d.num}</span>
                <span className="h-date-month">{d.month}</span>
                <span className="h-date-weekday">{d.day}</span>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="h-dates-footer h-reveal"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <span className="h-dates-loc">Indore, India</span>
            <span className="h-dates-footer-sep" aria-hidden>
              ·
            </span>
            <div className="h-countdown">
              <span className="h-cdown-num">{countdown.days}</span>
              <span className="h-cdown-unit">days left</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CARDS SECTION */}
      <section className="h-cards-section" aria-label="Registration and conference">
        <div className="h-wrap">
          <div className="h-cards-grid">

            {/* Card 1: Delegate Registration */}
            <motion.a
              href="https://forms.gle/G3i22pDqRbDT8sNt5"
              target="_blank"
              rel="noopener noreferrer"
              className="h-card h-card--reg"
              aria-label="Register as Delegate — Phase I pricing at ₹1,700"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
              whileHover={{ y: -10, scale: 1.005, transition: { type: "spring", stiffness: 280, damping: 22 } }}
              whileTap={{ scale: 0.985 }}
            >
              <div className="h-card-glow" aria-hidden />
              <div className="h-card-top">
                <div className="h-card-live">
                  <span className="h-card-dot" aria-hidden />
                  <span>Phase I · Open</span>
                </div>
                <span className="h-card-pill">Delegate Registration</span>
              </div>
              <div className="h-card-price" aria-label="₹1,700">
                <span className="h-card-currency" aria-hidden>₹</span>
                <Counter end={1700} className="h-card-amount" />
              </div>
              <p className="h-card-desc">
                Our lowest price — ever. Fee increases with every subsequent phase. Secure your spot now.
              </p>
              <div className="h-card-cta h-card-cta--red">
                Register as Delegate <ArrowRight size={15} />
              </div>
              <span className="h-card-ornament" aria-hidden>✦</span>
            </motion.a>

            {/* Card 2: Explore MUN */}
            <motion.a
              href="/mun"
              className="h-card h-card--mun"
              aria-label="Explore MUN 2026 — Committees, agendas and more"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.005, transition: { type: "spring", stiffness: 280, damping: 22 } }}
              whileTap={{ scale: 0.985 }}
            >
              <div className="h-card-glow h-card-glow--mun" aria-hidden />
              <div className="h-card-top">
                <span className="h-card-pill h-card-pill--gold">MUN 2026</span>
              </div>
              <h3 className="h-card-title">
                Committees,<br />Agendas &amp; More
              </h3>
              <p className="h-card-desc">
                Eight committees. Three days. One summit — find your committee, read the agenda, and prepare to lead.
              </p>
              <div className="h-card-cta h-card-cta--outline">
                Explore MUN 2026 <ArrowRight size={15} />
              </div>
              <span className="h-card-ornament" aria-hidden>✦</span>
            </motion.a>

          </div>
        </div>
      </section>

      {/* PINNED SCROLL-STORY — cinematic statement sequence */}
      <PinnedStory />

      {/* ABOUT */}
      <section id="about" className="h-section" aria-label="About The Samaagm Summit">
        <div className="h-wrap">
          <div className="h-section-header h-reveal h-reveal--title">
            <span className="h-eyebrow">About TSS</span>
            <h2 className="h-section-title">
              More than
              <br />a conference.
            </h2>
          </div>

          <div className="h-about-grid">
            <div className="h-about-body">
              <p className="h-p h-reveal">
                The Samaagm Summit is a youth-driven conference designed to
                bring together students, thinkers, and future leaders onto one
                platform. Built around meaningful dialogue, collaboration, and
                real-world problem solving.
              </p>
              <p className="h-p h-reveal">
                At its core, TSS hosts a{" "}
                <strong>Model United Nations (MUN)</strong> — where participants
                take on roles of global representatives and engage in structured
                debates on pressing international and social issues.
              </p>
              <p className="h-p h-reveal">
                The Samaagm Summit is not just another conference — it is an
                experience that combines intellectual discussion with
                engagement, participation, and innovation.
              </p>

              <div className="h-tags h-reveal">
                <span className="h-tag">
                  <Calendar size={11} strokeWidth={1.5} />
                  31 Jul · 1 & 2 Aug 2026 · Indore
                </span>
                <a
                  className="h-tag h-tag--link"
                  href="https://www.instagram.com/thesamaagmsummit.tss"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={11} /> Stay Updated
                </a>
              </div>
            </div>

            <div className="h-about-cards">
              {[
                {
                  n: "01",
                  Icon: Mic,
                  head: "Model United Nations",
                  body: "Structured debates where you represent nations, propose resolutions, and engage with pressing global challenges.",
                },
                {
                  n: "02",
                  Icon: Globe,
                  head: "Democratic Format",
                  body: "Participants vote on pre-curated agenda options, helping shape the final committees and topics.",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.head}
                  className="h-about-card h-reveal"
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <span className="h-card-num">{s.n}</span>
                  <div className="h-card-icon">
                    <s.Icon size={18} strokeWidth={1.5} />
                  </div>
                  <h4 className="h-card-head">{s.head}</h4>
                  <p className="h-card-body">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-divider" aria-hidden>
        <div className="h-divider-line" />
        <span className="h-divider-glyph">✦</span>
        <div className="h-divider-line" />
      </div>

      {/* JOIN THE TEAM */}
      <section id="join" className="h-section h-section--join" aria-label="Join the Team">
        <div className="h-wrap">
          <div className="h-join-header h-reveal">
            <div>
              <span className="h-eyebrow">Get Involved</span>
              <h2 className="h-section-title">
                Join
                <br />
                the team.
              </h2>
            </div>
            <div className="h-join-header-right">
              <p className="h-join-sub">
                Whether you're here to lead, organise, or grow —<br />
                there's a seat for you at TSS.
              </p>
              <div className="h-join-open-badge">
                <span className="h-join-open-dot" />
                Roles still open — step in.
              </div>
            </div>
          </div>
        </div>

        <div className="h-form-rows">
          {FORMS.map((f, i) => (
            <motion.a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`h-form-row h-reveal ${f.tag === "NOW OPEN" ? "h-form-row--eb" : ""}`}
              whileHover={{ x: 6, scale: 1.005 }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="h-form-row-inner">
                <div className="h-form-row-icon-wrap">
                  <f.Icon
                    size={22}
                    strokeWidth={1.5}
                    className="h-form-row-icon"
                  />
                  <span className="h-form-row-num">{f.num}</span>
                </div>
                <div className="h-form-row-body">
                  <span className="h-form-row-label">{f.label}</span>
                  <span className="h-form-row-desc">{f.desc}</span>
                </div>
                <div className="h-form-row-cta">
                  <span className="h-form-row-tag">
                    <span className="h-form-row-tag-dot" />
                    {f.tag}
                  </span>
                  <span className="h-form-row-arrow">
                    Apply Now <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-divider" aria-hidden>
        <div className="h-divider-line" />
        <span className="h-divider-glyph">✦</span>
        <div className="h-divider-line" />
      </div>

      {/* DEMOCRATIC VISION */}
      <section id="vision" className="h-section" aria-label="Democratic Vision — A Summit Shaped by Its Delegates">
        <div className="h-wrap">
          <div className="h-section-header h-reveal h-reveal--title">
            <span className="h-eyebrow">The Concept</span>
            <h2 className="h-section-title">
              A summit shaped
              <br />
              by its delegates.
            </h2>
          </div>

          <div className="h-vision-layout">
            <div className="h-vision-body">
              <p className="h-p h-reveal">
                In many traditional MUNs, delegates often feel disconnected from
                the agendas being discussed. The Samaagm Summit is designed to
                change that.
              </p>
              <p className="h-p h-reveal">
                Before the conference, a series of{" "}
                <strong>interactive voting rounds on Instagram</strong> allows
                participants to choose between carefully curated agenda options.
                These votes help determine which topics and committees will
                ultimately be featured at the summit.
              </p>
              <blockquote className="h-quote h-reveal">
                <span className="h-quote-mark" aria-hidden>
                  "
                </span>
                A conference that is not just <em>for</em> the delegates — but{" "}
                <em>shaped with them</em>.
                <span className="h-quote-mark h-quote-mark--close" aria-hidden>
                  "
                </span>
              </blockquote>
            </div>

            <div className="h-vision-steps">
              {[
                {
                  n: "01",
                  head: "Voted Agendas",
                  body: "The community votes on Instagram to decide which topics get debated at each committee.",
                },
                {
                  n: "02",
                  head: "Curated Experiences",
                  body: "From music selection to event format — participants influence the environment they walk into.",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.n}
                  className="h-vision-step h-reveal"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="h-vision-step-num">{s.n}</div>
                  <div className="h-vision-step-line" />
                  <div className="h-vision-step-content">
                    <h4 className="h-vision-step-head">{s.head}</h4>
                    <p className="h-vision-step-body">{s.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-divider" aria-hidden>
        <div className="h-divider-line" />
        <span className="h-divider-glyph">✦</span>
        <div className="h-divider-line" />
      </div>

      {/* FOUNDERS */}
      <section id="founders" className="h-section" aria-label="Founders — Somya Khandare and Arjav Badjatya">
        <div className="h-wrap">
          <div className="h-section-header h-reveal h-reveal--title">
            <span className="h-eyebrow">The Founders</span>
            <h2 className="h-section-title">
              Founded by students,
              <br />
              built for students.
            </h2>
          </div>

          <div className="h-founders-editorial">
            {[
              {
                initials: "SK",
                name: "Somya Khandare",
                role: "CEO & Founder",
                age: "15",
              },
              {
                initials: "AB",
                name: "Arjav Badjatya",
                role: "CMO & Founder",
                age: "16",
              },
            ].map((f, i) => (
              <motion.div
                key={f.name}
                className={`h-founder-row h-reveal${i === 0 ? " h-founder-row--first" : ""}`}
                whileHover={{ y: -4, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className="h-founder-initials">{f.initials}</div>
                <div className="h-founder-details">
                  <span className="h-founder-role-tag">{f.role}</span>
                  <h3 className="h-founder-name-big">
                    {f.name}
                  </h3>
                </div>
                <div className="h-founder-meta">
                  <span className="h-founder-age-tag">{f.age} yrs</span>
                  <span className="h-founder-org">TSS</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM 9¾ — PAST EVENT */}
      <section className="h-event h-event--compact" aria-label="Platform 9¾ — Past Event by The Samaagm Summit">
        <div className="h-event-bg" aria-hidden>
          <div className="h-event-glow" />
          <div className="h-event-grid" />
          <div className="h-portal-core" />
          <div className="h-portal-arch" />
          <div className="h-portal-embers">
            {[...Array(16)].map((_, i) => (
              <span
                key={i}
                className="h-portal-ember"
                style={{
                  left: `${(i * 6.3 + 4) % 100}%`,
                  animationDuration: `${4 + (i % 6) * 0.9}s`,
                  animationDelay: `${(i * 0.5) % 6}s`,
                }}
              />
            ))}
          </div>
          <span className="h-portal-beam" />
        </div>
        <div className="h-wrap h-event-inner">
          <div className="h-event-top-row h-reveal">
            <div className="h-event-badge">
              <span>Past Event · The Samaagm Summit</span>
            </div>
            <div className="h-event-closed-stamp">
              <span className="h-event-closed-dot" />
              Concluded · April 2026
            </div>
          </div>

          <div className="h-event-title-block h-reveal">
            <span className="h-event-title-eyebrow">Platform</span>
            <h2 className="h-event-title h-event-title--sm">9¾</h2>
          </div>

          <p className="h-event-tagline h-reveal">
            350+ attendees. One night of magic, music, and memories — Indore,
            April 12.
          </p>

          <motion.button 
            className="h-cta h-cta--event h-reveal" 
            onClick={goEvent}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.985 }}
          >
            View Recap <ArrowRight size={16} />
          </motion.button>
        </div>
      </section>

      {/* FLOATING JOIN PILL + POPUP */}
      <div
        className={`h-join-pill-wrap${showPill ? " h-join-pill-wrap--visible" : ""}`}
        ref={pillRef}
      >
        {pillOpen && (
          <div className="h-pill-panel">
            {FORMS.map((f, i) => (
              <a
                key={f.url}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-pill-panel-row"
              >
                <span className="h-pill-panel-row-num">0{i + 1}</span>
                <span className="h-pill-panel-row-label">{f.label}</span>
                <span className="h-pill-panel-row-arrow">→</span>
              </a>
            ))}
          </div>
        )}

        <motion.button
          className={`h-join-pill${pillOpen ? " h-join-pill--open" : ""}`}
          onClick={() => setPillOpen((o) => !o)}
          aria-label="Join the team"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="h-join-pill-dot" />
          <Users size={13} strokeWidth={2} />
          <span className="h-join-pill-text">Join the Team</span>
          <ChevronUp
            size={12}
            strokeWidth={2.5}
            className={`h-join-pill-chevron${pillOpen ? " h-join-pill-chevron--open" : ""}`}
          />
        </motion.button>
      </div>

      </main>

      {/* BACK TO TOP */}
      <button
        className={`h-to-top h-to-top--left${showTop ? " h-to-top--visible" : ""}`}
        aria-label="Back to top"
        onClick={() => lenisScrollTop()}
      >
        <ChevronUp size={18} strokeWidth={2} />
      </button>

      {/* FOOTER */}
      <footer className="h-footer" role="contentinfo">
        <div className="h-footer-marquee" aria-hidden>
          <div className="h-marquee-track h-marquee-track--slow">
            {[...MARQUEE_TEXT, ...MARQUEE_TEXT, ...MARQUEE_TEXT].map((t, i) => (
              <span key={i} className="h-marquee-item">
                <span className="h-marquee-dot">✦</span>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="h-footer-finale">
          <div className="h-footer-finale-inner">
            <p className="h-footer-finale-eyebrow">India's First Democratic Summit</p>
            <h2 className="h-footer-finale-title">
              The Samaagm
              <br />
              <em>Summit.</em>
            </h2>
            <a
              className="h-cta h-cta--primary h-footer-finale-cta"
              href="https://forms.gle/G3i22pDqRbDT8sNt5"
              target="_blank"
              rel="noopener noreferrer"
            >
              Register as Delegate <ArrowRight size={15} />
            </a>
            <p className="h-footer-finale-meta">31 Jul – 2 Aug 2026 · Indore, India</p>
          </div>
        </div>
        <div className="h-wrap h-footer-inner">
          <div className="h-footer-brand">
            <span className="h-footer-tss">TSS</span>
            <span className="h-footer-name">The Samaagm Summit</span>
          </div>
          <div className="h-footer-links">
            <a
              href="https://www.instagram.com/thesamaagmsummit.tss"
              target="_blank"
              rel="noopener noreferrer"
              className="h-footer-link"
            >
              <Instagram size={13} /> Instagram
            </a>
            <a
              href="mailto:thesamaagmsummit@gmail.com"
              className="h-footer-link"
            >
              thesamaagmsummit@gmail.com
            </a>
          </div>
          <p className="h-footer-copy">
            © 2026 The Samaagm Summit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
