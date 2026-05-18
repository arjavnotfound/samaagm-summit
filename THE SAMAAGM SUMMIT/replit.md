# The Samaagm Summit (TSS)

React + Vite + TypeScript landing site for TSS — India's first democratic youth summit, featuring the Harry Potter-themed "Platform 9¾" social event.

## Tech Stack
- **Framework:** React 18 + Vite 5 + TypeScript
- **Routing:** Wouter
- **Styling:** Vanilla CSS (all in `src/index.css`) — no Tailwind used for the `h-` (Home) or `hp-` (Register) namespaces; Tailwind v4 is imported but only used for DevPanel utility classes
- **Icons:** Lucide React, React Icons
- **Fonts:** Cinzel, Cinzel Decorative, Lora, DM Mono, Cormorant Garant, Space Grotesk (all via Google Fonts)
- **Backend:** Google Apps Script (GAS) — `google-apps-script.gs`
- **Package manager:** npm (pnpm not installed; use `npm run dev`)
- **Dev server:** PORT 5000, workflow: `cd 'THE SAMAAGM SUMMIT' && PORT=5000 BASE_PATH=/ npm run dev`

## Project Structure
```
THE SAMAAGM SUMMIT/
├── src/
│   ├── pages/
│   │   ├── Home.tsx          — Homepage (803 lines) + DevMode easter egg
│   │   └── Register.tsx      — Registration form (Platform 9¾)
│   ├── components/
│   │   └── DevPanel.tsx      — Internal admin registration panel
│   ├── lib/
│   │   └── devApi.ts         — GAS API client (two-step: sheet op → email send)
│   └── index.css             — All site styles (~5950 lines)
│                               h-* = Home page classes (lines ~3340–4740)
│                               hp-* = Register page classes
│                               devpw-* / devp-* = DevPanel classes
│                               lumos body.lumos = light mode overrides
├── google-apps-script.gs     — TSS GAS backend (sheet ops; paste into Apps Script, TSS account)
├── AB.gs                     — Independent email sender (deploy from arjavbadjatya1026@gmail.com)
├── vite.config.ts            — Requires PORT and BASE_PATH env vars
└── package.json
```

## CSS Namespace Guide
| Prefix | Purpose | Location in index.css |
|--------|---------|----------------------|
| `h-`   | Home page | ~lines 3340–4509 |
| `hp-`  | Register page | after h- section |
| `devpw-` | Dev password overlay | after hp- section |
| `devp-`  | DevPanel admin UI | end of file |
| `body.lumos .*` | Light mode overrides | lines ~60–340 |

## CSS Variables (Dark Mode Defaults)
```css
--bg: #080808          --red: #cc0000
--red-bright: #e60000  --gold: #d4a843
--text-1: #ffffff      --text-4: rgba(255,255,255,0.55)
--font-hero: 'Cinzel Decorative'   --font-mono: 'DM Mono'
```

## Home Page Sections (in order)
1. **Cursor** — custom red dot + lagging ring (`h-cursor-dot`, `h-cursor-ring`)
2. **DevMode overlay** — password modal (`devpw-*`)
3. **Background FX** — noise, scanlines, glows, particles (`h-bg-fx`, `h-bg-*`, `h-ptcl`)
4. **Nav** — fixed full-width header with logo + links + register pill (`h-nav`, `h-reg-btn`)
5. **Hero** — full-viewport, centered, animated title with corner labels and scroll cue
6. **Marquee Strip** — scrolling DM Mono text band
7. **About** — two-column grid with cards
8. **Divider** (`h-hr`) — thin rule with ✦ ✦ ✦ text
9. **Join** — form cards grid (4 Google Form links)
10. **Divider**
11. **Vision** — two-column grid with pillars
12. **Divider**
13. **Founders** — two founder cards (SK, AB)
14. **Platform 9¾ Event Banner** — dark, full-width event CTA
15. **Footer** — marquee + brand + links + copyright

## Key Interactions / Logic
- **Scroll state** (`scrolled`) — navbar background opacity changes at `window.scrollY > 60`
- **Mobile menu** (`menuOpen`) — hamburger toggles `.h-mobile-menu`
- **Reveal animations** — `IntersectionObserver` adds `.h-visible` to `.h-reveal` elements
- **Custom cursor** — `useMousePos()` hook drives dot + ring position via `requestAnimationFrame`
- **Developer Mode** — Triple-click "Arjav Badjatya" → password overlay → admin DevPanel
  - Password: `AFGHANISTAN-SDG`

## Email Sender Architecture (Two-Step Pattern)

All email sending is fully decoupled from sheet operations.

**Step 1 — Sheet operation:** Always call TSS.gs. Returns registrant data (firstName, lastName, email, tokenId, etc.) — does NOT send email.

**Step 2 — Email send:** Read `Active Sender` from the Settings sheet (via TSS.gs getSetting). Call the appropriate URL with `{ action: "sendEmail", emailType, ...data }`.

| Active Sender | URL used for email |
|---|---|
| TSS (default) | TSS.gs — sends from the TSS Gmail account |
| AB | AB.gs — sends from arjavbadjatya1026@gmail.com |

**emailType values:**
- `confirmation` — sent after initial registration (payment pending review)
- `approval` — sent after admin approves; includes QR code + token ID
- `hostedBy` — sent to guest when ticket type is "Hosted By"
- `hostNotification` — sent to host when they add a guest

## Active Sender URLs
```
TSS_URL = https://script.google.com/macros/s/AKfycbxkwz04fVFCsyfOLzj-LpUVlgUs0QCbkS_M1ugA7rwMed4U4IEoh2eOInwNFc-ZyRylAw/exec
AB_URL  = https://script.google.com/macros/s/AKfycbyOWV_rrX30sGFin2kzQqWT_aVtUMqT38oCRhYVwMjN00bJzJtkNwCXUzM1gt7qtfYc1A/exec
         (update AB_URL in devApi.ts + Register.tsx once Arjav deploys the new AB.gs)
```

## AB.gs Setup (Arjav must do this)
1. Open https://script.google.com/ signed into arjavbadjatya1026@gmail.com
2. Create new project → paste the contents of `AB.gs`
3. Deploy → New Deployment → Web App
   - Execute as: Me (arjavbadjatya1026@gmail.com)
   - Who has access: Anyone
4. Copy the Web App URL
5. Replace `AB_URL` in `devApi.ts` (line 4) and `Register.tsx` (line 37) with the new URL

## Key Features
- **Registration** — Two-step: Form → TSS.gs (saves to sheet) → active sender (confirmation email)
- **Developer Mode** — Triple-click "Arjav Badjatya" name → password overlay → admin panel
- **DevPanel** — Full admin UI: search, filter, approve, bulk approve, resend email, token copy, Settings tab
- **Email Sender Switch** — Settings tab "Active Sender" key controls which account sends email (TSS or AB); change via DevPanel Settings tab
- **Registration Control** — "Registration Status" setting (open/closed) controls the Register page
- **Light Mode (Lumos)** — `body.lumos` class applies Gryffindor ivory/burgundy/gold palette

## GAS Backend (TSS.gs)
- **Script URL:** `https://script.google.com/macros/s/AKfycbxkwz04fVFCsyfOLzj-LpUVlgUs0QCbkS_M1ugA7rwMed4U4IEoh2eOInwNFc-ZyRylAw/exec`
- **Token format:** `P934-{YEAR}-{ROW_PADDED}-{4_CHAR_HEX}` e.g. `P934-2026-042-A7KX`
- **Actions:** `approveRegistration`, `bulkApprove`, `resendEmail`, `manualRegister`, `getSetting`, `setSetting`, `sendEmail`

## Sheet Layout (3-Section Design)
| Section | Color | Columns |
|---------|-------|---------|
| 1 — Data | Dark red | Timestamp · First/Last/Full Name · Phone · Email · School · Grade · MUN Exp · MUNs Attended · Potterhead? · Note · Screenshot |
| 2 — Workflow | Navy | Referral · Status · Ticket Type · Hosted By Email · Hosted By Row |
| 3 — Token | Deep purple | Token ID · Approved At · Special? · Special Note |

## GAS Migration Notes
- Run `removeLegacyApproveColumn()` once if the live sheet has the old "Approve ✅" checkbox column
- `ensureSection3Columns()` is called automatically before reads/writes — safe to run multiple times
- Settings tab is auto-created with defaults: Active Sender = TSS, Registration Status = open

## Home Page Redesign (Completed)
Full redesign of `Home.tsx` and `index.css` (h-* namespace) implementing:
- **Floating pill navbar** with liquid glass (backdrop-blur + border glow)
- **Massive hero typography** — `clamp(80px, 14vw, 180px)` Cinzel Decorative title
- **Blur-reveal + text-wipe animations** on hero load
- **Orbital SVG rings** (CW/CCW) in the background
- **Noise overlay** + radial glow atmosphere
- **Typographic dividers** with giant faded bg-words (JOIN, VISION, FOUNDERS)
- **Frosted glass cards** (about, founders, event meta) with `backdrop-filter: blur`
- **Custom cursor** — dot + rotating ring
- **Scan-line animation** on Platform 9¾ event section
- **Footer watermark** — faded TSS behind brand text
- **Red underline wipe** on footer links
- Responsive breakpoints at 980px, 768px, 640px

Redesign prompt reference: `attached_assets/Pasted--TSS-WEBSITE-FULL-VISUAL-REDESIGN-PROMPT-For-Replit-AI-_1776701875804.txt`
