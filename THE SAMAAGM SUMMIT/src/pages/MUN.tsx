import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Instagram,
  Calendar,
  MapPin,
  Lock,
  FileText,
  GraduationCap,
  Crown,
  Vote,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../mun.css";
import { useMousePos } from "@/hooks/use-mouse-pos";
import { useReveal } from "@/hooks/use-reveal";

interface Committee {
  id: string;
  name: string;
  logo: string;
  type: "indian" | "un";
  typeLabel: string;
  agenda: string;
}

interface DetailItem {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string;
  status: "confirmed" | "soon" | "open";
  url?: string;
}

const COMMITTEES: Committee[] = [
  {
    id: "lok-sabha",
    name: "Lok Sabha",
    logo: "/logos/lok-sabha-logo.svg",
    type: "indian",
    typeLabel: "Indian Committee",
    agenda:
      "Urgent Enactment of a National Employment Generation and Recruitment Reform Bill, with Special Emphasis on Rising Youth Unemployment, Emerging Youth Movements, and Recent Public Statements by Senior Authorities.",
  },
  {
    id: "aippm",
    name: "AIPPM",
    logo: "/logos/AIPPM logo.svg",
    type: "indian",
    typeLabel: "Indian Committee",
    agenda:
      "Strengthening Constitutional Safeguards under the Constitution (130th Amendment) Act, 2025.",
  },
  {
    id: "rajya-sabha",
    name: "Rajya Sabha",
    logo: "/logos/rajya-sabha-logo.svg",
    type: "indian",
    typeLabel: "Indian Committee",
    agenda:
      "Constitutional Regulation of Bulldozer Justice with Special Emphasis on Recent Actions by Various State Governments.",
  },
  {
    id: "unhrc",
    name: "UNHRC",
    logo: "/logos/UNHRC logo.svg",
    type: "un",
    typeLabel: "UN Committee",
    agenda:
      "Examination of Human Rights Violations Arising from Strategic Diplomatic Alliances, with Special Emphasis on the Iran–Israel–United States Conflict.",
  },
  {
    id: "uncsw",
    name: "UNCSW",
    logo: "/logos/UNCSW logo.svg",
    type: "un",
    typeLabel: "UN Committee",
    agenda:
      "The Poverty Trap: Redefining Global Legal Frameworks on Sex Work, Labor Rights, and the Structural Exploitation of Women in the Informal Economy.",
  },
  {
    id: "disec",
    name: "UNGA DISEC",
    logo: "/logos/UNGA DISEC logo.svg",
    type: "un",
    typeLabel: "UN Committee",
    agenda:
      "Addressing Strategic Arms Control Challenges Following the Expiration of the New START Treaty and Strengthening the Future Global Nuclear Disarmament Framework.",
  },
];

const DETAILS: DetailItem[] = [
  {
    Icon: Calendar,
    label: "Conference Dates",
    value: "31 July – 2 August 2026",
    status: "confirmed",
  },
  { Icon: MapPin, label: "City", value: "Indore, India", status: "confirmed" },
  { Icon: Lock, label: "Venue", value: "To Be Revealed", status: "soon" },
  {
    Icon: GraduationCap,
    label: "Delegate Applications",
    value: "Opening Soon",
    status: "soon",
  },
  {
    Icon: Crown,
    label: "EB Applications",
    value: "Apply Now",
    status: "open",
    url: "https://forms.gle/E2yPwFmndCUq7Pmx5",
  },
  {
    Icon: FileText,
    label: "All Documents & Guides",
    value: "To Be Released",
    status: "soon",
  },
];

// ─── Committee Card ────────────────────────────────────────────────────────────
// MUST be defined outside the parent component so React never sees it as a
// "new" component type on re-render (which caused the full unmount/remount lag).
function CommitteeCard({
  committee,
  index,
  onOpen,
}: {
  committee: Committee;
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.div
      className="m-premium-card"
      onClick={onOpen}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{
        delay: Math.min(index * 0.04, 0.16),
        type: "spring",
        stiffness: 140,
        damping: 20,
      }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 22 } }}
      whileTap={{ scale: 0.985 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Open details for ${committee.name}`}
    >
      <div className="m-card-glow" aria-hidden />

      <div className="m-card-logo-wrap">
        <img
          src={committee.logo}
          alt={`${committee.name} logo`}
          className="m-card-logo"
          loading="lazy"
        />
      </div>

      <div className="m-card-body">
        <div className="m-card-meta">
          <h3 className="m-card-name">{committee.name}</h3>
          <span className={`m-card-type m-card-type--${committee.type}`}>
            {committee.typeLabel}
          </span>
        </div>

        <div className="m-card-divider" />

        <div className="m-card-agenda-wrap">
          <span className="m-card-agenda-label">Agenda</span>
          <div className="m-card-agenda-block">
            <p className="m-card-agenda">{committee.agenda}</p>
          </div>
        </div>
      </div>

      <div className="m-card-footer">
        <div className="m-card-explore">
          Explore <ArrowRight size={13} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MUN() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "indian" | "un">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { dotRef, ringRef } = useMousePos();
  useReveal({ threshold: 0.06, rootMargin: "0px 0px -28px 0px" });

  // Page meta
  useEffect(() => {
    const prev = document.title;
    document.title = "MUN 2026 — The Samaagm Summit";
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? "";
    desc?.setAttribute(
      "content",
      "The Samaagm Summit MUN Conference 2026, Edition I — July 31 to August 2, Indore. Six committees: Lok Sabha, AIPPM, Rajya Sabha, UNHRC, UNCSW, UNGA DISEC. India's first democratic summit.",
    );
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? "";
    canonical?.setAttribute("href", "https://thesamaagmsummit.netlify.app/mun");
    return () => {
      document.title = prev;
      desc?.setAttribute("content", prevDesc);
      canonical?.setAttribute("href", prevCanonical);
    };
  }, []);

  // Scroll state for nav
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Body scroll lock when modal is open
  useEffect(() => {
    if (selectedId) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [selectedId]);

  // Keyboard close for modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredCommittees = COMMITTEES.filter(
    (c) => filter === "all" || c.type === filter,
  );
  const selectedCommittee = COMMITTEES.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="m-root">
      <div className="h-cursor-dot" ref={dotRef} />
      <div className="h-cursor-ring" ref={ringRef} />

      {/* BG FX */}
      <div className="h-bg-fx" aria-hidden>
        <div className="h-bg-noise" />
        <div className="h-bg-scan" />
        <div className="h-bg-glow h-bg-glow--top" />
        <div className="h-bg-glow h-bg-glow--mid" />
        <div className="h-bg-glow h-bg-glow--bot" />
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className={`h-ptcl ${i % 5 === 0 ? "h-ptcl--gold" : ""}`}
            style={{
              left: `${(i * 6.8 + 5) % 100}%`,
              width: `${1.5 + (i % 3) * 1.5}px`,
              height: `${1.5 + (i % 3) * 1.5}px`,
              animationDuration: `${8 + (i % 9) * 2}s`,
              animationDelay: `${(i * 0.7) % 8}s`,
            }}
          />
        ))}
        <svg className="h-orbital m-orbital" aria-hidden viewBox="0 0 600 600">
          <ellipse
            cx="300" cy="300" rx="240" ry="88"
            fill="none" stroke="rgba(204,0,0,0.3)" strokeWidth="1"
          />
          <ellipse
            cx="300" cy="300" rx="155" ry="235"
            fill="none" stroke="rgba(204,0,0,0.18)" strokeWidth="1"
          />
        </svg>
      </div>

      {/* NAV */}
      <header className={`h-nav${scrolled ? " h-nav--solid" : ""}`} role="banner">
        <div className="h-nav-inner">
          <button className="h-logo" onClick={() => navigate("/")}>
            <span className="h-logo-tss">TSS</span>
            <span className="h-logo-sep" aria-hidden>—</span>
            <span className="h-logo-name">The Samaagm Summit</span>
          </button>
          <nav className="h-nav-links" aria-label="Page sections">
            <button
              className="h-nav-link"
              onClick={() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" })}
            >
              <span className="h-nav-link-text">Details</span>
            </button>
            <button
              className="h-nav-link"
              onClick={() => document.getElementById("committees")?.scrollIntoView({ behavior: "smooth" })}
            >
              <span className="h-nav-link-text">Committees</span>
            </button>
            <a
              className="h-nav-link h-nav-link--ig"
              href="https://www.instagram.com/thesamaagmsummit.tss"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="h-nav-link-icon"><Instagram size={13} /></span>
              <span className="h-nav-link-text">Instagram</span>
            </a>
          </nav>
          <div className="m-edition-badge">Edition I · 2026</div>
          <button
            className={`h-ham${menuOpen ? " h-ham--open" : ""}`}
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="h-mobile-menu">
            <button
              className="h-mobile-link"
              onClick={() => { navigate("/"); setMenuOpen(false); }}
            >
              ← Back to TSS
            </button>
            <button
              className="h-mobile-link"
              onClick={() => {
                document.getElementById("details")?.scrollIntoView({ behavior: "smooth" });
                setMenuOpen(false);
              }}
            >
              Details
            </button>
            <button
              className="h-mobile-link"
              onClick={() => {
                document.getElementById("committees")?.scrollIntoView({ behavior: "smooth" });
                setMenuOpen(false);
              }}
            >
              Committees
            </button>
            <a
              className="h-mobile-link"
              href="https://www.instagram.com/thesamaagmsummit.tss"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a className="h-mobile-link" href="/event">
              Platform 9¾
            </a>
          </div>
        )}
      </header>

      <main id="main-content">
        {/* ── HERO ── */}
        <section
          className="m-hero"
          aria-label="The Samaagm Summit MUN Conference 2026 Edition I"
        >
          <div className="m-hero-corners" aria-hidden>
            <span className="m-corner m-corner--tl">The Samaagm Summit</span>
            <span className="m-corner m-corner--tr">Edition I · 2026</span>
            <span className="m-corner m-corner--bl">India's First Democratic Summit</span>
            <span className="m-corner m-corner--br">Indore · India</span>
          </div>
          <div className="m-vtext m-vtext--l" aria-hidden>
            <span>THE SAMAAGM SUMMIT · MUN · 2026</span>
          </div>
          <div className="m-vtext m-vtext--r" aria-hidden>
            <span>COMMITTEES · DIPLOMACY · DEBATE</span>
          </div>

          <div className="m-hero-inner">
            <motion.div
              className="m-hero-edition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <span className="m-edition-line" />
              Edition I · 2026
              <span className="m-edition-line" />
            </motion.div>

            <motion.h1
              className="m-hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 70 }}
            >
              The Samaagm
              <br />
              Summit
            </motion.h1>

            <motion.p
              className="m-hero-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              Model United Nations Conference
            </motion.p>

            <div className="m-hero-rule" aria-hidden />

            <motion.div
              className="m-hero-dates"
              aria-label="31 July to 2 August 2026"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <div className="m-date-block">
                <span className="m-date-num">31</span>
                <span className="m-date-label">July</span>
              </div>
              <span className="m-date-sep" aria-hidden>—</span>
              <div className="m-date-block">
                <span className="m-date-num">02</span>
                <span className="m-date-label">August</span>
              </div>
              <span className="m-date-yr" aria-hidden>2026</span>
            </motion.div>

            <div className="m-hero-location">
              <MapPin size={12} strokeWidth={1.5} />
              Indore, India
              <span className="m-hero-venue-sep" aria-hidden>·</span>
              <Lock size={11} strokeWidth={1.5} style={{ opacity: 0.5 }} />
              <span style={{ color: "rgba(212,168,67,0.6)" }}>
                Venue: To Be Revealed
              </span>
            </div>

            <motion.div
              className="m-hero-btns"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <button
                className="h-cta h-cta--primary"
                onClick={() => document.getElementById("committees")?.scrollIntoView({ behavior: "smooth" })}
              >
                View Committees <ArrowRight size={14} />
              </button>
              <a
                className="h-cta h-cta--join"
                href="https://www.instagram.com/thesamaagmsummit.tss"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={14} />
                Follow for Updates
              </a>
            </motion.div>
          </div>

          <div
            className="h-scroll-cue"
            onClick={() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="h-scroll-line" />
            <span className="h-scroll-label">Scroll</span>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="h-marquee-strip" aria-hidden>
          <div className="h-marquee-track">
            {["THE SAMAAGM SUMMIT", "MUN 2026", "EDITION I", "INDORE · INDIA", "6 COMMITTEES", "JULY 31 – AUGUST 2"]
              .flatMap((t) => [t, t, t])
              .map((t, i) => (
                <span key={i} className="h-marquee-item">
                  <span className="h-marquee-dot">✦</span>
                  {t}
                </span>
              ))}
          </div>
        </div>

        {/* ── CONFERENCE DETAILS ── */}
        <section id="details" className="h-section" aria-label="Conference details">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">Conference Details</span>
              <h2 className="h-section-title">
                What you need
                <br />
                to know.
              </h2>
            </div>

            <div className="m-details-grid">
              {DETAILS.map((d, i) => {
                const isEB = d.label === "EB Applications";
                const tileContent = (
                  <>
                    <div className="m-detail-top">
                      <d.Icon size={16} strokeWidth={1.4} className="m-detail-icon" />
                      <span className={`m-detail-badge ${isEB ? "m-detail-badge--open" : `m-detail-badge--${d.status}`}`}>
                        <span className="m-detail-dot" />
                        {isEB ? "Now Open" : d.status === "confirmed" ? "Confirmed" : "Coming Soon"}
                      </span>
                    </div>
                    <div className="m-detail-label">{d.label}</div>
                    <div className="m-detail-value">{d.value}</div>
                  </>
                );

                if (isEB && d.url) {
                  return (
                    <a
                      key={d.label}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-detail-tile m-detail--open m-detail-eb-highlight"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {tileContent}
                    </a>
                  );
                }

                return (
                  <div
                    key={d.label}
                    className={`m-detail-tile m-detail--${d.status}`}
                  >
                    {tileContent}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <div className="m-timeline h-reveal">
          <div className="m-timeline-inner">
            <div className="m-timeline-dates">
              <motion.div
                className="m-timeline-date"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <span className="m-timeline-num">31</span>
                <span className="m-timeline-month">July</span>
              </motion.div>
              <div className="m-timeline-connector">
                <motion.div
                  className="m-timeline-line"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
                  style={{ transformOrigin: "left" }}
                />
                <motion.div
                  className="m-timeline-dot"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
                />
              </div>
              <motion.div
                className="m-timeline-date"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 }}
              >
                <span className="m-timeline-num">01</span>
                <span className="m-timeline-month">Aug</span>
              </motion.div>
              <div className="m-timeline-connector">
                <motion.div
                  className="m-timeline-line"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.55, duration: 0.6, ease: "easeOut" }}
                  style={{ transformOrigin: "left" }}
                />
                <motion.div
                  className="m-timeline-dot"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.65, type: "spring", stiffness: 200 }}
                />
              </div>
              <motion.div
                className="m-timeline-date"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.75 }}
              >
                <span className="m-timeline-num">02</span>
                <span className="m-timeline-month">Aug</span>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="h-divider" aria-hidden>
          <div className="h-divider-line" />
          <span className="h-divider-glyph">✦</span>
          <div className="h-divider-line" />
        </div>

        {/* ── ABOUT + DEMOCRATIC ── */}
        <section className="h-section h-section--accent" aria-label="About MUN and the democratic summit format">
          <div className="h-wrap">
            <div className="m-about-cols">
              <div className="m-about-col h-reveal">
                <span className="h-eyebrow">The Format</span>
                <h2 className="m-about-title">What is MUN?</h2>
                <p className="h-p">
                  A Model United Nations conference where students represent
                  nations, debate real global issues inside simulated
                  parliamentary and UN bodies, and draft resolutions —
                  developing diplomacy, negotiation, and leadership under
                  pressure.
                </p>
                <div className="m-about-pills">
                  {["Diplomacy", "Debate", "Resolutions", "Leadership", "Negotiation"].map((p) => (
                    <span key={p} className="m-about-pill">{p}</span>
                  ))}
                </div>
              </div>

              <div className="m-about-col h-reveal" style={{ transitionDelay: "0.1s" }}>
                <span className="h-eyebrow">The Concept</span>
                <h2 className="m-about-title">
                  India's First
                  <br />
                  Democratic Summit.
                </h2>
                <p className="h-p">
                  Before the conference, the community votes on Instagram to
                  choose which agendas get debated. The most popular choices
                  become the final committee topics — making this the only
                  summit where delegates shape the agenda before it begins.
                </p>
                <div className="m-process-steps">
                  {[
                    { Icon: Vote, text: "Agenda options released on Instagram" },
                    { Icon: CheckCircle2, text: "Community votes, preferences tallied" },
                    { Icon: ArrowRight, text: "Top-voted agendas finalized as committees" },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      className="m-process-step"
                      initial={{ opacity: 0, x: -15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                    >
                      <s.Icon size={14} strokeWidth={1.5} className="m-process-icon" />
                      <span>{s.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-divider" aria-hidden>
          <div className="h-divider-line" />
          <span className="h-divider-glyph">✦</span>
          <div className="h-divider-line" />
        </div>

        {/* ── COMMITTEES ── */}
        <section id="committees" className="h-section" aria-label="Finalized committees and agendas">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">Finalized Committees</span>
              <h2 className="h-section-title">
                Committees
                <br />& Agendas.
              </h2>
              <p className="h-lead">
                All six committee agendas were chosen through community voting.
                Below are the confirmed bodies, their type, and their selected agendas.
              </p>
            </div>

            {/* Filter tabs */}
            <div className="m-premium-filters h-reveal" role="tablist" aria-label="Filter by committee type">
              {[
                { key: "all" as const, label: "All", count: COMMITTEES.length },
                { key: "indian" as const, label: "Indian Parliament", count: COMMITTEES.filter((c) => c.type === "indian").length },
                { key: "un" as const, label: "United Nations", count: COMMITTEES.filter((c) => c.type === "un").length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={filter === tab.key}
                  className={`m-premium-filter${filter === tab.key ? " active" : ""}`}
                  onClick={() => setFilter(tab.key)}
                >
                  <span className="filter-label">{tab.label}</span>
                  <span className="filter-count">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Cards grid — no layout prop on grid, instant exit so cards don't hold space */}
            <div className="m-committees-grid">
              <AnimatePresence mode="sync">
                {filteredCommittees.map((c, i) => (
                  <CommitteeCard
                    key={c.id}
                    committee={c}
                    index={i}
                    onOpen={() => setSelectedId(c.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ── COMMITTEE MODAL ── */}
        <AnimatePresence>
          {selectedCommittee && (
            <motion.div
              className="m-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedId(null)}
              aria-modal="true"
              role="dialog"
              aria-label={`Details for ${selectedCommittee.name}`}
            >
              <motion.div
                className="m-modal"
                initial={{ opacity: 0, y: 48, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="m-modal-close"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close committee details"
                >
                  ×
                </button>

                <div className="m-modal-logo">
                  <img src={selectedCommittee.logo} alt="" />
                </div>

                <div className="m-modal-meta">
                  <span className={`m-card-type m-card-type--${selectedCommittee.type}`}>
                    {selectedCommittee.typeLabel}
                  </span>
                </div>

                <h3 className="m-modal-name">{selectedCommittee.name}</h3>

                <div className="m-modal-agenda">
                  <span className="m-modal-agenda-label">The Agenda</span>
                  <p>{selectedCommittee.agenda}</p>
                </div>

                <div className="m-modal-note">
                  This agenda was selected through community voting on Instagram.
                </div>

                <div className="m-modal-actions">
                  <a
                    href="https://www.instagram.com/thesamaagmsummit.tss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="m-ig-cta"
                  >
                    <Instagram size={15} /> Follow updates
                  </a>
                  <button onClick={() => setSelectedId(null)} className="m-modal-close-btn">
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-divider" aria-hidden>
          <div className="h-divider-line" />
          <span className="h-divider-glyph">✦</span>
          <div className="h-divider-line" />
        </div>

        {/* ── STAY UPDATED ── */}
        <section className="h-section" aria-label="Stay updated — follow on Instagram">
          <div className="h-wrap">
            <div className="m-update-row h-reveal">
              <div className="m-update-left">
                <span className="h-eyebrow">Follow Along</span>
                <h2 className="m-update-title">Stay updated.</h2>
                <p className="h-p" style={{ maxWidth: 400 }}>
                  All announcements — from venue reveals to delegate applications
                  and special committees — drop on Instagram first.
                </p>
                <a
                  href="https://www.instagram.com/thesamaagmsummit.tss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="m-ig-cta"
                >
                  <Instagram size={16} strokeWidth={1.8} />
                  @thesamaagmsummit.tss
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="h-footer" role="contentinfo">
        <div className="h-footer-marquee" aria-hidden>
          <div className="h-marquee-track h-marquee-track--slow">
            {["THE SAMAAGM SUMMIT", "MUN 2026", "EDITION I", "INDORE · INDIA", "JULY 31 – AUGUST 2"]
              .flatMap((t) => [t, t, t])
              .map((t, i) => (
                <span key={i} className="h-marquee-item">
                  <span className="h-marquee-dot">✦</span>
                  {t}
                </span>
              ))}
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
            <a href="mailto:thesamaagmsummit@gmail.com" className="h-footer-link">
              thesamaagmsummit@gmail.com
            </a>
            <a
              className="h-footer-link"
              href="/"
              onClick={(e) => { e.preventDefault(); navigate("/"); }}
            >
              Back to TSS
            </a>
          </div>
          <p className="h-footer-copy">© 2026 The Samaagm Summit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
