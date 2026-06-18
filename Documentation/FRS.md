# Functional Requirements Specification (FRS)

## 1. Profile Management (`features/profile`)
- **REQ-PROF-01:** The system shall store the user's master profile locally using IndexedDB (Dexie).
- **REQ-PROF-02:** The profile schema shall include arrays for Skills, Experience (with bullet points), Education, and Projects.
- **REQ-PROF-03:** The user interface shall provide form validation to ensure required fields (Name, Email) are present before saving.

## 2. Job Description Analysis (`features/analyzer`)
- **REQ-ANA-01:** The system shall automatically parse the DOM of LinkedIn, Naukri, Internshala, and Instahyre job postings to extract: Job Title, Company Name, Required Skills, and Experience Level.
- **REQ-ANA-02:** The system shall calculate an overall match score based on: Skills (50%), Experience (30%), and Education (20%).
- **REQ-ANA-03:** The system shall inject an isolated, non-conflicting UI sidebar into the host page to display the score and parsed keywords.
- **REQ-ANA-04:** If DOM parsing fails, the system shall provide a manual input text area in the sidebar.

## 3. Resume Tailoring Engine (`features/resume`)
- **REQ-RES-01:** The system shall implement a `TailorEngine` interface.
- **REQ-RES-02:** The primary engine (`NvidiaTailor`) shall communicate with the NVIDIA NIM API to contextually rephrase experience bullets to match JD keywords.
- **REQ-RES-03:** The fallback engine (`LocalTailor`) shall perform local keyword swapping without external API calls if the NVIDIA API is unavailable or unconfigured.
- **REQ-RES-04:** The system shall use `pdf-lib` to generate a single-page, ATS-safe PDF entirely on the client side.

## 4. Application Tracking (`features/tracker`)
- **REQ-TRK-01:** The system shall listen for submission events on supported job platforms.
- **REQ-TRK-02:** The system shall automatically write a log entry to IndexedDB upon application submission containing: ID, Company, Role, Platform, Date, Score, and Resume Version ID.
- **REQ-TRK-03:** The user shall be able to manually update the status of an application (e.g., Applied -> Interview).
- **REQ-TRK-04:** The system shall prevent submissions if the user-defined Daily Application Limit is exceeded.

## 5. Analytics (`features/analytics`)
- **REQ-ALY-01:** The system shall aggregate IndexedDB records to calculate: Rejection Rate, Response Rate, and Platform Performance.
- **REQ-ALY-02:** The system shall provide a function to export the `applications` table to a downloadable CSV file.
