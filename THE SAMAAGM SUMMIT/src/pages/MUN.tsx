import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Instagram,
  Globe,
  Mic,
  Users,
  Scale,
  Shield,
  Vote,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Clock,
  FileText,
  BookOpen,
  Table2,
  GraduationCap,
  Crown,
  Star,
  CheckCircle2,
  Lock,
} from "lucide-react";
import "../mun.css";

function useMunReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("h-visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.06, rootMargin: "0px 0px -32px 0px" },
    );
    document.querySelectorAll(".h-reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function useMunMousePos() {
  const pos = useRef({ x: -200, y: -200 });
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let raf: number;
    const move = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    const tick = () => {
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      if (ringRef.current) {
        const rx = parseFloat(ringRef.current.style.getPropertyValue("--rx") || String(pos.current.x));
        const ry = parseFloat(ringRef.current.style.getPropertyValue("--ry") || String(pos.current.y));
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
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);
  return { dotRef, ringRef };
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const COMMITTEES = [
  {
    id: "lok-sabha",
    num: "01",
    abbr: "LS",
    name: "Lok Sabha",
    body: "India",
    bodyType: "india" as const,
    agenda: "Urgent Enactment of a National Employment Generation and Recruitment Reform Bill, with Special Emphasis on Rising Youth Unemployment, Emerging Youth Movements, and Recent Public Statements by Senior Authorities.",
  },
  {
    id: "aippm",
    num: "02",
    abbr: "AIPPM",
    name: "AIPPM",
    body: "India",
    bodyType: "india" as const,
    agenda: "Strengthening Constitutional Safeguards under the Constitution (130th Amendment) Act, 2025.",
  },
  {
    id: "rajya-sabha",
    num: "03",
    abbr: "RS",
    name: "Rajya Sabha",
    body: "India",
    bodyType: "india" as const,
    agenda: "Constitutional Regulation of Bulldozer Justice with Special Emphasis on Recent Actions by Various State Governments.",
  },
  {
    id: "unhrc",
    num: "04",
    abbr: "UNHRC",
    name: "UNHRC",
    body: "United Nations",
    bodyType: "un" as const,
    agenda: "Examination of Human Rights Violations Arising from Strategic Diplomatic Alliances, with Special Emphasis on the Iran–Israel–United States Conflict.",
  },
  {
    id: "uncsw",
    num: "05",
    abbr: "UNCSW",
    name: "UNCSW",
    body: "United Nations",
    bodyType: "un" as const,
    agenda: "The Poverty Trap: Redefining Global Legal Frameworks on Sex Work, Labor Rights, and the Structural Exploitation of Women in the Informal Economy.",
  },
  {
    id: "disec",
    num: "06",
    abbr: "DISEC",
    name: "UNGA DISEC",
    body: "United Nations",
    bodyType: "un" as const,
    agenda: "Addressing Strategic Arms Control Challenges Following the Expiration of the New START Treaty and Strengthening the Future Global Nuclear Disarmament Framework.",
  },
];

const COMMITTEE_ICONS: Record<string, JSX.Element> = {
  "lok-sabha": (
    <svg viewBox="0 0 64 64" fill="none" className="m-committee-icon-svg" aria-hidden>
      <ellipse cx="32" cy="22" rx="20" ry="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="12" y1="22" x2="8" y2="52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="52" y1="22" x2="56" y2="52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="52" x2="56" y2="52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="28" x2="18" y2="52" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="32" y1="30" x2="32" y2="52" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="44" y1="28" x2="46" y2="52" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <circle cx="32" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M28 14 L32 10 L36 14" stroke="currentColor" strokeWidth="1" fill="none"/>
    </svg>
  ),
  "aippm": (
    <svg viewBox="0 0 64 64" fill="none" className="m-committee-icon-svg" aria-hidden>
      <rect x="22" y="34" width="20" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M18 34 L32 20 L46 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="32" y1="20" x2="32" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <circle cx="50" cy="26" r="4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <circle cx="10" cy="40" r="4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <circle cx="54" cy="40" r="4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <line x1="18" y1="28" x2="22" y2="32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
      <line x1="46" y1="28" x2="42" y2="32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  "rajya-sabha": (
    <svg viewBox="0 0 64 64" fill="none" className="m-committee-icon-svg" aria-hidden>
      <path d="M10 50 A28 28 0 0 1 54 50" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="32" cy="38" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {[0,1,2,3,4,5,6,7,8].map((i) => {
        const angle = (180 / 8) * i;
        const rad = (angle * Math.PI) / 180;
        const r1 = 20, r2 = 26;
        const x1 = 32 + r1 * Math.cos(Math.PI - rad);
        const y1 = 50 + r1 * Math.sin(Math.PI - rad);
        const x2 = 32 + r2 * Math.cos(Math.PI - rad);
        const y2 = 50 + r2 * Math.sin(Math.PI - rad);
        return <circle key={i} cx={(x1+x2)/2} cy={(y1+y2)/2} r="2.5" stroke="currentColor" strokeWidth="1" fill="none" opacity={i === 4 ? "1" : "0.45"}/>;
      })}
      <line x1="32" y1="33" x2="32" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="32" cy="15" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  "unhrc": (
    <svg viewBox="0 0 64 64" fill="none" className="m-committee-icon-svg" aria-hidden>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <ellipse cx="32" cy="32" rx="12" ry="22" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.45"/>
      <line x1="10" y1="24" x2="54" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
      <line x1="10" y1="40" x2="54" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
      <circle cx="32" cy="22" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M24 54 C24 44 40 44 40 54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  "uncsw": (
    <svg viewBox="0 0 64 64" fill="none" className="m-committee-icon-svg" aria-hidden>
      <line x1="20" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="24" x2="32" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 16 L28 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M46 16 L36 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="13" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="50" cy="13" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M26 44 Q32 50 38 44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="32" cy="55" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="28" y1="55" x2="36" y2="55" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  "disec": (
    <svg viewBox="0 0 64 64" fill="none" className="m-committee-icon-svg" aria-hidden>
      <path d="M32 8 L54 20 L54 44 L32 56 L10 44 L10 20 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="32" cy="32" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <ellipse cx="32" cy="32" rx="17" ry="7" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.55" transform="rotate(0 32 32)"/>
      <ellipse cx="32" cy="32" rx="17" ry="7" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.55" transform="rotate(60 32 32)"/>
      <ellipse cx="32" cy="32" rx="17" ry="7" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.55" transform="rotate(-60 32 32)"/>
    </svg>
  ),
};

const MUN_NAV = [
  { id: "overview", label: "Overview" },
  { id: "committees", label: "Committees" },
  { id: "process", label: "Process" },
  { id: "updates", label: "Updates" },
];

const COMING_SOON_ITEMS = [
  { Icon: FileText, label: "Portfolio Guides", desc: "In-depth committee and topic briefings for every delegate.", tag: "GUIDES" },
  { Icon: Table2, label: "Committee Matrix", desc: "Allocation matrix, preferences, and delegate placements.", tag: "MATRIX" },
  { Icon: BookOpen, label: "Background Guides", desc: "Research frameworks, country positions, and resolution drafting.", tag: "STUDY GUIDES" },
  { Icon: GraduationCap, label: "Delegate Applications", desc: "Applications for delegates wishing to participate in TSS MUN.", tag: "APPLICATIONS" },
  { Icon: Crown, label: "Executive Board Applications", desc: "Chairpersons and rapporteurs for each committee body.", tag: "APPLICATIONS" },
];

export default function MUN() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCommittee, setExpandedCommittee] = useState<string | null>(null);
  const { dotRef, ringRef } = useMunMousePos();
  useMunReveal();

  useEffect(() => {
    const prev = document.title;
    document.title = "MUN — The Samaagm Summit";
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? "";
    desc?.setAttribute("content", "The Samaagm Summit Model United Nations Conference — July 31 to August 2, 2026, Indore. Six finalized committees: Lok Sabha, AIPPM, Rajya Sabha, UNHRC, UNCSW, UNGA DISEC. India's first democratic summit.");
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? "";
    canonical?.setAttribute("href", "https://thesamaagmsummit.netlify.app/mun");
    return () => {
      document.title = prev;
      desc?.setAttribute("content", prevDesc);
      canonical?.setAttribute("href", prevCanonical);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleCommittee(id: string) {
    setExpandedCommittee(prev => prev === id ? null : id);
  }

  return (
    <div className="m-root">
      <div className="h-cursor-dot" ref={dotRef} />
      <div className="h-cursor-ring" ref={ringRef} />

      {/* Background FX — same as home */}
      <div className="h-bg-fx" aria-hidden>
        <div className="h-bg-noise" />
        <div className="h-bg-scan" />
        <div className="h-bg-glow h-bg-glow--top" />
        <div className="h-bg-glow h-bg-glow--mid" />
        <div className="h-bg-glow h-bg-glow--bot" />
        {[...Array(18)].map((_, i) => (
          <div key={i} className={`h-ptcl ${i % 5 === 0 ? "h-ptcl--gold" : ""}`}
            style={{ left: `${(i * 5.5 + 7) % 100}%`, width: `${1.5 + (i % 3) * 1.5}px`, height: `${1.5 + (i % 3) * 1.5}px`, animationDuration: `${8 + (i % 9) * 2}s`, animationDelay: `${(i * 0.8) % 8}s` }}
          />
        ))}
        <svg className="h-orbital m-orbital-2" aria-hidden viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="300" cy="300" rx="240" ry="88" fill="none" stroke="rgba(204,0,0,0.35)" strokeWidth="1"/>
          <ellipse cx="300" cy="300" rx="155" ry="235" fill="none" stroke="rgba(204,0,0,0.22)" strokeWidth="1"/>
        </svg>
      </div>

      {/* NAV */}
      <header className={`h-nav${scrolled ? " h-nav--solid" : ""}`} role="banner">
        <div className="h-nav-inner">
          <button className="h-logo m-back-logo" onClick={() => navigate("/")}>
            <span className="h-logo-tss">TSS</span>
            <span className="h-logo-sep" aria-hidden>—</span>
            <span className="h-logo-name">The Samaagm Summit</span>
          </button>

          <nav className="h-nav-links" aria-label="MUN page sections">
            {MUN_NAV.map(({ id, label }) => (
              <button key={id} className="h-nav-link" onClick={() => scrollTo(id)}>
                <span className="h-nav-link-text">{label}</span>
              </button>
            ))}
            <a className="h-nav-link h-nav-link--ig" href="https://www.instagram.com/thesamaagmsummit.tss" target="_blank" rel="noopener noreferrer" title="Instagram">
              <span className="h-nav-link-icon"><Instagram size={13} /></span>
              <span className="h-nav-link-text">Instagram</span>
            </a>
          </nav>

          <div className="m-mun-badge" aria-label="MUN Conference page">MUN 2026</div>

          <button className={`h-ham${menuOpen ? " h-ham--open" : ""}`} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>

        {menuOpen && (
          <div className="h-mobile-menu">
            <button className="h-mobile-link" onClick={() => { navigate("/"); setMenuOpen(false); }}>← Back to TSS</button>
            {MUN_NAV.map(({ id, label }) => (
              <button key={id} className="h-mobile-link" onClick={() => { scrollTo(id); setMenuOpen(false); }}>{label}</button>
            ))}
            <a className="h-mobile-link" href="https://www.instagram.com/thesamaagmsummit.tss" target="_blank" rel="noopener noreferrer"><Instagram size={14} strokeWidth={1.5} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />Instagram</a>
          </div>
        )}
      </header>

      <main id="main-content">

        {/* ── HERO ── */}
        <section id="overview" className="m-hero" aria-label="TSS Model United Nations Conference 2026">
          <div className="m-hero-corners" aria-hidden>
            <span className="m-corner m-corner--tl">MODEL UNITED NATIONS</span>
            <span className="m-corner m-corner--tr">TSS · 2026</span>
            <span className="m-corner m-corner--bl">INDIA'S FIRST DEMOCRATIC SUMMIT</span>
            <span className="m-corner m-corner--br">INDORE · INDIA</span>
          </div>
          <div className="m-side-text m-side-text--l" aria-hidden><span>THE SAMAAGM SUMMIT · MUN · 2026 ·</span></div>
          <div className="m-side-text m-side-text--r" aria-hidden><span>COMMITTEES · DELEGATES · DEBATE · DIPLOMACY</span></div>

          <div className="m-hero-inner">
            <p className="m-hero-kicker">
              <span className="m-kicker-line" />
              The Samaagm Summit Presents
              <span className="m-kicker-line" />
            </p>

            <h1 className="m-hero-title">
              <span className="m-hero-model">Model</span>
              <span className="m-hero-un">United<br/>Nations</span>
            </h1>

            <div className="m-hero-rule" aria-hidden />

            <div className="m-hero-dates" aria-label="Conference dates: July 31 to August 2, 2026">
              <div className="m-hero-date">
                <span className="m-hero-date-num">31</span>
                <span className="m-hero-date-month">July</span>
              </div>
              <span className="m-hero-date-sep" aria-hidden>·</span>
              <div className="m-hero-date">
                <span className="m-hero-date-num">01</span>
                <span className="m-hero-date-month">Aug</span>
              </div>
              <span className="m-hero-date-sep" aria-hidden>·</span>
              <div className="m-hero-date">
                <span className="m-hero-date-num">02</span>
                <span className="m-hero-date-month">Aug</span>
              </div>
            </div>

            <div className="m-hero-meta">
              <span className="m-hero-meta-item">
                <MapPin size={11} strokeWidth={1.5} />
                Indore, India
              </span>
              <span className="m-hero-meta-sep" aria-hidden>·</span>
              <span className="m-hero-meta-item m-hero-meta-item--venue">
                <Lock size={11} strokeWidth={1.5} />
                Venue: To Be Revealed
              </span>
            </div>

            <div className="m-hero-btns">
              <button className="h-cta h-cta--primary" onClick={() => scrollTo("committees")}>
                View Committees <ArrowRight size={14} />
              </button>
              <button className="h-cta h-cta--join" onClick={() => scrollTo("updates")}>
                <Star size={13} strokeWidth={2} />
                Stay Updated
              </button>
              <a className="h-cta h-cta--secondary" href="https://www.instagram.com/thesamaagmsummit.tss" target="_blank" rel="noopener noreferrer" aria-label="Follow on Instagram">
                <Instagram size={15} />
              </a>
            </div>
          </div>

          <div className="h-scroll-cue" onClick={() => scrollTo("what-is-mun")}>
            <span className="h-scroll-line" />
            <span className="h-scroll-label">Scroll</span>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="h-marquee-strip" aria-hidden>
          <div className="h-marquee-track">
            {["THE SAMAAGM SUMMIT", "MODEL UNITED NATIONS", "6 COMMITTEES", "INDORE · 2026", "INDIA'S FIRST DEMOCRATIC SUMMIT", "JULY 31 — AUGUST 2"].flatMap(t => [t, t, t]).map((t, i) => (
              <span key={i} className="h-marquee-item"><span className="h-marquee-dot">✦</span>{t}</span>
            ))}
          </div>
        </div>

        {/* ── WHAT IS MUN ── */}
        <section id="what-is-mun" className="h-section" aria-label="What is Model United Nations">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">The Conference</span>
              <h2 className="h-section-title">What is Model<br/>United Nations?</h2>
              <p className="h-lead">A conference where students become diplomats, negotiators, and world leaders — debating real global issues inside simulated international bodies.</p>
            </div>

            <div className="m-what-grid">
              {[
                { Icon: Globe, num: "01", head: "Diplomacy", body: "Represent nations on the world stage. Navigate international relationships, alliances, and interests with precision." },
                { Icon: Mic, num: "02", head: "Debate", body: "Engage in structured parliamentary debate, draft resolutions, deliver speeches, and defend positions under pressure." },
                { Icon: Users, num: "03", head: "Committee Simulations", body: "Every committee is a real UN body or Indian parliamentary chamber — with authentic procedures and real agendas." },
                { Icon: FileText, num: "04", head: "Resolution Drafting", body: "Collaborate across blocs to write and pass resolutions that address pressing global or national challenges." },
                { Icon: Star, num: "05", head: "Leadership", body: "Chairs, rapporteurs, and bloc leaders emerge naturally — tested under real conference conditions." },
                { Icon: Scale, num: "06", head: "Negotiation", body: "Find common ground between conflicting interests. Build coalitions. Master the art of compromise and consensus." },
              ].map((c, i) => (
                <div key={c.head} className="m-what-card h-reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
                  <div className="m-what-card-num">{c.num}</div>
                  <div className="m-what-card-icon"><c.Icon size={22} strokeWidth={1.3} /></div>
                  <h3 className="m-what-card-head">{c.head}</h3>
                  <p className="m-what-card-body">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-divider" aria-hidden><div className="h-divider-line" /><span className="h-divider-glyph">✦</span><div className="h-divider-line" /></div>

        {/* ── DEMOCRATIC PROCESS ── */}
        <section id="process" className="h-section" aria-label="India's First Democratic Summit — how the democratic process works">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">The Concept</span>
              <h2 className="h-section-title">India's First<br/>Democratic Summit.</h2>
              <p className="h-lead">Delegates don't just attend the summit — they shape it. Before the conference, the community votes to determine which agendas make it to the floor.</p>
            </div>

            <div className="m-demo-flow h-reveal">
              {[
                { num: "01", icon: <Vote size={24} strokeWidth={1.3} />, head: "Agenda Options Released", body: "Pre-curated agenda options are released to the community via Instagram." },
                { num: "02", icon: <Instagram size={24} strokeWidth={1.3} />, head: "Community Votes", body: "Participants and followers vote through interactive Instagram polls." },
                { num: "03", icon: <CheckCircle2 size={24} strokeWidth={1.3} />, head: "Votes Tallied", body: "Results are counted transparently — community preference determines the outcome." },
                { num: "04", icon: <Mic size={24} strokeWidth={1.3} />, head: "Agendas Finalized", body: "The committee agendas below reflect the choices of the delegate community." },
              ].map((s, i) => (
                <div key={s.num} className="m-demo-step" style={{ animationDelay: `${i * 0.1}s` }}>
                  {i > 0 && <div className="m-demo-arrow" aria-hidden><span /></div>}
                  <div className="m-demo-step-inner">
                    <div className="m-demo-step-num">{s.num}</div>
                    <div className="m-demo-step-icon">{s.icon}</div>
                    <h3 className="m-demo-step-head">{s.head}</h3>
                    <p className="m-demo-step-body">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="m-demo-note h-reveal">
              <div className="m-demo-note-inner">
                <span className="m-demo-note-dot" />
                <p><strong>Note on Special Committees:</strong> A select number of committees are organizer-curated and will be announced separately. These are not subject to the voting process.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="h-divider" aria-hidden><div className="h-divider-line" /><span className="h-divider-glyph">✦</span><div className="h-divider-line" /></div>

        {/* ── CONFERENCE INFO HUB ── */}
        <section className="h-section h-section--accent" aria-label="Conference Information — dates, venue, applications, and resources">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">Conference Hub</span>
              <h2 className="h-section-title">Conference<br/>Information.</h2>
            </div>

            <div className="m-info-grid">
              {[
                { Icon: Calendar, label: "Conference Dates", value: "31 July – 2 August 2026", status: "confirmed", statusLabel: "CONFIRMED" },
                { Icon: MapPin, label: "City", value: "Indore, Madhya Pradesh, India", status: "confirmed", statusLabel: "CONFIRMED" },
                { Icon: Clock, label: "Venue", value: "To Be Revealed", status: "soon", statusLabel: "REVEALING SOON" },
                { Icon: GraduationCap, label: "Delegate Applications", value: "Opening Soon", status: "soon", statusLabel: "COMING SOON" },
                { Icon: Crown, label: "Executive Board Applications", value: "Opening Soon", status: "soon", statusLabel: "COMING SOON" },
                { Icon: FileText, label: "Portfolio Guides", value: "To Be Released", status: "soon", statusLabel: "COMING SOON" },
                { Icon: BookOpen, label: "Background Guides", value: "To Be Released", status: "soon", statusLabel: "COMING SOON" },
                { Icon: Table2, label: "Committee Matrix", value: "To Be Released", status: "soon", statusLabel: "COMING SOON" },
              ].map((item, i) => (
                <div key={item.label} className={`m-info-tile h-reveal m-info-tile--${item.status}`} style={{ transitionDelay: `${i * 0.06}s` }}>
                  <div className="m-info-tile-top">
                    <item.Icon size={18} strokeWidth={1.3} className="m-info-tile-icon" />
                    <span className={`m-info-status m-info-status--${item.status}`}>
                      <span className="m-info-status-dot" />
                      {item.statusLabel}
                    </span>
                  </div>
                  <div className="m-info-tile-label">{item.label}</div>
                  <div className="m-info-tile-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-divider" aria-hidden><div className="h-divider-line" /><span className="h-divider-glyph">✦</span><div className="h-divider-line" /></div>

        {/* ── COMMITTEES — CENTERPIECE ── */}
        <section id="committees" className="h-section" aria-label="Finalized MUN Committees and Agendas">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">Finalized Committees</span>
              <h2 className="h-section-title">Six Committees.<br/>Six Arenas.</h2>
              <p className="h-lead">Each committee reflects the democratic preference of the TSS community. Below are the confirmed bodies and their selected agendas.</p>
            </div>

            <div className="m-committees-list">
              {COMMITTEES.map((c, i) => {
                const expanded = expandedCommittee === c.id;
                return (
                  <article
                    key={c.id}
                    id={`committee-${c.id}`}
                    className={`m-committee h-reveal${expanded ? " m-committee--expanded" : ""}`}
                    style={{ transitionDelay: `${i * 0.09}s` }}
                    aria-label={`${c.name} — ${c.agenda}`}
                  >
                    <div className="m-committee-ghost" aria-hidden>{c.abbr}</div>

                    <div className="m-committee-header">
                      <div className="m-committee-header-left">
                        <span className="m-committee-num">{c.num}</span>
                        <span className={`m-body-badge m-body-badge--${c.bodyType}`}>{c.body}</span>
                      </div>
                      <div className="m-committee-icon-wrap" aria-hidden>
                        {COMMITTEE_ICONS[c.id]}
                      </div>
                    </div>

                    <div className="m-committee-title-row">
                      <h3 className="m-committee-name">{c.name}</h3>
                    </div>

                    <div className="m-committee-rule" aria-hidden />

                    <div className="m-committee-agenda-section">
                      <span className="m-agenda-label">AGENDA</span>
                      <p className={`m-agenda-text${expanded ? " m-agenda-text--expanded" : ""}`}>
                        {c.agenda}
                      </p>
                      <button
                        className="m-agenda-toggle"
                        onClick={() => toggleCommittee(c.id)}
                        aria-expanded={expanded}
                        aria-controls={`agenda-${c.id}`}
                      >
                        {expanded ? (
                          <><ChevronUp size={13} strokeWidth={2} /> Collapse</>
                        ) : (
                          <><ChevronDown size={13} strokeWidth={2} /> Full Agenda</>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <div className="h-divider" aria-hidden><div className="h-divider-line" /><span className="h-divider-glyph">✦</span><div className="h-divider-line" /></div>

        {/* ── SPECIAL COMMITTEES ── */}
        <section className="h-section" aria-label="Special Committees — to be announced">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">Special Committees</span>
              <h2 className="h-section-title">Something<br/>Classified.</h2>
            </div>

            <div className="m-special-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`m-sealed h-reveal`} style={{ transitionDelay: `${i * 0.12}s` }} aria-label="Special committee — to be announced">
                  <div className="m-sealed-top" aria-hidden>
                    <div className="m-sealed-lines">
                      {[...Array(4)].map((_, j) => <div key={j} className="m-sealed-line" />)}
                    </div>
                    <div className="m-sealed-stamp">CLASSIFIED</div>
                  </div>
                  <div className="m-sealed-label">Special Committee {String(i + 1).padStart(2, "0")}</div>
                  <div className="m-sealed-status">
                    <span className="m-sealed-dot" />
                    To Be Announced
                  </div>
                </div>
              ))}
            </div>

            <div className="m-special-note h-reveal">
              <Lock size={14} strokeWidth={1.5} />
              <span>Special committees are organizer-curated. Details will be announced via <a href="https://www.instagram.com/thesamaagmsummit.tss" target="_blank" rel="noopener noreferrer" className="m-inline-link">Instagram</a>.</span>
            </div>
          </div>
        </section>

        <div className="h-divider" aria-hidden><div className="h-divider-line" /><span className="h-divider-glyph">✦</span><div className="h-divider-line" /></div>

        {/* ── WHY THESE AGENDAS ── */}
        <section className="h-section h-section--accent" aria-label="Why these agendas were selected">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">The Democratic Process</span>
              <h2 className="h-section-title">Why these<br/>agendas?</h2>
            </div>

            <div className="m-why-layout">
              <div className="m-why-body">
                <p className="h-p h-reveal">
                  Every agenda listed above was selected through a community voting process. Before the conference, TSS released carefully curated agenda options across Indian and international categories.
                </p>
                <p className="h-p h-reveal">
                  Participants, followers, and delegates voted through <strong>interactive Instagram polls</strong>. The most preferred options were finalized — reflecting genuine public interest and delegate enthusiasm.
                </p>
                <blockquote className="h-quote h-reveal">
                  <span className="h-quote-mark" aria-hidden>"</span>
                  Agendas that the room cares about — because the room chose them.
                  <span className="h-quote-mark h-quote-mark--close" aria-hidden>"</span>
                </blockquote>
              </div>

              <div className="m-why-pillars">
                {[
                  { head: "Delegate Preference", body: "Agendas were selected by the community — not imposed by organizers." },
                  { head: "Timely & Relevant", body: "Every selected agenda reflects pressing, current, real-world issues." },
                  { head: "Broad Engagement", body: "Topics span Indian domestic policy, international law, and human rights." },
                  { head: "Research-Ready", body: "Guides, matrices, and resources will be released to support all delegates." },
                ].map((p, i) => (
                  <div key={p.head} className="m-why-pillar h-reveal" style={{ transitionDelay: `${i * 0.09}s` }}>
                    <div className="m-why-pillar-num">{String(i + 1).padStart(2, "0")}</div>
                    <div>
                      <h4 className="m-why-pillar-head">{p.head}</h4>
                      <p className="m-why-pillar-body">{p.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="h-divider" aria-hidden><div className="h-divider-line" /><span className="h-divider-glyph">✦</span><div className="h-divider-line" /></div>

        {/* ── STAY UPDATED ── */}
        <section id="updates" className="m-update-section" aria-label="Stay updated — follow The Samaagm Summit on Instagram">
          <div className="m-update-bg" aria-hidden><div className="m-update-glow" /></div>
          <div className="h-wrap m-update-inner">
            <div className="h-reveal">
              <span className="h-eyebrow" style={{ color: "rgba(212,168,67,0.8)" }}>Stay in the Loop</span>
              <h2 className="m-update-title">Follow for<br/>every update.</h2>
              <p className="m-update-sub">Everything from delegate applications to special committee reveals — it drops on Instagram first.</p>

              <div className="m-update-list">
                {["Delegate Applications", "Executive Board Applications", "Portfolio Guides", "Committee Matrix", "Background Guides", "Special Committee Reveals", "Venue Announcement", "Conference Schedule"].map((item, i) => (
                  <span key={item} className="m-update-tag" style={{ animationDelay: `${i * 0.05}s` }}>
                    <span className="m-update-tag-dot" />
                    {item}
                  </span>
                ))}
              </div>

              <a href="https://www.instagram.com/thesamaagmsummit.tss" target="_blank" rel="noopener noreferrer" className="m-ig-btn">
                <Instagram size={18} strokeWidth={1.8} />
                @thesamaagmsummit.tss
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>

        <div className="h-divider" aria-hidden><div className="h-divider-line" /><span className="h-divider-glyph">✦</span><div className="h-divider-line" /></div>

        {/* ── COMING SOON INFRASTRUCTURE ── */}
        <section className="h-section" aria-label="Upcoming releases — committee documents and applications">
          <div className="h-wrap">
            <div className="h-section-header h-reveal">
              <span className="h-eyebrow">Upcoming Releases</span>
              <h2 className="h-section-title">Dropping<br/>Soon.</h2>
              <p className="h-lead">Every resource will be released here and on Instagram before the conference. Follow for release alerts.</p>
            </div>

            <div className="m-coming-grid">
              {COMING_SOON_ITEMS.map((item, i) => (
                <div key={item.label} className="m-coming-tile h-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                  <div className="m-coming-tile-icon-wrap" aria-hidden><item.Icon size={24} strokeWidth={1.2} /></div>
                  <div className="m-coming-tag" aria-label={`Type: ${item.tag}`}>{item.tag}</div>
                  <h3 className="m-coming-tile-head">{item.label}</h3>
                  <p className="m-coming-tile-body">{item.desc}</p>
                  <div className="m-coming-status">
                    <span className="m-coming-dot" />
                    <span>Coming Soon</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="h-footer" role="contentinfo">
        <div className="h-footer-marquee" aria-hidden>
          <div className="h-marquee-track h-marquee-track--slow">
            {["THE SAMAAGM SUMMIT", "MODEL UNITED NATIONS", "INDORE · 2026", "JULY 31 — AUGUST 2", "INDIA'S FIRST DEMOCRATIC SUMMIT"].flatMap(t => [t, t, t]).map((t, i) => (
              <span key={i} className="h-marquee-item"><span className="h-marquee-dot">✦</span>{t}</span>
            ))}
          </div>
        </div>
        <div className="h-wrap h-footer-inner">
          <div className="h-footer-brand">
            <span className="h-footer-tss">TSS</span>
            <span className="h-footer-name">The Samaagm Summit</span>
          </div>
          <div className="h-footer-links">
            <a href="https://www.instagram.com/thesamaagmsummit.tss" target="_blank" rel="noopener noreferrer" className="h-footer-link"><Instagram size={13} /> Instagram</a>
            <a href="mailto:thesamaagmsummit@gmail.com" className="h-footer-link">thesamaagmsummit@gmail.com</a>
            <button className="h-footer-link" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => navigate("/")}>← Back to TSS</button>
          </div>
          <p className="h-footer-copy">© 2026 The Samaagm Summit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
