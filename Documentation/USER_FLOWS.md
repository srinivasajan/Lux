# User Flows

## 1. Initial Setup Flow
1. User installs the extension and clicks the extension icon.
2. The popup prompts the user to complete their Master Profile.
3. User clicks "Setup Profile" and is directed to the `options.html` page.
4. User enters Personal details, Education, Skills, Experience, and Projects.
5. User provides an optional NVIDIA API key for AI tailoring.
6. User clicks "Save". Data is committed to IndexedDB.

## 2. Job Analysis Flow (Passive)
1. User navigates to a supported job board (e.g., LinkedIn Easy Apply page).
2. The content script detects the URL and triggers the JD Scraper.
3. JD Scraper extracts Title, Company, Requirements, and Experience.
4. The Analyzer compares scraped data against the Master Profile from IndexedDB.
5. The extension injects a visual Sidebar displaying the Match Score (Green/Amber/Red) and keyword breakdown.

## 3. Resume Tailoring Flow
1. Inside the injected Sidebar, the user reviews the Match Score.
2. User clicks "Generate Tailored Resume".
3. The extension sends JD keywords and Profile data to the Tailor Engine.
4. (If NVIDIA API key exists) The engine calls NVIDIA NIM to rewrite experience bullets. (Else) The engine uses the Local offline keyword-swap fallback.
5. `pdf-lib` constructs an ATS-friendly PDF.
6. PDF is automatically downloaded as `First_Last_Company_Role_Date.pdf`.
7. The resume variant is saved to IndexedDB (`resume_versions`).

## 4. Application Tracking Flow
1. User clicks the "Apply" or "Submit Application" button on the job board.
2. The content script intercepts the action.
3. An entry is automatically created in the Application Tracker (IndexedDB) logging: Company, Role, Platform, Date, JD URL, Match Score snapshot, and Resume Variant ID.
4. The popup's "Daily Quota" decrements.

## 5. Analytics & Review Flow
1. User opens the extension Popup.
2. User clicks "View Analytics Dashboard" (opens a tab to `options.html#analytics`).
3. Dashboard queries IndexedDB and displays Response Rates, Total Applications, and Match Score Distributions.
4. User can export the entire application log to CSV with one click.
