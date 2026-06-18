# Roadmap

## Current Milestone (M1: Foundation)
**Goal:** Establish the underlying infrastructure and ensure the user can save and retrieve their Master Profile from local storage.
- Scaffold architecture using Vite, TypeScript (strict), and Dexie.
- Establish the testing framework structure.
- Build the Options page with the Profile Manager form.

## Next Milestones (M2 & M3: Intelligence & Tracking)
**Goal:** Make the extension actively useful on job boards.
- **M2 (Analyzer):** Read job descriptions from LinkedIn/Naukri and provide an instant match score overlay.
- **M3 (Tracker):** Automatically intercept job applications and log them to the local database to track volume and status.

## Future Milestones (M4 & M5: Tailoring & Analytics)
**Goal:** Complete the MVP by automating the resume process and providing feedback loops.
- **M4 (Resume Engine):** Contextually rewrite resume bullets using NVIDIA NIM and generate ATS-friendly PDFs on the fly.
- **M5 (Analytics):** Provide a dashboard to view response rates, export to CSV, and enforce application pacing (daily limits).

## Post-V1 Horizon (V2)
- Multi-platform scraper coverage (Indeed, Wellfound, Direct Careers pages).
- Advanced semantic scoring for the Matcher instead of pure keyword matching.
- Auto-fill forms for Workday and Greenhouse.
- Automated cover letter generation.
