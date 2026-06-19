# Lux: End-to-End Manual Validation Guide

This guide is designed for non-developers to manually verify that the Lux extension is functioning correctly from installation to data export.

---

## 1. Build the Extension
Before loading the extension into Chrome, it must be compiled.
- **What to do:** Open your terminal in the Lux project folder and run `npm run build`.
- **What should appear:** You should see Vite transforming modules and a green `✓ built in...` success message. A `dist/` folder will be created in your project directory.
- **What could fail:** The build might fail with red TypeScript or ESLint errors.
- **How to diagnose:** Read the terminal output. If you see `error TS...`, there is a code error. Run `npm install` to ensure dependencies are present, then try again.

---

## 2. Load into Chrome
- **What to do:** 
  1. Open Google Chrome and navigate to `chrome://extensions/`.
  2. Toggle **Developer mode** ON (top right corner).
  3. Click **Load unpacked** (top left).
  4. Select the `dist` folder located inside the Lux project directory.
- **What should appear:** The Lux extension card will appear in your extensions list.
- **What could fail:** Chrome might show a "Failed to load extension" error.
- **How to diagnose:** Ensure you selected the `dist` folder, not the root `Lux` folder. Click the "Errors" button on the extension card to see if there are syntax issues in the `manifest.json`.

---

## 3. Verify Manifest Configuration
- **What to do:** Look at the Lux card in `chrome://extensions/` and click **Details**. Scroll down to "Site access".
- **What should appear:** It should state that the extension can read and change data on `*://*.linkedin.com/*`.
- **What could fail:** It might say it has access to "All sites" or no sites.
- **How to diagnose:** Check the `manifest.json` file in the source code. The `host_permissions` and `content_scripts.matches` must explicitly list `*://*.linkedin.com/*`.

---

## 4. Verify Popup Loads
- **What to do:** Click the puzzle piece icon in Chrome's top toolbar, pin Lux, and click the Lux icon.
- **What should appear:** A small dashboard window (the Popup) should open showing "Lux Dashboard", "Total: 0", an empty applications table, and an "Open Settings" link at the bottom.
- **What could fail:** The popup might be blank white or not open at all.
- **How to diagnose:** Right-click inside the popup window and select **Inspect**. Look at the **Console** tab for red JavaScript errors (e.g., failed to load script).

---

## 5. Verify Options Page Loads
- **What to do:** Inside the Lux popup, click the **Open Settings** link at the bottom.
- **What should appear:** A full-screen or new tab page should open showing the "Lux Profile Manager" with a form containing sections for Personal Details, Skills, Education, Experience, and Projects.
- **What could fail:** The link does nothing, or a 404 page opens.
- **How to diagnose:** Right-click the extension icon, click **Inspect popup**, and check the Console. Ensure `chrome.runtime.openOptionsPage()` is executing.

---

## 6. Verify IndexedDB is Created
- **What to do:** While on the Options page, press `F12` (or right-click and Inspect) to open Developer Tools. Go to the **Application** tab, expand **IndexedDB** on the left menu, and click on **LuxDB - ...**.
- **What should appear:** You should see tables named `profile`, `applications`, and `resumeVersions`.
- **What could fail:** The `LuxDB` might not exist, or the tables might be missing.
- **How to diagnose:** Check the Console tab for database initialization errors (e.g., Dexie version mismatch).

---

## 7. Verify Profile Can Be Saved
- **What to do:** Fill out the Profile Manager form. Enter your name, add a skill (e.g., "JavaScript"), and click **Save Profile** at the bottom.
- **What should appear:** A green "Profile saved successfully!" notification should appear. If you refresh the page, your entered data should remain.
- **What could fail:** The save fails, the UI shows a red error, or data vanishes on refresh.
- **How to diagnose:** Open the Console (`F12`). Look for Zod validation errors (e.g., "Company name is required") or IndexedDB write failures.

---

## 8. Verify LinkedIn Content Script Injection
- **What to do:** Open a new tab and navigate to `https://www.linkedin.com/jobs`. Search for any job and click on it.
- **What should appear:** The extension's code should run silently in the background on this page.
- **What could fail:** The extension does not activate on LinkedIn.
- **How to diagnose:** Open Developer Tools (`F12`) on the LinkedIn page. Go to the **Console** tab and check if there are errors indicating `content_scripts` failed to load.

---

## 9. Verify Analyzer Sidebar Renders
- **What to do:** While viewing a specific job description on LinkedIn, look at the right side of the screen.
- **What should appear:** The Lux Analyzer Sidebar should slide in or appear on the right. It will display the Company, Role, a Match Score (%), Matched Skills, and Missing Skills based on the profile you saved earlier.
- **What could fail:** The sidebar doesn't appear, or it appears as a red/blue "Setup Required" dialog.
- **How to diagnose:** If "Setup Required" shows, you didn't save a profile in Step 7. If nothing appears, open the Console (`F12`) and look for DOM extraction errors (e.g., `Cannot read properties of null`).

---

## 10. Verify Log Application Button Works
- **What to do:** Inside the Lux Analyzer Sidebar on LinkedIn, click the blue **Log Application** button.
- **What should appear:** The button should briefly say "Saving...", then turn gray and display "Already Logged".
- **What could fail:** The button stays blue, says "Error Saving", or does nothing.
- **How to diagnose:** Open the Console (`F12`) on LinkedIn. Look for cross-context messaging errors (`chrome.runtime.sendMessage` failed) or duplicate URL constraint errors from Dexie.

---

## 11. Verify Popup Dashboard Shows Logged Applications
- **What to do:** Click the Lux extension icon in the Chrome toolbar to open the popup.
- **What should appear:** The dashboard should now say "Total: 1". The table should list the company, role, status ("Applied"), and date of the job you just logged.
- **What could fail:** The table is still empty ("No applications found").
- **How to diagnose:** Right-click the popup, select **Inspect**, and check the Console. Check the **Application** tab -> **IndexedDB** -> `LuxDB` -> `applications` to see if the row actually saved to the database.

---

## 12. Verify CSV Export Works
- **What to do:** Inside the popup dashboard, click the **Export** button in the toolbar.
- **What should appear:** Your browser should immediately download a file named `lux_applications.csv`. Opening it in Excel/Google Sheets should show the correct columns and your logged application.
- **What could fail:** No file downloads, or the CSV format is corrupted (e.g., commas in the company name broke the columns).
- **How to diagnose:** Inspect the popup Console for JavaScript Blob/URL generation errors. If the file is broken, it means the `CsvExportService` escaping logic failed.
