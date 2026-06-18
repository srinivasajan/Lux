# Product Requirements Document
## Job Application Assistant — Chrome Extension
**Version:** 1.1  
**Author:** Srinivas  
**Status:** Draft

---

## 0. Problem Statement

Job hunting as a student is repetitive, untracked, and inefficient. Applying across dozens of platforms — LinkedIn, Naukri, Indeed, Internshala, Instahyre, remote job boards, and company career pages — means:

- Manually rewriting the same resume for every role
- No visibility into which applications were sent, when, or with which resume version
- Zero feedback on why applications get rejected (ATS mismatch)
- Hours wasted on form-filling instead of actually preparing for interviews

This extension solves all three problems in one place — free, private, browser-native.

---

## 1. Goals

| Goal | Description |
|------|-------------|
| Resume tailoring | Generate a truthful, ATS-optimized resume version per job — same experience, matched language |
| JD analysis | Instantly show how well a job posting matches the user's profile |
| Application tracking | Log every application automatically with full metadata |
| Analytics | Surface patterns — which platforms, roles, and resume versions perform best |
| Control | Let user decide when, where, and how many applications to send |

---

## 2. Non-Goals (V1)

- Auto-submitting applications autonomously (deferred to V2 — risk of platform bans)
- Cover letter generation (V2)
- Email follow-up automation (V2)
- Mobile support (Chrome desktop only for V1)
- PDF resume uploads / parsing (V2 — too complex; V1 generates all resumes from master profile)

---

## 3. Target Platforms

**Primary (V1):**
- LinkedIn (Easy Apply)
- Naukri
- Internshala
- Instahyre

**Secondary (V1 — full support):**
- Indeed
- Remote job boards (We Work Remotely, Remote.co, Wellfound)
- Company career pages (direct application)

---

## 4. User Profile

- Final-year or recent graduate student
- Applying for internships + full-time roles
- Technical background (Android/software development)
- Applies across 10–50 platforms, wants 100+ applications/month

---

## 5. Feature Priority

### P0 — Must Have (MVP blockers)
- Profile Manager (master data store)
- JD Analyzer (scraping + match score)
- Resume Generator (PDF from profile + tailored bullets)
- Application Log (track every submission)

### P1 — Should Have (V1 complete)
- Analytics dashboard
- CSV export
- Daily application limits
- Platform toggles

### P2 — Nice to Have (post-V1)
- Multi-platform scraper coverage
- Advanced scoring (semantic matching)
- Resume performance analytics
- Auto-fill assist

---

## 6. Features

### 6.1 Profile Manager
One-time setup. Stored in IndexedDB (never leaves the device).

**Fields:**
- Personal: name, email, phone, LinkedIn URL, GitHub, portfolio
- Education: degree, university, CGPA, graduation year
- Skills: technical skills, tools, languages, frameworks (tagged list)
- Experience: company, role, duration, bullet points (multiple entries)
- Projects: title, description, tech stack, links
- Certifications: name, issuer, year

> Note: No PDF upload in V1. All resume versions are generated from this structured master profile. This keeps the architecture clean and avoids PDF parsing complexity.

---

### 6.2 Job Description Analyzer
Triggers automatically when user visits a supported job listing page.

**What it does:**
- Scrapes job title, company name, JD text, required skills, preferred skills, experience level, education requirement
- Compares against user profile
- Displays match score breakdown in the extension sidebar

**Match Score Formula:**

```
Overall Score = (Skills × 0.50) + (Experience × 0.30) + (Education × 0.20)
```

| Component | Weight | How calculated |
|-----------|--------|----------------|
| Skills | 50% | (matched skills / total required skills) × 100 |
| Experience | 30% | Years/level match — exact=100%, one level off=60%, two off=20% |
| Education | 20% | Degree match — exact=100%, related=70%, unrelated=30% |

**Match Score Output:**
```
Overall Match: 78%

Skills Match:       85%   (17/20 required skills matched)
Experience Match:   60%   (fresher vs 1-2 yrs required)
Education Match:   100%   (B.Tech matches requirement)

Missing Keywords:
- Docker
- AWS
- CI/CD

Present Keywords:
- Android, Kotlin, REST APIs, Git, Agile
```

**Behavior:**
- Score color-coded: green (>75%), amber (50–75%), red (<50%)
- If JD cannot be parsed: shows "Unable to parse job description. Try refreshing or paste JD manually." — never crashes silently

---

### 6.3 Resume Tailor Engine
Core feature. Generates a tailored resume PDF per job — no fabrication, only rephrasing.

**Engine architecture (pluggable):**
```
TailorEngine interface
├── NvidiaTailor    (primary — NVIDIA NIM API, OpenAI-compatible format)
├── LocalTailor     (offline fallback — keyword swap, no API key needed)
└── [Future]        (Claude, OpenAI, Gemini, etc.)
```

All engines implement the same `tailor(profile, jdKeywords) → tailoredBullets` interface. User can switch engines in settings. NvidiaTailor is the default since the user already has an NVIDIA API key — falls back to LocalTailor automatically if the API is unreachable.

**Example (both engines produce similar output):**
```
Profile bullet:   "Built Flask APIs for mobile apps"
JD keywords:      "RESTful backend services, microservices"
Tailored output:  "Developed RESTful backend services using Flask for mobile clients"
```

**Output:**
- Clean single-page PDF, ATS-safe (no tables, no columns, no graphics)
- Auto-named: `Srinivas_Resume_CompanyName_Role_YYYY-MM-DD.pdf`
- Preview before download
- Reference stored in application log

---

### 6.4 Application Tracker
Auto-logs every application the user submits while the extension is active.

**Log entry fields:**
```
id                  → unique identifier
company_name
role_title
platform            (LinkedIn / Naukri / Indeed / etc.)
date_applied
jd_url
match_score         (snapshot at time of apply)
resume_version_id   (reference to generated resume)
status              (Applied / Viewed / Rejected / Interview / Offer)
notes               (user-editable)
```

**Views:**
- List view with filters: platform, date range, status, role keyword
- Status update: user manually updates when they hear back

**Export:** Full log to CSV, one click (P1)

---

### 6.5 Analytics
Surfaces patterns from application history to help user improve over time.

**Metrics tracked:**
```
Total applications
Total interviews
Total offers
Rejection rate
Response rate (interviews / applications)
Avg match score across all applications
Platform performance    (response rate per platform)
Resume version performance  (response rate per resume variant)
Role performance        (response rate by role type)
```

**Views:**
- Summary cards (total applied, interviews, offers, response rate)
- Platform breakdown table
- Match score distribution chart
- Application volume over time

---

### 6.6 Control Panel (Extension Popup)
The main UI the user sees when clicking the extension icon.

**Controls:**
- Platform toggles: enable/disable per platform for today (P1)
- Daily application limit: max per day — extension warns when limit hit (P1)
- Role filter: only analyze for jobs matching keywords e.g. "Android", "Intern" (P1)
- Tailor engine selector: NVIDIA vs Local (P1)
- Quick stats: today / this week / total count

---

## 7. Storage Architecture

```
Chrome storage.local (small, fast, sync-eligible)
├── settings          (platform toggles, daily limit, role filters)
├── api_keys          (NVIDIA API key — encrypted)
└── preferences       (tailor engine choice, theme, etc.)

IndexedDB (large capacity, queryable, handles 1000+ records)
├── profile           (master profile object)
├── applications      (full application log — filterable, sortable)
├── resume_versions   (generated resume metadata + bullet snapshots)
└── analytics_cache   (pre-computed metrics — rebuilt on demand)
```

**Why IndexedDB for applications and resumes:**
- Chrome storage.local is capped at ~10MB — 1000+ applications with metadata would exceed this
- IndexedDB supports indexed queries (filter by platform, date range, status) without loading everything into memory
- Much faster for the analytics dashboard

---

## 8. Architecture

```
Chrome Extension (Manifest V3)
│
├── manifest.json
│
├── popup/
│   ├── popup.html              (control panel UI)
│   └── popup.js                (toggles, limits, quick stats)
│
├── options/
│   ├── options.html            (profile manager + settings)
│   └── options.js
│
├── content/
│   ├── analyzer.js             (scrapes JD, injects sidebar)
│   ├── platforms/
│   │   ├── linkedin.js         (LinkedIn-specific selectors)
│   │   ├── naukri.js
│   │   ├── internshala.js
│   │   └── generic.js          (fallback for unknown pages)
│   └── sidebar/
│       ├── sidebar.html
│       └── sidebar.js          (match score UI, tailor button)
│
├── background/
│   └── service-worker.js       (event coordination, log writes)
│
├── engine/
│   ├── matcher.js              (keyword extraction + scoring)
│   ├── tailor/
│   │   ├── interface.js        (TailorEngine interface)
│   │   ├── local-tailor.js     (keyword-swap implementation)
│   │   └── nvidia-tailor.js    (NVIDIA NIM API implementation)
│   └── pdf-generator.js        (ATS-safe PDF from profile data)
│
└── storage/
    ├── chrome-storage.js       (settings, keys, preferences)
    └── idb.js                  (IndexedDB wrapper — profile, apps, resumes)
```

---

## 9. Error Handling

| Failure | User-facing message | Behaviour |
|---------|-------------------|-----------|
| JD cannot be parsed | "Unable to parse job description. Try refreshing or paste JD manually." | Sidebar shows manual input field |
| LinkedIn DOM change | "Job details unavailable on this page." | Graceful degradation, no crash |
| NVIDIA API failure | "AI tailoring unavailable. Switched to local tailor." | Auto-falls back to LocalTailor |
| PDF generation fails | "Resume generation failed. Check your profile data." | Highlights missing fields |
| IndexedDB unavailable | "Storage error. Data may not be saved." | Warns user, keeps session state in memory |
| Daily limit reached | "Daily limit of X applications reached." | Disables tailor button, shows reset time |

---

## 10. Technical Stack

| Layer | Technology |
|-------|------------|
| Extension framework | Chrome Manifest V3 |
| UI | HTML + CSS + Vanilla JS |
| JD scraping | DOM selectors via content scripts |
| Resume generation | pdf-lib (client-side, no server) |
| Resume tailoring | NvidiaTailor (default, NVIDIA NIM API) / LocalTailor (offline fallback) |
| Primary storage | IndexedDB (applications, profile, resumes) |
| Config storage | Chrome storage.local (settings, keys) |
| Export | CSV via Blob download |

---

## 11. Privacy & Security

- All data on-device — no external server, no account required
- NVIDIA API key stored in Chrome storage, never logged or transmitted elsewhere
- API calls send only JD keywords + experience bullets — no PII
- User can wipe all data from settings at any time
- Minimum permissions: `storage`, `activeTab`, `scripting`

---

## 12. MVP Milestone Plan

| Milestone | Features (P0 first) | Est. Effort |
|-----------|---------------------|-------------|
| M1 — Foundation | Profile manager + IndexedDB + options page | 2–3 days |
| M2 — Analyzer | JD scraper (LinkedIn + Naukri) + match score sidebar | 3–4 days |
| M3 — Tracker | Application log + popup stats | 2–3 days |
| M4 — Resume Engine | PDF generator + LocalTailor + NvidiaTailor | 4–5 days |
| M5 — Analytics + Polish | Analytics dashboard, CSV export, daily limits, error handling | 3–4 days |

**Total estimated build time:** 2.5–3 weeks (solo, part-time)

---

## 13. Success Metrics

- 100+ applications/month with under 30 min/day effort
- Average match score >70% per application
- Zero missed applications (everything logged)
- Response rate improves measurably after first 50 applications (analytics feedback loop)

---

## 14. Open Questions

1. Should the sidebar inject into the job page or live only inside the popup? (UX preference)
2. How to handle LinkedIn's frequent DOM changes — MutationObserver or periodic polling?
3. Should analytics cache be rebuilt on every open or on a schedule?

---

*Next step: Functional Requirements Specification (FRS)*
