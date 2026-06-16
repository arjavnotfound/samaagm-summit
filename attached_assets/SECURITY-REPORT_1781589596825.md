# TSS Website Security Assessment

**Target:** https://thesamaagmsummit.netlify.app/  
**Assessment date:** 16 June 2026  
**Method:** Passive reconnaissance, static JS analysis, safe API probing  
**Comparison baseline:** TMF report at `downloads/tmf/SECURITY-REPORT.md`

---

## Executive Summary

**TSS security is significantly WORSE than TMF.**

TMF has real backend exposure problems, but Supabase Row Level Security (RLS) mostly blocks anonymous access to applicant data. **TSS has an active data breach right now:** anyone on the internet can download **262 Platform 9¾ registration records** with full names, emails, phone numbers, schools, and more — no login, no password, one `curl` command.

| | TMF | TSS |
|---|-----|-----|
| **Overall risk** | HIGH | **CRITICAL** |
| **Anonymous PII access** | Blocked (RLS) | **262 records exposed** |
| **Backend** | Supabase (RLS-dependent) | Google Apps Script (no auth) |
| **Forms** | On-site (broken RLS) | Google Forms (better isolation) |
| **Admin panel** | `/tmf-control-room` (Google OAuth) | Hidden dev panel + **open API** |

---

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React SPA on **Netlify** (static) |
| Event registrations (Platform 9¾) | **Google Apps Script** → Google Sheets |
| Team applications | **Google Forms** (`forms.gle` links) |
| Email sending | Google Apps Script `sendEmail` action |
| Admin UI | "Developer Mode" panel in homepage JS |

### Routes

| Path | Purpose |
|------|---------|
| `/` | Homepage (+ hidden dev panel entry) |
| `/mun` | MUN committees page |
| `/event` | Platform 9¾ event page |
| `/dev` | Listed in `robots.txt` but **not a real route** — returns same SPA shell |

### Google Apps Script endpoints (both in client JS)

```
Primary (TSS):  .../AKfycbxkwz04fVFCsyfOLzj-LpUVlgUs0QCbkS_M1ugA7rwMed4U4IEoh2eOInwNFc-ZyRylAw/exec
Secondary (AB): .../AKfycbyOWV_rrX30sGFin2kzQqWT_aVtUMqT38oCRhYVwMjN00bJzJtkNwCXUzM1gt7qtfYc1A/exec
```

The site picks which sender to use based on `Active Sender` setting (`TSS` vs `AB`).

### Google Forms (external — not on-site backend)

| Form | URL |
|------|-----|
| Collaboration & Sponsorship | `forms.gle/7WRDDa6XfUcnH8cg9` |
| Core Team | `forms.gle/Dp5VFEbwzDiAJm9F9` |
| Secretariat 2.0 | `forms.gle/VV7dgeszyHmZayNp6` |
| Intern | `forms.gle/LmaBU4jy92iwcjez6` |
| Executive Board | `forms.gle/E2yPwFmndCUq7Pmx5` |

---

## Findings

### 🔴 CRITICAL — Fix immediately

#### 1. All Platform 9¾ registrations are publicly downloadable (DATA BREACH)

**Verified:**
```
GET <GAS_URL>?action=getRegistrations
→ HTTP 200, JSON array of 262 records (~127 KB)
```

**Each record includes:**
`firstName`, `lastName`, `fullName`, `email`, `phone`, `school`, `grade`, `munExp`, `munsAttended`, `potterhead`, `note`, `screenshotUrl`, `referral`, `status`, `tokenId`, `approvedAt`, `ticketType`, `hostedByEmail`, etc.

**No authentication. No API key. No password.** The dev-panel password does NOT protect this endpoint.

**What an attacker can do:**
- Download the entire attendee database in seconds
- Harvest 262+ emails and phone numbers for spam/phishing
- See payment screenshot references, personal notes, school info
- Map who attended Platform 9¾ before TSS 2026 even starts

**This alone makes TSS worse than TMF.** TMF's `secretariat_applications` returns `[]` for anonymous users. TSS returns everything.

**Fix:**
- Add authentication to **every** GAS `doGet`/`doPost` handler (shared secret header, OAuth, or IP allowlist)
- Redeploy the script with a **new deployment URL** (old URL is burned — it's in the JS bundle)
- Audit who may have already scraped this data
- Consider notifying affected registrants under applicable privacy norms

---

#### 2. Google Apps Script admin actions exposed in client JavaScript

**Actions found in `/assets/index-DB4C0CfH.js`:**

| Action | What it does |
|--------|--------------|
| `getRegistrations` | Download all registrations ✅ **confirmed open** |
| `getSetting` | Read config values ✅ **confirmed open** |
| `setSetting` | Change config (registration open/closed, email sender, event stage) |
| `approveRegistration` | Approve a row + trigger approval email |
| `bulkApprove` | Mass-approve registrations |
| `resendEmail` | Re-send ticket emails |
| `sendEmail` | Send confirmation/approval/hosted-by emails |
| `manualRegister` | Create registrations manually |

**Verified readable settings (no auth):**
```json
{"success":true,"key":"Registration Status","value":"closed"}
{"success":true,"key":"Active Sender","value":"AB"}
```

**What an attacker can do:**
- Read whether registration is open/closed
- Potentially close/open registration by calling `setSetting` (POST works from browser; `curl` had Content-Length issues but the site's own `fetch()` calls succeed)
- Approve fake registrations, spam approval emails, burn email quota
- Bulk-approve all pending rows

**Fix:** Move all write operations server-side with auth. Never trust the client to call admin actions directly.

---

#### 3. Developer admin panel protected only by client-side password

**How to open the UI:**
1. On homepage, **triple-click** the **"Arjav Badjatya"** founder card (within 2 seconds)
2. Enter password in "Developer Mode" modal
3. Full admin panel opens: review registrations, approve, bulk approve, export, change settings, send test emails, manual register

**Password storage:** SHA-256 hash hardcoded in JS (`KC="996428239c..."`). Compared client-side via `crypto.subtle.digest`. This is security theater — the hash is in the bundle and can be brute-forced/offline cracked.

**But the real problem:** Even without the password, `getRegistrations` already returns all data. The password only gates the **UI**, not the API.

**Fix:** Remove admin logic from the public SPA entirely. Admin should be a separate authenticated tool (or Google Sheets UI only).

---

### 🟠 HIGH

#### 4. `robots.txt` advertises a fake `/dev` route

```
Disallow: /dev
```

`/dev` is not a real React route (only `/`, `/mun`, `/event` exist). It returns the homepage SPA. This is misleading — attackers may still find the real entry (triple-click easter egg + JS analysis).

Same mistake as TMF advertising `/tmf-control-room`.

---

#### 5. No CAPTCHA or rate limiting on GAS endpoints

`getRegistrations` returned 127 KB instantly. No throttling observed. Email actions (`sendEmail`, `resendEmail`) could be abused for cost/harassment.

---

#### 6. Missing security headers

**Present:** `Strict-Transport-Security`  
**Missing:** `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

Same gap as TMF (TMF at least has `X-Content-Type-Options` and `Referrer-Policy` via Cloudflare).

---

#### 7. Two email-sending backends exposed

The JS switches between TSS and AB (Arjav) Google Apps Script deployments for sending emails. Both URLs are in the client bundle. Doubles the attack surface for email abuse.

---

### 🟡 MEDIUM

#### 8. Google Forms for team applications — better than TMF, but not perfect

Team/secretariat/intern/EB applications go to **Google Forms**, not the open GAS API. This is **better architecture** than TMF's direct Supabase insert.

However:
- Form URLs are public (expected)
- Google Form responses are only as secure as the form owner's Google account permissions
- Platform 9¾ data is NOT protected the same way — it's in the open GAS/Sheets pipeline

---

#### 9. Good SEO / crawler practices (not security, but done right)

- Rich JSON-LD structured data
- `<noscript>` fallback content for crawlers
- `google-site-verification` meta tag
- Canonical URLs, Open Graph, FAQ schema

---

## TMF vs TSS — Side-by-Side

| Security control | TMF | TSS | Winner |
|------------------|-----|-----|--------|
| Anonymous read of applicant PII | ❌ Blocked | ✅ **262 records exposed** | **TMF** |
| Anonymous write to applicant data | ❌ Blocked | ⚠️ Likely via GAS actions | **TMF** |
| Admin panel discovery | `robots.txt` leaks URL | Easter egg + `robots.txt` fake `/dev` | Tie (both bad) |
| Admin authentication | Google OAuth + DB allowlist | Client-side password hash | **TMF** |
| Form submission path | Direct DB (broken) | Google Forms (external) | **TSS** |
| Backend credentials in JS | Supabase anon key | GAS URLs (full admin API) | **TMF** (less catastrophic) |
| Settings readable anonymously | `portal_settings` ✅ | `getSetting` ✅ | Tie (both bad) |
| Settings writable anonymously | ❌ Blocked | ⚠️ `setSetting` exposed | **TMF** |
| Email endpoint abuse | Edge function, no rate limit | GAS `sendEmail`, no rate limit | Tie (both bad) |
| Security headers | Partial (Cloudflare) | HSTS only | **TMF** |
| Application form actually works | ❌ RLS blocks insert | ✅ Google Forms work | **TSS** |
| Open user registration on backend | ✅ Supabase signup open | N/A | **TSS** |
| **Overall** | HIGH risk | **CRITICAL risk** | **TMF is safer** |

### Plain English verdict

**TMF** is like leaving your admin door visible but locking the filing cabinets (mostly). The form is broken, but nobody can download applicant data anonymously.

**TSS** is like leaving the filing cabinets on the sidewalk. The dev-panel password is a sticky note on the door that says "please don't enter" while the data is already accessible through the window.

---

## Attack Scenarios (What Could Go Wrong)

### Scenario A — "One curl, entire guest list"
```bash
curl "<GAS_URL>?action=getRegistrations" > stolen.json
```
262 people's emails, phones, schools — gone. No skill required.

### Scenario B — "Close registration remotely"
Call `setSetting` with `Registration Status` = `closed` before an event reopens. Website shows closed even when organizers want it open.

### Scenario C — "Email bomb"
Loop `sendEmail` / `resendEmail` / `approveRegistration` to burn Gmail/Apps Script quotas and spam attendees.

### Scenario D — "Triple-click + hash crack"
1. Triple-click Arjav's founder card
2. Extract SHA-256 hash from JS
3. Crack password offline
4. Use pretty admin UI to bulk-approve or export CSV

(But Scenario A skips all of this.)

---

## What TSS Does RIGHT (vs TMF)

1. **Google Forms for team applications** — separates public forms from custom backend
2. **No Supabase / no open database signup** — smaller direct DB attack surface
3. **Static Netlify frontend** — no server-side rendering vulnerabilities
4. **Registration status can be closed** — currently set to `closed` (good operational state, but readable by anyone)
5. **Rich SEO** — not security, but professionally done

---

## What TSS Does WRONG (vs TMF)

1. **🔴 Open `getRegistrations` — catastrophic, TMF doesn't have this**
2. **🔴 All GAS admin actions ship in client JS**
3. **🔴 Client-side password for admin UI (TMF uses Google OAuth)**
4. **🟠 No security headers beyond HSTS**
5. **🟠 `robots.txt` hints at hidden routes**
6. **🟠 Dual GAS deployments exposed**

---

## Priority Remediation Checklist

### Do TODAY (emergency)
- [ ] **Take down or lock down the GAS deployment** — add auth to all handlers immediately
- [ ] **Redeploy with a new script URL** and update the website (old URL is public forever in git/caches)
- [ ] **Audit Google Sheet access** — who has view/edit permissions?
- [ ] **Review Apps Script execution logs** for suspicious `getRegistrations` calls
- [ ] **Do NOT rely on the dev-panel password** — it protects nothing

### Do this week
- [ ] Remove all admin API calls from the public React bundle
- [ ] Move admin to Google Sheets built-in UI, or a password-protected separate Netlify site with Netlify Identity / Google OAuth
- [ ] Add rate limiting in GAS (LockService + per-IP tracking via `Session.getActiveUser()` or a secret token)
- [ ] Add CAPTCHA to any public write endpoints
- [ ] Remove `/dev` from `robots.txt`
- [ ] Remove triple-click easter egg or replace with server-verified auth
- [ ] Add security headers in `netlify.toml`

### Do this month
- [ ] Privacy review for 262 exposed registrants
- [ ] Add `/.well-known/security.txt`
- [ ] Consolidate to one email-sending backend
- [ ] Document which data lives in Google Forms vs Sheets vs GAS

---

## Test Evidence Summary

| Test | Result |
|------|--------|
| `GET ?action=getRegistrations` | **HTTP 200 — 262 records, full PII** |
| `GET ?action=getSetting&key=Registration Status` | `{"value":"closed"}` — readable |
| `GET ?action=getSetting&key=Active Sender` | `{"value":"AB"}` — readable |
| `GET /robots.txt` | Exposes `/dev` |
| `GET /dev` | Returns homepage SPA (not a real admin route) |
| React routes in JS | `/`, `/mun`, `/event` only |
| Dev panel entry | Triple-click "Arjav Badjatya" founder card |
| Supabase/Firebase in JS | **Not found** |
| Google Forms for applications | 5 forms linked externally |
| Security headers (CSP, X-Frame) | Missing |
| `security.txt` | Not found |

---

## Files Collected

Saved to `downloads/tss/`:

| File | Description |
|------|-------------|
| `index.html`, `mun.html`, `event.html`, `dev.html` | Downloaded pages |
| `index.js` | Full React bundle (473 KB) |
| `robots.txt`, `sitemap.xml` | Discovery files |
| `probe-*.json` | Safe API test payloads |

**Note:** Raw registration data was retrieved during testing to confirm the vulnerability but is **not saved to disk** in this folder to avoid spreading PII. Only the count (262) is reported.

---

## Disclaimer

Non-destructive testing only. No registrations were modified, approved, or deleted. No emails were successfully sent (POST tests hit Google's Content-Length requirements from `curl`; browser-based calls from the site do work). Settings were read but not permanently changed.

---

*Report generated for TSS internal security review. **Urgent action required on the open `getRegistrations` endpoint.***