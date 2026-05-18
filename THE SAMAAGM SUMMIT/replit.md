# The Samaagm Summit (TSS)

React + Vite + TypeScript website for TSS — India's first democratic youth summit. The site serves as a public landing page, a Harry Potter-themed event registration portal ("Platform 9¾"), and an internal admin panel for the TSS team.

## Tech Stack
- **Framework:** React 18 + Vite 5 + TypeScript
- **Routing:** Wouter
- **Styling:** Vanilla CSS (all in `src/index.css`, ~6549 lines) — no Tailwind used for the `h-` (Home) or `hp-` (Register) namespaces; Tailwind v4 is imported but only used for DevPanel utility classes
- **Icons:** Lucide React, React Icons (FaInstagram, FaWhatsapp)
- **QR Codes:** `qrcode.react`
- **Fonts:** Cinzel, Cinzel Decorative, Lora, DM Mono, Cormorant Garant, Space Grotesk (all via Google Fonts)
- **Backend:** Google Apps Script (GAS) — `google-apps-script.gs`
- **Package manager:** npm (use `npm run dev`)
- **Dev server:** PORT 5000, workflow: `cd 'THE SAMAAGM SUMMIT' && PORT=5000 BASE_PATH=/ npm run dev`

## Project Structure
```
THE SAMAAGM SUMMIT/
├── src/
│   ├── pages/
│   │   ├── Home.tsx          — Homepage (~564 lines) + DevMode easter egg
│   │   ├── Register.tsx      — Platform 9¾ event page + registration form (~1908 lines)
│   │   └── not-found.tsx     — 404 page
│   ├── components/
│   │   ├── DevPanel.tsx      — Internal admin panel (~1216 lines)
│   │   └── ui/               — Shadcn/Radix UI component library (unused on main pages)
│   ├── lib/
│   │   ├── devApi.ts         — GAS API client (~277 lines): two-step sheet op → email send
│   │   └── utils.ts          — Tailwind utility (cn)
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── index.css             — All site styles (~6549 lines)
│   │                           h-* = Home page classes
│   │                           hp-* = Register/Platform 9¾ page classes
│   │                           devpw-* / devp-* = DevPanel classes
│   │                           body.lumos = light mode overrides (Gryffindor palette)
│   └── main.tsx              — React entry point
├── google-apps-script.gs     — TSS GAS backend (~2160 lines): sheet ops, paste into Apps Script (TSS account)
├── AB.gs                     — Independent email sender (~709 lines): deploy from arjavbadjatya1026@gmail.com
├── index.html                — HTML entry with Google Fonts
├── vite.config.ts            — Requires PORT and BASE_PATH env vars
├── tsconfig.json
└── package.json
```

## Routes
| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Home.tsx` | Public landing page |
| `/event` | `Register.tsx` | Platform 9¾ event page + registration |
| `*` | `not-found.tsx` | 404 fallback |

## CSS Namespace Guide
| Prefix | Purpose |
|--------|---------|
| `h-` | Home page |
| `hp-` | Register / Platform 9¾ page |
| `devpw-` | Dev password overlay |
| `devp-` | DevPanel admin UI |
| `body.lumos .*` | Light mode overrides (Lumos toggle) |

## CSS Variables (Dark Mode Defaults)
```css
--bg: #080808          --red: #cc0000
--red-bright: #e60000  --gold: #d4a843
--text-1: #ffffff      --text-4: rgba(255,255,255,0.55)
--font-hero: 'Cinzel Decorative'   --font-mono: 'DM Mono'
```

## Home Page (`/`) — Sections in Order
1. **Custom Cursor** — red dot + lagging ring (`h-cursor-dot`, `h-cursor-ring`)
2. **DevMode Overlay** — password modal (`devpw-*`), revealed by triple-clicking "Arjav Badjatya"
3. **Background FX** — noise, scanlines, glows, floating particles, SVG orbital rings (`h-bg-fx`)
4. **Nav** — fixed header with logo, section links, Instagram link, "Platform 9¾" pill (`h-nav`)
5. **Hero** — full-viewport animated title, corner labels, scroll cue
6. **Marquee Strip** — scrolling DM Mono text band
7. **About** — two-column grid: body copy + two feature cards (MUN, Democratic Format)
8. **Divider** — thin rule with ✦ glyph (`h-divider`)
9. **Join the Team** — 4 Google Form links (Collaboration, Core Team, Secretariat, Intern)
10. **Divider**
11. **Democratic Vision** — two-column: body copy + voted agendas steps
12. **Divider**
13. **Founders** — editorial rows: Somya Khandare (CEO) + Arjav Badjatya (CMO)
14. **Platform 9¾ — Past Event Banner** — stats (350+ registrations, 4 hrs, April 12 2026, Underdoggs Indore), CTA to `/event`
15. **Footer** — marquee + brand + Instagram link + email + copyright

## Platform 9¾ Page (`/event`) — Key Sections
1. **Background FX** — glows, noise, scanlines, animated particle shower
2. **Custom Cursor** — dot + lagging ring
3. **Golden Snitch** — animated CSS decorative element
4. **Nav Bar** — back-to-TSS link, brand, Instagram link, Lumos/Nox toggle
5. **Hero** — "PLATFORM 9¾" animated title, tagline, pills (Rave, HP Challenges, Prizes, Surprises)
6. **HP Quote** — Dumbledore quote block
7. **Countdown / Live / Ended Banner** — adapts to event phase (Pre-Event countdown, Live progress bar, Post-Event "Mischief Managed")
8. **Registration Cards** — What to Expect, payment info, register CTA button
9. **Event Details** — Date (12 Apr 2026), Time (4–8 PM IST), Venue (Underdoggs, Indore)
10. **Registration Modal** — 3-step: (1) Personal info form, (2) Payment screenshot upload, (3) Success screen with QR code
11. **Venue Accordion** — expandable venue info with map link
12. **FAQ Accordion** — expandable help section
13. **Float CTA** — sticky bottom bar appears after hero scrolls out of view
14. **Footer** — Instagram, WhatsApp, email links

> **Current Status:** Platform 9¾ is a **past event** (held April 12, 2026). The page shows the "ended" phase with "Mischief Managed · 350+ Registered · April 12, 2026" badge. Registration is closed.

## Key Interactions / Logic
- **Scroll state** (`scrolled`) — navbar background opacity changes at `window.scrollY > 60`
- **Mobile menu** (`menuOpen`) — hamburger toggles `.h-mobile-menu`
- **Reveal animations** — `IntersectionObserver` adds `.h-visible` / `.visible` to `.h-reveal` / `.reveal` elements
- **Custom cursor** — `useMousePos()` hook drives dot + ring via `requestAnimationFrame`
- **Lumos/Nox** — toggle button on `/event` page adds `body.lumos` class, switching to Gryffindor ivory/burgundy/gold palette
- **Event Phase** — `useCountdown()` hook returns `countdown | live | ended`; can be overridden by `Event Stage` setting from GAS
- **Registration Status** — fetched from GAS `getSetting("Registration Status")` on page load; `"closed"` disables the register button
- **Developer Mode** — Triple-click "Arjav Badjatya" name on Home → password overlay → admin DevPanel
  - Password: `AFGHANISTAN-SDG`

## DevPanel (Internal Admin)
Unlocked via the easter egg above. Three sections:
- **Review Registrations** — table with search/filter, approve (single or bulk), resend email, copy Token ID
- **Manual Registration** — add a registrant bypassing the public form; supports Complimentary and "Hosted By" ticket types
- **Settings** — toggle Active Sender (TSS / AB), Registration Status (open/closed), Event Stage override; send test emails

## Email Sender Architecture (Two-Step Pattern)
All email sending is decoupled from sheet operations.

**Step 1 — Sheet operation:** Always call TSS.gs. Returns registrant data — does NOT send email.

**Step 2 — Email send:** Read `Active Sender` from the Settings sheet (via `getSetting`). Call the appropriate sender URL with `{ action: "sendEmail", emailType, ...data }`.

| Active Sender | URL used for email |
|---|---|
| TSS (default) | TSS.gs — sends from TSS Gmail account |
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
```
Both URLs appear in `devApi.ts` (lines 1–5) and `Register.tsx` (lines 31–34).

## AB.gs Setup (Arjav must do this)
1. Open https://script.google.com/ signed into arjavbadjatya1026@gmail.com
2. Create new project → paste the contents of `AB.gs`
3. Deploy → New Deployment → Web App
   - Execute as: Me (arjavbadjatya1026@gmail.com)
   - Who has access: Anyone
4. Copy the Web App URL
5. Replace `AB_URL` in `devApi.ts` (line 4) and `Register.tsx` (line 34) with the new URL

## GAS Backend (TSS.gs / google-apps-script.gs)
- **Script URL:** `https://script.google.com/macros/s/AKfycbxkwz04fVFCsyfOLzj-LpUVlgUs0QCbkS_M1ugA7rwMed4U4IEoh2eOInwNFc-ZyRylAw/exec`
- **Token format:** `P934-{YEAR}-{ROW_PADDED}-{4_CHAR_HEX}` e.g. `P934-2026-042-A7KX`
- **GET actions:** `getRegistrations`, `getSetting`
- **POST actions:** `approveRegistration`, `bulkApprove`, `resendEmail`, `manualRegister`, `setSetting`, `sendEmail`

## Sheet Layout (3-Section Design)
| Section | Color | Columns |
|---------|-------|---------|
| 1 — Data | Dark red | Timestamp · First/Last/Full Name · Phone · Email · School · Grade · MUN Exp · MUNs Attended · Potterhead? · Note · Screenshot |
| 2 — Workflow | Navy | Referral · Status · Ticket Type · Hosted By Email · Hosted By Row |
| 3 — Token | Deep purple | Token ID · Approved At · Special? · Special Note |

## GAS Migration Notes
- Run `removeLegacyApproveColumn()` once if the live sheet has the old "Approve ✅" checkbox column
- `ensureSection3Columns()` is called automatically before reads/writes — safe to run multiple times
- Settings tab is auto-created with defaults: Active Sender = TSS, Registration Status = open, Event Stage = Auto

## User Preferences
- Do not use Tailwind for `h-*` (Home) or `hp-*` (Register) CSS — all styles go in `index.css` using vanilla CSS under the appropriate namespace
- Maintain the existing CSS namespace system; do not merge or rename prefixes
- The dev server runs on PORT 5000 from inside the `THE SAMAAGM SUMMIT/` directory
