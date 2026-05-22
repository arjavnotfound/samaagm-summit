import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Zap,
  Wand2,
  Trophy,
  Sparkles,
  User,
  X,
  Upload,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  ChevronDown,
  Map,
  Link,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import {
  FaInstagram as Instagram,
  FaWhatsapp as Whatsapp,
} from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxkwz04fVFCsyfOLzj-LpUVlgUs0QCbkS_M1ugA7rwMed4U4IEoh2eOInwNFc-ZyRylAw/exec";

const AB_URL =
  "https://script.google.com/macros/s/AKfycbyOWV_rrX30sGFin2kzQqWT_aVtUMqT38oCRhYVwMjN00bJzJtkNwCXUzM1gt7qtfYc1A/exec";

let _regCachedSenderUrl: string | null = null;
const _regSenderInit: Promise<void> = (async () => {
  try {
    const r = await fetch(
      `${SCRIPT_URL}?action=getSetting&key=${encodeURIComponent("Active Sender")}`,
    );
    const d = await r.json();
    _regCachedSenderUrl = d.value === "AB" ? AB_URL : SCRIPT_URL;
  } catch {
    _regCachedSenderUrl = SCRIPT_URL;
  }
})();

async function getRegActiveSenderUrl(): Promise<string> {
  if (_regCachedSenderUrl !== null) return _regCachedSenderUrl;
  await _regSenderInit;
  return _regCachedSenderUrl ?? SCRIPT_URL;
}

async function compressImageToBase64(
  file: File,
  maxWidth = 1200,
  quality = 0.8,
): Promise<{ base64: string; mimeType: string }> {
  if (file.type === "application/pdf") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(",")[1];
        resolve({ base64: b64, mimeType: "application/pdf" });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

const EVENT_DATE = new Date("2026-04-12T10:30:00.000Z"); // 4:00 PM IST
const EVENT_END = new Date("2026-04-12T14:30:00.000Z"); // 8:00 PM IST

type CountdownPhase = "countdown" | "live" | "ended";

interface FormData {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  school: string;
  grade: string;
  mun: string;
  munCount: string;
  potterhead: string;
  note: string;
  referral: string;
  paymentScreenshot: File | null;
}

interface FieldErrors {
  [key: string]: string;
}

interface CountdownState {
  phase: CountdownPhase;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  elapsedPct?: number;
  minutesLeft?: number;
}

function useCountdown(start: Date, end: Date): CountdownState {
  const calc = (): CountdownState => {
    const now = Date.now();
    const startDiff = start.getTime() - now;
    const endDiff = end.getTime() - now;
    if (startDiff > 0) {
      return {
        phase: "countdown",
        days: Math.floor(startDiff / 86400000),
        hours: Math.floor((startDiff % 86400000) / 3600000),
        minutes: Math.floor((startDiff % 3600000) / 60000),
        seconds: Math.floor((startDiff % 60000) / 1000),
      };
    }
    if (endDiff > 0) {
      const total = end.getTime() - start.getTime();
      const elapsed = now - start.getTime();
      return {
        phase: "live",
        elapsedPct: Math.min(100, Math.round((elapsed / total) * 100)),
        minutesLeft: Math.ceil(endDiff / 60000),
      };
    }
    return { phase: "ended" };
  };
  const [state, setState] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return state;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const HP_RUNES = ["✦", "✧", "⊹", "✶", "✵", "✴", "⋆", "˚", "·", "★"];

function FloatingRunes() {
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormData>({
    fname: "",
    lname: "",
    phone: "",
    email: "",
    school: "",
    grade: "",
    mun: "",
    munCount: "",
    potterhead: "",
    note: "",
    referral: "",
    paymentScreenshot: null,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [lumosMode, setLumosMode] = useState(false);
  const [lumosInteracted, setLumosInteracted] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"step2" | "submit" | null>(
    null,
  );

  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const modalPanelRef = useRef<HTMLDivElement>(null);
  const [showFloat, setShowFloat] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [closedModalOpen, setClosedModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [eventStage, setEventStage] = useState<"Auto" | "Pre-Event" | "Live" | "Post-Event">("Auto");
  const countdown = useCountdown(EVENT_DATE, EVENT_END);

  const effectivePhase: CountdownPhase =
    eventStage === "Pre-Event" ? "countdown"
    : eventStage === "Live" ? "live"
    : eventStage === "Post-Event" ? "ended"
    : countdown.phase;

  useEffect(() => {
    Promise.all([
      fetch(`${SCRIPT_URL}?action=getSetting&key=${encodeURIComponent("Registration Status")}`).then((r) => r.json()),
      fetch(`${SCRIPT_URL}?action=getSetting&key=${encodeURIComponent("Event Stage")}`).then((r) => r.json()),
    ])
      .then(([regData, stageData]) => {
        if (regData.success) {
          setRegistrationOpen(regData.value !== "closed");
        } else {
          setRegistrationOpen(true);
        }
        if (stageData.success && ["Pre-Event", "Live", "Post-Event"].includes(stageData.value)) {
          setEventStage(stageData.value as "Pre-Event" | "Live" | "Post-Event");
        } else {
          setEventStage("Auto");
        }
      })
      .catch(() => {
        setRegistrationOpen(true);
        setEventStage("Auto");
      });
  }, []);

  useEffect(() => {
    document.body.classList.toggle("lumos", lumosMode);
    return () => document.body.classList.remove("lumos");
  }, [lumosMode]);

  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;
    let rafId: number;
    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0;
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

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowFloat(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (modalPanelRef.current) {
      modalPanelRef.current.scrollTop = 0;
    }
  }, [step]);

  const openModal = () => {
    if (effectivePhase === "ended") return;
    setStep(1);
    setErrors({});
    setSubmitError("");
    setHelpOpen(false);
    setModalClosing(false);
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  };
  const closeModal = () => {
    setHelpOpen(false);
    setModalClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setModalClosing(false);
      document.body.style.overflow = "";
    }, 280);
  };
  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name])
      setErrors((errs) => {
        const n = { ...errs };
        delete n[name];
        return n;
      });
    setSubmitError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      setErrors((errs) => ({
        ...errs,
        paymentScreenshot: "File is too large — maximum size is 10 MB",
      }));
      e.target.value = "";
      return;
    }
    setForm((f) => ({ ...f, paymentScreenshot: file }));
    setUploadName(file?.name ?? "");
    if (errors.paymentScreenshot)
      setErrors((errs) => {
        const n = { ...errs };
        delete n.paymentScreenshot;
        return n;
      });
  };

  const validateStep1 = (): boolean => {
    const newErr: FieldErrors = {};
    ["fname", "lname", "phone", "email", "school", "grade"].forEach((k) => {
      if (
        !form[k as keyof FormData] ||
        !(form[k as keyof FormData] as string).trim()
      )
        newErr[k] = "This field is required";
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      newErr.email =
        "Please enter a valid email address (eg. name@example.com)";
    if (form.phone) {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15)
        newErr.phone = "Please enter a valid phone number";
    }
    if (!form.mun) newErr.mun = "Please select one";
    if (form.mun === "yes" && !form.munCount)
      newErr.munCount = "This field is required";
    if (!form.referral || !form.referral.trim())
      newErr.referral = "Please tell us how you heard about us";
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErr: FieldErrors = {};
    if (!form.paymentScreenshot)
      newErr.paymentScreenshot = "Please upload your payment screenshot";
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleNextWithConfirm = () => {
    if (step === 1 && validateStep1()) setConfirmType("step2");
  };

  const handleSubmitWithConfirm = useCallback(() => {
    if (validateStep2()) setConfirmType("submit");
  }, [form]);

  const actualSubmit = useCallback(async () => {
    setLoading(true);
    setSubmitError("");
    try {
      let screenshotBase64 = "";
      let screenshotMimeType = "";
      let screenshotFileName = "";
      if (form.paymentScreenshot) {
        const compressed = await compressImageToBase64(form.paymentScreenshot);
        screenshotBase64 = compressed.base64;
        screenshotMimeType = compressed.mimeType;
        screenshotFileName = `payment_${form.fname.trim()}_${form.lname.trim()}_${Date.now()}`;
      }
      const payload = {
        firstName: form.fname.trim(),
        lastName: form.lname.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        school: form.school.trim(),
        grade: form.grade.trim(),
        munExp: form.mun,
        munCount: form.munCount || "—",
        potterhead: form.potterhead || "—",
        note: form.note.trim() || "—",
        referral: form.referral.trim() || "—",
        timestamp: new Date().toISOString(),
        screenshotBase64,
        screenshotMimeType,
        screenshotFileName,
      };
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      let result: {
        success?: boolean;
        duplicate?: boolean;
        message?: string;
        error?: string;
      } | null = null;
      try {
        result = await res.json();
      } catch {
        /* JSON parse failed — HTTP was 200, treat as success */
      }
      if (result) {
        if (result.duplicate) {
          setSubmitError(
            result.message ||
              "You're already registered. Each person can only register once.",
          );
          return;
        }
        if (result.success === false) {
          throw new Error(
            result.error || "Registration failed. Please try again.",
          );
        }
      }

      const senderUrl = await getRegActiveSenderUrl();
      await fetch(senderUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action:    "sendEmail",
          emailType: "confirmation",
          firstName: form.fname.trim(),
          lastName:  form.lname.trim(),
          email:     form.email.trim().toLowerCase(),
        }),
      });

      setStep(3);
    } catch {
      setSubmitError(
        "Something went wrong. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [form]);

  const handleConfirmProceed = useCallback(async () => {
    const type = confirmType;
    setConfirmType(null);
    if (type === "step2") setStep(2);
    else if (type === "submit") await actualSubmit();
  }, [confirmType, actualSubmit]);

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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
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
                    onClick={() => { setLumosMode((m) => !m); setLumosInteracted(true); }}
                    title={lumosMode ? "Nox — return to darkness" : "Lumos — let there be light"}
                    aria-label={lumosMode ? "Nox" : "Lumos"}
                  >
                    <span className="lumos-wand-wrap">
                      <Wand2 size={15} strokeWidth={2} />
                      {lumosMode && <span className="lumos-spark" />}
                    </span>
                    <span className="lumos-label">{lumosMode ? "Nox" : "Lumos"}</span>
                  </button>
                  {!lumosInteracted && <span className="lumos-hint">toggle light</span>}
                </div>
              </div>
            </div>
          </header>

          {/* ── HERO ── */}
          <section className={`hero${effectivePhase === "ended" ? " hero--photo" : ""}`} ref={heroRef}>
            {effectivePhase === "ended" && (
              <div className="hero-photo-bg" aria-hidden>
                <img src="/p934-night.jpg" alt="" />
              </div>
            )}
            <FloatingRunes />

            <div className="hero-summit" style={{ animationDelay: "0.1s" }}>
              THE &nbsp;<em>SAMAAGM</em>&nbsp; SUMMIT
            </div>
            <div className="hero-presents">
              {effectivePhase === "ended" ? "PRESENTED" : "PRESENTS"}
            </div>

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

            {effectivePhase === "ended" && (
              <div className="hero-ended-badge">
                <span className="hero-ended-dot" />
                <span>Mischief Managed · 350+ Registered · April 12, 2026</span>
              </div>
            )}

            <div className="hero-rule" />
            <h1 className="hero-tagline">
              {effectivePhase === "ended"
                ? "An evening of Harry Potter–themed magic, music, and memories that Indore won't forget."
                : "An immersive Harry Potter–themed social experience where magic meets music."}
            </h1>
            <div className="hero-pills">
              <span className="hero-pill">Rave</span>
              <span className="hero-pill">HP Challenges</span>
              <span className="hero-pill">Prizes</span>
              <span className="hero-pill">Surprises</span>
              {effectivePhase === "ended" ? (
                <span className="hero-pill hero-pill-ended">✦ Event Concluded</span>
              ) : (
                <span className="hero-pill hero-pill-price">₹99 Entry</span>
              )}
            </div>

            <div className="scroll-hint">
              <span className="scroll-hint-text">
                {effectivePhase === "ended" ? "Relive" : "Descend"}
              </span>
              <div className="scroll-hint-line" />
              <ChevronDown size={16} className="scroll-hint-arrow" strokeWidth={1.5} />
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

          {/* ── COUNTDOWN ── */}
          <section className="countdown-section reveal">
            {effectivePhase === "countdown" && (
              <>
                <div className="countdown-label">
                  Time until the platform opens
                </div>
                <div className="countdown-grid">
                  {[
                    { val: countdown.days!, unit: "Days" },
                    { val: countdown.hours!, unit: "Hours" },
                    { val: countdown.minutes!, unit: "Minutes" },
                    { val: countdown.seconds!, unit: "Seconds" },
                  ].map((item, i) => (
                    <div key={item.unit} style={{ display: "contents" }}>
                      {i > 0 && <div className="cdt-sep">:</div>}
                      <div className="cdt-block">
                        <div className="cdt-num">{pad(item.val)}</div>
                        <div className="cdt-unit">{item.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="countdown-sub">
                  12 April 2026 · 4:00 PM – 8:00 PM · IST
                </div>
              </>
            )}
            {effectivePhase === "live" && (
              <div className="cdt-live-wrap">
                {/* Orbital rune ring — spins as a whole; each rune counter-rotates to stay upright */}
                <div className="cdt-orbit-shell" aria-hidden>
                  <div className="cdt-orbit-ring">
                    {["✦","⊹","✧","★","⋆","·","✵","✶"].map((r, i) => {
                      const angleDeg = i * 45;
                      return (
                        <span
                          key={i}
                          className="cdt-orbit-rune"
                          style={{
                            transform: `rotate(${angleDeg}deg) translateX(58px) rotate(-${angleDeg}deg)`,
                          }}
                        >
                          {r}
                        </span>
                      );
                    })}
                  </div>
                  <div className="cdt-orbit-center">
                    <span className="cdt-orbit-live-dot" />
                    <span className="cdt-orbit-live-label">LIVE</span>
                  </div>
                </div>

                {/* Title */}
                <div className="cdt-live-title">The Platform is Open</div>
                <div className="cdt-live-sub">
                  Platform 9¾ is happening right now — the magic is real tonight.
                </div>

                {/* Progress bar */}
                <div className="cdt-live-progress-wrap">
                  <div className="cdt-live-progress-track">
                    <div
                      className="cdt-live-progress-bar"
                      style={{ width: `${countdown.elapsedPct ?? 0}%` }}
                    />
                  </div>
                  <div className="cdt-live-progress-labels">
                    <span>4:00 PM</span>
                    <span className="cdt-live-progress-pct">
                      {countdown.minutesLeft} min left
                    </span>
                    <span>8:00 PM</span>
                  </div>
                </div>

                {/* Walk-in note */}
                <div className="cdt-live-walkin">
                  ✦ Walk-in entries welcome · Pay at the gate
                </div>
              </div>
            )}
            {effectivePhase === "ended" && (
              <div className="cdt-ended-wrap">
                {/* Fading rune constellation */}
                <div className="cdt-ended-constellation" aria-hidden>
                  {["✦","·","⊹","·","★","·","✧","·","✶"].map((r, i) => (
                    <span
                      key={i}
                      className="cdt-ended-star"
                      style={{
                        "--star-i": i,
                        left: `${8 + i * 10}%`,
                        top: `${20 + ((i * 17) % 60)}%`,
                      } as React.CSSProperties}
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <div className="cdt-ended-stamp">
                  <span>✦</span>
                  <span className="cdt-ended-stamp-text">Mischief Managed</span>
                  <span>✦</span>
                </div>
                <div className="cdt-ended-title">The Night Was Magic</div>
                <div className="cdt-ended-sub">
                  Platform 9¾ has closed its gates. Thank you for being part of something unforgettable — the magic lives on.
                </div>
                <div className="cdt-ended-meta">
                  <span className="cdt-ended-meta-item">Platform 9¾ · TSS</span>
                  <span className="cdt-ended-meta-sep">·</span>
                  <span className="cdt-ended-meta-item">12 April 2026</span>
                  <span className="cdt-ended-meta-sep">·</span>
                  <span className="cdt-ended-meta-item">Underdoggs, High Street Apollo, Indore</span>
                </div>
              </div>
            )}
          </section>

          {/* ── EVENT DETAILS + POLICY (pre-event only) ── */}
          {effectivePhase !== "ended" && (<>
          <section className="details-section reveal">
            <span className="section-eyebrow">The Event</span>
            <h2 className="section-title">
              What <span className="accent">awaits</span> you
            </h2>
            <p className="section-sub" style={{ marginBottom: "40px" }}>
              An exclusive underground experience. The details are known only to
              those who hold a ticket.
            </p>

            <div className="info-cards-row">
              {/* VENUE CARD — clickable dropdown */}
              <div
                className={`info-card reveal-item venue-card venue-card-featured${venueOpen ? " venue-open" : ""}`}
                style={{ "--delay": "0s" } as React.CSSProperties}
                onClick={() => setVenueOpen((v) => !v)}
                role="button"
                aria-expanded={venueOpen}
              >
                <MapPin
                  className="info-card-icon"
                  size={22}
                  strokeWidth={1.5}
                />
                <span className="info-card-label">Venue</span>
                <div className="venue-card-title-row">
                  <div className="info-card-value">Underdoggs</div>
                  <ChevronDown
                    size={16}
                    className={`venue-chevron${venueOpen ? " open" : ""}`}
                  />
                </div>
                <div className="info-card-sub">High Street Apollo, Indore</div>
                {venueOpen && (
                  <div
                    className="venue-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="venue-dropdown-addr">
                      Underdoggs, High Street Apollo, Indore, MP
                    </div>
                    <div className="venue-dropdown-btns">
                      <a
                        href="https://maps.app.goo.gl/WpKN9bmhqDdKUZea8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="venue-btn venue-btn-maps"
                      >
                        <Map size={14} /> Google Maps
                      </a>
                      <a
                        href="https://www.instagram.com/underdoggs.indore/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="venue-btn venue-btn-ig"
                      >
                        <Instagram size={14} /> Instagram
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="info-card reveal-item"
                style={{ "--delay": "0.1s" } as React.CSSProperties}
              >
                <Calendar
                  className="info-card-icon"
                  size={22}
                  strokeWidth={1.5}
                />
                <span className="info-card-label">Date</span>
                <div className="info-card-value">12 April 2026</div>
                <div className="info-card-sub">
                  Mark your calendar. One night only.
                </div>
              </div>
              <div
                className="info-card reveal-item"
                style={{ "--delay": "0.2s" } as React.CSSProperties}
              >
                <Clock className="info-card-icon" size={22} strokeWidth={1.5} />
                <span className="info-card-label">Time</span>
                <div className="info-card-value">4:00 PM – 8:00 PM</div>
                <div className="info-card-sub">
                  Four hours. Infinite memories.
                </div>
              </div>
            </div>

            <div className="exp-header reveal">
              <span className="section-eyebrow">On the floor</span>
              <h2 className="section-title">
                What's <span className="accent">happening</span>
              </h2>
            </div>
            <div className="exp-grid">
              {[
                {
                  icon: <Zap size={22} strokeWidth={1.5} />,
                  title: "The Rave",
                  desc: "Live DJ. Bass you'll feel in your chest. A proper dance floor that goes all night.",
                  hp: "Wingardium Leviosa",
                },
                {
                  icon: <Wand2 size={22} strokeWidth={1.5} />,
                  title: "HP Challenges",
                  desc: "Duels, trivia, house tasks. Prove you belong.",
                  hp: "Expecto Patronum",
                },
                {
                  icon: <Trophy size={22} strokeWidth={1.5} />,
                  title: "Prizes",
                  desc: "Win exclusive collectibles & merch. The best houses take the spoils.",
                  hp: "Accio Rewards",
                },
                {
                  icon: <Sparkles size={22} strokeWidth={1.5} />,
                  title: "Surprises",
                  desc: "Things we won't announce. You'll know when you're there.",
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

          {/* ── VENUE POLICY ── */}
          <section className="policy-section reveal">
            <div className="policy-card">
              <div className="policy-header">
                <span className="policy-icon">⚠</span>
                <span className="policy-eyebrow">Venue Policy — Strictly Enforced</span>
              </div>
              <h2 className="policy-title">Rules of the Platform</h2>
              <div className="policy-divider" />
              <div className="policy-body">
                <p className="policy-rule">
                  <span className="policy-rule-mark">✦</span>
                  No alcohol, liquor, vapes, smoking pipes, cigars, cigarettes, tobacco, drugs, or any
                  prohibitory substances are permitted on the premises. Any attendee found in possession
                  of such substances will be <strong>fined and removed from the venue immediately</strong> —
                  without exception.
                </p>
                <p className="policy-rule policy-rule--food">
                  <span className="policy-rule-mark policy-rule-mark--gold">✦</span>
                  Food and non-alcoholic beverages are available at the venue for all attendees.
                </p>
              </div>
              <div className="policy-footer-line">
                By entering Platform 9¾, you acknowledge and agree to abide by all venue policies.
              </div>
            </div>
          </section>
          </>)}

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

      {/* ── CLOSED REGISTRATION BANNER ── */}
      {registrationOpen === false && !bannerDismissed && effectivePhase !== "ended" && (
        <div className="reg-closed-banner">
          <span className="reg-closed-banner-icon">🔒</span>
          <span>
            Online registration is now <strong>closed</strong>. Walk-in entry is available at the venue — payment on the spot.
          </span>
          <button
            className="reg-closed-banner-btn"
            onClick={() => setClosedModalOpen(true)}
          >
            Learn more
          </button>
          <button
            className="reg-closed-banner-close"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── FLOATING REGISTER BUTTON ── */}
      <button
        className={`float-register${showFloat && registrationOpen !== null && effectivePhase !== "ended" ? " float-visible" : ""}${registrationOpen === false ? " float-register--closed" : ""}`}
        onClick={() => {
          if (registrationOpen === false) {
            setClosedModalOpen(true);
          } else {
            openModal();
          }
        }}
      >
        <Zap size={18} strokeWidth={2} />
        {registrationOpen === false ? "Walk-in Info" : "Register Now"}
        <ChevronRight size={16} strokeWidth={2} />
      </button>

      {/* ── CLOSED REGISTRATION MODAL ── */}
      {closedModalOpen && (
        <div
          className="closed-modal-overlay"
          onClick={() => setClosedModalOpen(false)}
        >
          <div
            className="closed-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="closed-modal-close"
              onClick={() => setClosedModalOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="closed-modal-icon">🔒</div>
            <h2 className="closed-modal-title">Registration Closed</h2>
            <p className="closed-modal-body">
              Online registration for <strong>Platform 9¾ — The Samaagm Summit</strong> has now closed.
            </p>

            <div className="closed-modal-section">
              <div className="closed-modal-section-title">Walk-in Entry</div>
              <p className="closed-modal-section-body">
                You can still attend by walking in directly at the venue. Entry is open — simply arrive, register at the gate, and pay on the spot.
              </p>
            </div>

            <div className="closed-modal-section">
              <div className="closed-modal-section-title">Payment</div>
              <p className="closed-modal-section-body">
                Payment is accepted at the venue on the day of the event. Please carry cash or UPI.
              </p>
            </div>

            <div className="closed-modal-section">
              <div className="closed-modal-section-title">Venue</div>
              <p className="closed-modal-section-body">
                Underdoggs, High Street Apollo, Indore — 12 April 2026, 4:00 PM onwards.
              </p>
            </div>

            <div className="closed-modal-section">
              <div className="closed-modal-section-title">Contact</div>
              <p className="closed-modal-section-body">
                Questions? Reach us at{" "}
                <a
                  href="mailto:thesamaagmsummit@gmail.com"
                  className="closed-modal-link"
                >
                  thesamaagmsummit@gmail.com
                </a>{" "}
                or on WhatsApp.
              </p>
            </div>

            <button
              className="closed-modal-dismiss"
              onClick={() => setClosedModalOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION POPUP ── */}
      {confirmType && (
        <div className="confirm-overlay" onClick={() => setConfirmType(null)}>
          <div className="confirm-panel" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">✦</div>
            {confirmType === "step2" ? (
              <>
                <div className="confirm-title">Just to confirm</div>
                <p className="confirm-body">
                  You'll receive your ticket on this email once your payment is
                  reviewed.
                </p>
                <div className="confirm-detail-row">
                  <span className="confirm-detail-label">Email</span>
                  <span className="confirm-detail-val">{form.email}</span>
                </div>
                <div className="confirm-detail-row">
                  <span className="confirm-detail-label">Phone</span>
                  <span className="confirm-detail-val">{form.phone}</span>
                </div>
                <p className="confirm-note">
                  Make sure your inbox isn't full and can receive emails — your
                  ticket will be sent there after review.
                </p>
                <div className="confirm-actions">
                  <button
                    className="confirm-btn-back"
                    onClick={() => setConfirmType(null)}
                  >
                    ← Edit details
                  </button>
                  <button
                    className="confirm-btn-go"
                    onClick={handleConfirmProceed}
                  >
                    Yes, continue →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="confirm-title">Ready to submit?</div>
                <p className="confirm-body">
                  This will complete your registration for Platform 9¾ TSS.
                </p>
                <div className="confirm-detail-row">
                  <span className="confirm-detail-label">Email</span>
                  <span className="confirm-detail-val">{form.email}</span>
                </div>
                <div className="confirm-detail-row">
                  <span className="confirm-detail-label">Phone</span>
                  <span className="confirm-detail-val">{form.phone}</span>
                </div>
                <p className="confirm-note">
                  Your ticket will be sent to the email above once payment is
                  verified. Please ensure it can receive emails.
                </p>
                <div className="confirm-actions">
                  <button
                    className="confirm-btn-back"
                    onClick={() => setConfirmType(null)}
                  >
                    ← Go back
                  </button>
                  <button
                    className="confirm-btn-go"
                    onClick={handleConfirmProceed}
                  >
                    Confirm &amp; submit →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {modalOpen && (
        <div
          className={`modal-overlay${modalClosing ? " closing" : ""}`}
          onClick={onOverlayClick}
        >
          <div
            className={`modal-panel${modalClosing ? " closing" : ""}`}
            ref={modalPanelRef}
          >
            <div className="modal-top-bar">
              <div className="modal-top-row">
                <div className="modal-title">Platform 9¾ TSS</div>
                <div className="modal-top-actions">
                  <button
                    className={`modal-help-btn${helpOpen ? " active" : ""}`}
                    onClick={() => setHelpOpen((v) => !v)}
                    aria-label="Help and contact info"
                  >
                    <HelpCircle size={13} />
                    <span>Help</span>
                  </button>
                  <button
                    className="modal-close"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {step !== 3 && (
                <div className="step-bar">
                  <div
                    className={`step-item ${step === 1 ? "active" : "done"}`}
                  >
                    <div className="step-num">
                      {step > 1 ? <CheckCircle2 size={12} /> : "1"}
                    </div>
                    <span>Details</span>
                  </div>
                  <div className={`step-connector ${step > 1 ? "done" : ""}`} />
                  <div
                    className={`step-item ${step === 2 ? "active" : step > 2 ? "done" : ""}`}
                  >
                    <div className="step-num">
                      {step > 2 ? <CheckCircle2 size={12} /> : "2"}
                    </div>
                    <span>Payment</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-body">
              {helpOpen ? (
                <HelpPanel onBack={() => setHelpOpen(false)} />
              ) : (
                <>
                  {step === 1 && (
                    <StepOne
                      form={form}
                      errors={errors}
                      onChange={handleChange}
                      onNext={handleNextWithConfirm}
                    />
                  )}
                  {step === 2 && (
                    <StepTwo
                      form={form}
                      errors={errors}
                      uploadName={uploadName}
                      loading={loading}
                      submitError={submitError}
                      onFileChange={handleFileChange}
                      onBack={() => setStep(1)}
                      onSubmit={handleSubmitWithConfirm}
                    />
                  )}
                  {step === 3 && (
                    <SuccessStep name={form.fname} onClose={closeModal} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ────────────────────────── STEP 1 ────────────────────────── */
function StepOne({
  form,
  errors,
  onChange,
  onNext,
}: {
  form: FormData;
  errors: FieldErrors;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="fname">
            First Name <span className="req">*</span>
          </label>
          <input
            type="text"
            id="fname"
            name="fname"
            className={`form-control${errors.fname ? " error" : ""}`}
            placeholder="eg. Harry"
            value={form.fname}
            onChange={onChange}
          />
          {errors.fname && <span className="error-hint">{errors.fname}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="lname">
            Last Name <span className="req">*</span>
          </label>
          <input
            type="text"
            id="lname"
            name="lname"
            className={`form-control${errors.lname ? " error" : ""}`}
            placeholder="eg. Potter"
            value={form.lname}
            onChange={onChange}
          />
          {errors.lname && <span className="error-hint">{errors.lname}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="phone">
          Phone Number <span className="req">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className={`form-control${errors.phone ? " error" : ""}`}
          placeholder="eg. +91 98765 43210"
          value={form.phone}
          onChange={onChange}
        />
        {errors.phone && <span className="error-hint">{errors.phone}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Email Address <span className="req">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-control${errors.email ? " error" : ""}`}
          placeholder="eg. harry@hogwarts.edu"
          value={form.email}
          onChange={onChange}
        />
        {errors.email && <span className="error-hint">{errors.email}</span>}
      </div>

      <div className="form-sep" />

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="school">
            School / College <span className="req">*</span>
          </label>
          <input
            type="text"
            id="school"
            name="school"
            className={`form-control${errors.school ? " error" : ""}`}
            placeholder="eg. Hogwarts School"
            value={form.school}
            onChange={onChange}
          />
          {errors.school && <span className="error-hint">{errors.school}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="grade">
            Grade / Year <span className="req">*</span>
          </label>
          <input
            type="text"
            id="grade"
            name="grade"
            className={`form-control${errors.grade ? " error" : ""}`}
            placeholder="eg. 11th Grade"
            value={form.grade}
            onChange={onChange}
          />
          {errors.grade && <span className="error-hint">{errors.grade}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Quick question — are you relevant to MUNs?{" "}
          <span className="req">*</span>
        </label>
        <div className={`radio-stack${errors.mun ? " error" : ""}`}>
          {[
            { val: "yes", label: "Yes, I've attended MUNs" },
            { val: "heard", label: "I've heard of it" },
          ].map((opt) => (
            <label
              key={opt.val}
              className={`radio-opt${form.mun === opt.val ? " selected" : ""}`}
            >
              <input
                type="radio"
                name="mun"
                value={opt.val}
                className="radio-dot"
                checked={form.mun === opt.val}
                onChange={onChange}
              />
              <span className="radio-text">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.mun && <span className="error-hint">{errors.mun}</span>}
      </div>

      {form.mun === "yes" && (
        <div className="form-group slide-down-enter">
          <label className="form-label" htmlFor="munCount">
            How many MUNs attended? <span className="req">*</span>
          </label>
          <select
            id="munCount"
            name="munCount"
            className={`form-control${errors.munCount ? " error" : ""}`}
            value={form.munCount}
            onChange={onChange}
          >
            <option value="" disabled>
              Select a range
            </option>
            <option value="1–2">1 – 2</option>
            <option value="3–5">3 – 5</option>
            <option value="6–10">6 – 10</option>
            <option value="10+">10+</option>
          </select>
          {errors.munCount && (
            <span className="error-hint">{errors.munCount}</span>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">
          Are you a Potterhead?{" "}
          <span style={{ color: "var(--text-4)", fontStyle: "italic" }}>
            (optional)
          </span>
        </label>
        <div className="radio-stack">
          {[
            {
              val: "potterhead-rave",
              label: "Potterhead — and hyped for the rave",
            },
            { val: "rave-only", label: "Not really, just here for the rave" },
            {
              val: "potterhead-hp",
              label: "Potterhead — mainly for the HP activities",
            },
            { val: "friends", label: "Just hanging out with friends" },
          ].map((opt) => (
            <label
              key={opt.val}
              className={`radio-opt${form.potterhead === opt.val ? " selected" : ""}`}
            >
              <input
                type="radio"
                name="potterhead"
                value={opt.val}
                className="radio-dot"
                checked={form.potterhead === opt.val}
                onChange={onChange}
              />
              <span className="radio-text">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="note">
          Anything else?{" "}
          <span style={{ color: "var(--text-4)", fontStyle: "italic" }}>
            (optional)
          </span>
        </label>
        <textarea
          id="note"
          name="note"
          className="form-control"
          placeholder="eg. Dietary needs, questions, or a spell you'd like to cast..."
          value={form.note}
          onChange={onChange}
        />
      </div>

      <div className="referral-field-wrap">
        <div className="referral-badge">✦ Referred by a team member?</div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="referral">
            Enter their name, or tell us how you heard about Platform 9¾{" "}
            <span className="req">*</span>
          </label>
          <input
            type="text"
            id="referral"
            name="referral"
            className={`form-control${errors.referral ? " error" : ""}`}
            placeholder="A team member's name counts toward their referral — or just tell us how you found us"
            value={form.referral}
            onChange={onChange}
          />
          {errors.referral && (
            <span className="error-hint">{errors.referral}</span>
          )}
        </div>
      </div>

      <button className="btn-next" onClick={onNext}>
        Continue to Payment <ChevronRight size={16} style={{ marginLeft: 6 }} />
      </button>
    </div>
  );
}

/* ────────────────────────── STEP 2 ────────────────────────── */
function StepTwo({
  form,
  errors,
  uploadName,
  loading,
  submitError,
  onFileChange,
  onBack,
  onSubmit,
}: {
  form: FormData;
  errors: FieldErrors;
  uploadName: string;
  loading: boolean;
  submitError: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [payMethod, setPayMethod] = useState<"qr" | "link">("qr");
  const [copied, setCopied] = useState(false);

  const upiLink = `upi://pay?pa=9713642449@pthdfc&am=99&tn=${form.fname.trim() || "First"}_${form.lname.trim() || "Last"}&cu=INR`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="payment-amount-card">
        <div className="payment-amount">
          <span>₹</span>99
        </div>
        <div className="payment-amount-sub">
          per person · one-time entry fee
        </div>
      </div>

      {/* Prominent account holder banner */}
      <div className="pay-holder-banner">
        <span className="pay-holder-label">Pay to</span>
        <span className="pay-holder-name">Pinky Soni</span>
        <div className="pay-holder-details">
          <span>UPI: 9713642449@pthdfc</span>
          <span className="pay-holder-sep">·</span>
          <span>₹99</span>
        </div>
      </div>

      <div style={{ marginBottom: 10, marginTop: 20 }}>
        <span className="section-eyebrow">Choose how to pay</span>
      </div>

      <div className="pay-method-tabs">
        <button
          className={`pay-method-tab${payMethod === "qr" ? " active" : ""}`}
          onClick={() => setPayMethod("qr")}
          type="button"
        >
          <QrCode size={14} />
          QR Code
        </button>
        <button
          className={`pay-method-tab${payMethod === "link" ? " active" : ""}`}
          onClick={() => setPayMethod("link")}
          type="button"
        >
          <Link size={14} />
          Payment Link
        </button>
      </div>

      <div className="pay-method-content">
        {payMethod === "qr" && (
          <div className="pay-qr-box">
            <p className="pay-method-desc">
              Scan with any UPI app — your name is embedded so we can match the
              payment.
            </p>
            <div className="pay-qr-wrap">
              <QRCodeSVG
                value={upiLink}
                size={180}
                bgColor="#ffffff"
                fgColor="#111111"
                level="M"
              />
            </div>
            <p className="pay-method-note">
              After scanning and paying, take a screenshot and upload it below.
            </p>
          </div>
        )}
        {payMethod === "link" && (
          <div className="pay-link-box">
            <p className="pay-method-desc">
              Open your UPI app directly — your name is embedded in the link.
            </p>
            <a href={upiLink} className="pay-link-btn">
              Pay ₹99 via UPI
            </a>
            <button
              type="button"
              className="pay-copy-btn"
              onClick={handleCopyLink}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <p className="pay-method-note">
              After paying, take a screenshot and upload it below.
            </p>
          </div>
        )}
      </div>

      <div className="payment-notice">
        <div className="payment-notice-text">
          Please send exactly <strong>₹99</strong> and take a screenshot of the
          successful payment. Upload it below to confirm your registration.
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Payment Screenshot <span className="req">*</span>
        </label>
        <label className={`upload-area${uploadName ? " has-file" : ""}`}>
          <input type="file" accept="image/*,.pdf" onChange={onFileChange} />
          <Upload className="upload-icon" size={28} strokeWidth={1.5} />
          <div className="upload-text">
            {uploadName || "Tap to upload your screenshot"}
          </div>
          <span className="upload-hint">
            {uploadName ? "Tap to change" : "JPG, PNG, PDF accepted"}
          </span>
        </label>
        {errors.paymentScreenshot && (
          <span className="error-hint">{errors.paymentScreenshot}</span>
        )}
      </div>

      {submitError && <div className="form-error-bar">{submitError}</div>}

      <div className="form-actions">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <button className="btn-next" onClick={onSubmit} disabled={loading}>
          <CreditCard size={16} style={{ marginRight: 8 }} />
          {loading ? "Submitting..." : "Confirm Registration"}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────── HELP PANEL ────────────────────────── */
function HelpPanel({ onBack }: { onBack: () => void }) {
  return (
    <div className="help-panel">
      <button className="help-panel-back" onClick={onBack}>
        ← Back to registration
      </button>
      <div>
        <div className="help-panel-title">Need help?</div>
        <div className="help-panel-sub">
          Reach us before or after the event.
        </div>
      </div>
      <div className="help-contact-grid">
        <div className="help-contact-card">
          <div className="help-contact-name">Somya Khandare</div>
          <div className="help-contact-role">CEO · The Samaagm Summit</div>
          <a href="tel:+918962092386" className="help-contact-phone">
            📞 +91 89620 92386
          </a>
          <a
            href="https://wa.me/918962092386"
            target="_blank"
            rel="noopener noreferrer"
            className="help-contact-whatsapp"
          >
            <Whatsapp size={13} /> WhatsApp
          </a>
        </div>
        <div className="help-contact-card">
          <div className="help-contact-name">Arjav Badjatya</div>
          <div className="help-contact-role">CMO · The Samaagm Summit</div>
          <a href="tel:+919406861126" className="help-contact-phone">
            📞 +91 94068 61126
          </a>
          <a
            href="https://wa.me/919406861126"
            target="_blank"
            rel="noopener noreferrer"
            className="help-contact-whatsapp"
          >
            <Whatsapp size={13} /> WhatsApp
          </a>
        </div>
      </div>
      <div className="help-divider" />
      <div className="help-social-links">
        <a
          href="https://www.instagram.com/thesamaagmsummit.tss"
          target="_blank"
          rel="noopener noreferrer"
          className="help-social-link"
        >
          <Instagram size={15} /> @thesamaagmsummit.tss
        </a>
        <a
          href="mailto:thesamaagmsummit@gmail.com"
          className="help-social-link"
        >
          <span style={{ fontSize: 15 }}>✉</span> thesamaagmsummit@gmail.com
        </a>
      </div>
      <p className="help-panel-note">
        We typically respond within a few hours.
      </p>
    </div>
  );
}

/* ────────────────────────── STEP 3 / SUCCESS ────────────────────────── */
function SuccessStep({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="success-panel">
      <div className="success-wand-wrap">
        <Wand2 className="success-wand" size={40} strokeWidth={1} />
        <span className="success-spark-1">✦</span>
        <span className="success-spark-2">✧</span>
        <span className="success-spark-3">⊹</span>
      </div>

      <div className="success-title">
        {name ? `Almost there, ${name}!` : "Almost there!"}
      </div>
      <p className="success-subtitle">
        Your registration is submitted — sit tight while we review your payment.
      </p>

      <div className="ticket-stub">
        <div className="ticket-stub-main">
          <div className="ticket-stub-admit">
            Platform 9¾ · The Samaagm Summit
          </div>
          <div className="ticket-stub-event">Registration</div>
          <div className="ticket-stub-org">Submitted for review</div>
          <div className="ticket-stub-details">
            <div className="ticket-detail-row">
              <Calendar size={13} />
              <span>12 April 2026</span>
            </div>
            <div className="ticket-detail-row">
              <Clock size={13} />
              <span>4:00 PM – 8:00 PM IST</span>
            </div>
            <div className="ticket-detail-row">
              <MapPin size={13} />
              <span>Underdoggs, Indore</span>
            </div>
          </div>
        </div>
        <div className="ticket-perforation" aria-hidden />
        <div className="ticket-stub-bottom">
          <div className="ticket-stub-status">
            <span className="ticket-status-dot" />
            Pending Review
          </div>
          <p className="ticket-stub-note">
            Payment under review — your official ticket lands in your inbox
            within <strong>24 hours</strong>.
          </p>
        </div>
      </div>

      <p className="success-quote">"The train departs. Be ready." ✦</p>

      <div className="success-help-row">
        <span className="success-help-label">Need help?</span>
        <div className="success-help-links">
          <a
            href="https://www.instagram.com/thesamaagmsummit.tss"
            target="_blank"
            rel="noopener noreferrer"
            className="success-help-link"
          >
            <Instagram size={13} /> @thesamaagmsummit.tss
          </a>
          <a
            href="mailto:thesamaagmsummit@gmail.com"
            className="success-help-link"
          >
            ✉ thesamaagmsummit@gmail.com
          </a>
        </div>
      </div>

      <button className="success-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
