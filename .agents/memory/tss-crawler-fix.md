---
name: TSS Crawler Visibility Fix
description: How the .h-reveal animation was making all page content invisible to search crawlers, and the fix applied.
---

## The Problem
All page sections used `.h-reveal` (opacity:0, translateY, blur) revealed only via IntersectionObserver in JS. Crawlers that don't scroll or fully execute JS saw blank content.

## The Fix
- Added `<script>document.documentElement.classList.add('js')</script>` synchronously in `<head>` — runs before body renders.
- Changed `.h-reveal { opacity:0 }` → `.js .h-reveal { opacity:0 }` in index.css.
- Without JS (crawlers): elements are fully visible by default.
- With JS: `.js` class on `<html>` makes them start hidden; IntersectionObserver adds `.h-visible` to animate in.
- Added `<noscript><style>.h-reveal { opacity:1!important; ... }</style></noscript>` as belt-and-suspenders.

**Why:** Specificity parity (.js .h-reveal vs .h-reveal.h-visible both = 0,2,0) means last rule wins for opacity, but transition still fires from .js .h-reveal. Works correctly.

## Also Fixed in Same Session
- og:description had wrong founders ("Arjav Jain & Aakash Doshi") — corrected to Somya Khandare & Arjav Badjatya.
- og:url and og:image pointed to thesamaagmsummit.com — corrected to thesamaagmsummit.netlify.app.
- Added comprehensive JSON-LD: WebSite, Organization, Person (×2), EducationalEvent, Event, FAQPage.
- Added <noscript> body HTML block with full page content for no-JS crawlers.
- Mobile dates grid: changed flex-direction from column → row at ≤640px with scaled font sizes.
- Added canonical, theme-color, robots meta, lang="en-IN", application-name.
- Added <main> landmark, aria-labels on all sections, role="contentinfo" on footer.
- Register.tsx: useEffect to update document.title + meta description + canonical per-page.
