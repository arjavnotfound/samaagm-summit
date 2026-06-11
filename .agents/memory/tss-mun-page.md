---
name: TSS MUN Page
description: Architecture and design decisions for the /mun route — committees, CSS prefix, hooks pattern.
---

## Architecture
- Component: `src/pages/MUN.tsx`, styles: `src/mun.css` (imported inside MUN.tsx)
- CSS prefix: `m-` for all MUN-specific classes; reuses all TSS `h-` global classes
- Route added in App.tsx: `<Route path="/mun" component={MUN} />`
- Nav link added to Home.tsx (desktop + mobile menu)

## Key Patterns Duplicated from Home.tsx
- `useMunReveal()` — IntersectionObserver for `.h-reveal` / `.h-visible` (same logic as Home)
- `useMunMousePos()` — custom cursor dot + ring (same pattern)
- Same `h-nav`, `h-nav-inner`, `h-logo`, `h-nav-links` classes for nav consistency

## Committee Data
- 6 committees in `COMMITTEES` array in MUN.tsx
- Each has: `id`, `num`, `abbr` (for ghost watermark), `name`, `body`, `bodyType` (india|un), `agenda`
- Accordion expand via `expandedCommittee` state — clicking toggles full agenda visibility
- Inline SVG icons in `COMMITTEE_ICONS` record keyed by committee id

## Design Decisions
- Ghost watermark: each committee card shows `abbr` (LS, RS, AIPPM, UNHRC, UNCSW, DISEC) as a massive Cinzel Decorative watermark behind the card content
- UN committees get blue-tinted body badge; India committees get neutral badge
- `m-body-badge--india` / `m-body-badge--un` for badge variants
- "Special committees" section uses a "classified document" sealed aesthetic with `m-sealed` cards
- "Coming soon" tiles use `m-coming-tile` with animated dot status

## SEO
- Per-page title/description/canonical via useEffect (same pattern as Register.tsx)
- WebPage + ItemList schemas added to index.html JSON-LD @graph
- /mun added to sitemap.xml with priority 0.95 (just below homepage 1.0)

**Why m- prefix:** Avoids any collision with the 7000+ line index.css h- classes.
