# Product Backlog

This document stores future improvements, feature requests, and ideas that fall outside the scope of the V1 PRD. It ensures the PRD remains frozen and actionable.

## Feature Ideas (Post-V1)

1. **Cover Letter Generator**
   - Use the Profile and JD context to generate a matching Cover Letter text/PDF.

2. **Auto-Submit Integration**
   - Safely attempt to auto-fill Workday / Greenhouse application forms using the Master Profile data. (High risk of platform bans, needs careful rate-limiting and DOM fallback strategies).

3. **Multi-Platform Scraping Coverage**
   - Expand the Analyzer's scraper beyond LinkedIn/Naukri/Internshala/Instahyre to include Indeed, Wellfound (AngelList), and generic company career pages (e.g., Lever, Greenhouse).

4. **Semantic Scoring (Matcher V2)**
   - Upgrade the Matcher algorithm from exact string matching to semantic vector embeddings (e.g., knowing "React" matches "Frontend Framework").

5. **Email Follow-up Automation**
   - Draft follow-up emails in Gmail to recruiters after X days of applying.

6. **Resume Performance Analytics (A/B Testing)**
   - Correlate specific resume variants (or specific tailored bullets) with Interview/Offer rates to automatically suggest which bullets perform best.

7. **PDF Upload / Parser (Profile Setup)**
   - Allow users to upload their existing PDF resume to auto-populate the Master Profile, instead of requiring manual form entry. (Complex PDF parsing required).
