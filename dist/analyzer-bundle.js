"use strict";
(() => {
  // src/features/analyzer/linkedin.extractor.ts
  function trySelectors(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        const text = el?.textContent?.trim();
        if (text) return text;
      } catch {
      }
    }
    return "";
  }
  var LinkedInExtractor = class {
    /**
     * Extracts job title, company name, and description from a LinkedIn jobs page.
     * Uses a wide fallback chain and NEVER returns null.
     * Falls back to { title: 'Unknown Job', company: 'Unknown Company', description: '' }.
     */
    static extract() {
      const title = trySelectors([
        // 2024-2025 unified top-card (jobs/view/* and search results panel)
        ".job-details-jobs-unified-top-card__job-title h1",
        ".job-details-jobs-unified-top-card__job-title",
        // Older "top card" layout used on embedded and share URLs
        ".top-card-layout__title",
        // Aria landmark – LinkedIn sets this on the primary heading
        'h1[class*="job-details"]',
        'h1[class*="top-card"]',
        'h1[class*="jobs-unified"]',
        // Generic: first h1 inside the job panel container
        ".jobs-details h1",
        ".job-view-layout h1",
        // Last resort: any h1 on the page
        "h1"
      ]);
      const company = trySelectors([
        // 2024-2025 unified card: company name link or span
        ".job-details-jobs-unified-top-card__company-name a",
        ".job-details-jobs-unified-top-card__company-name",
        // Primary description area contains "Company · Location · …"
        ".job-details-jobs-unified-top-card__primary-description-container a",
        ".job-details-jobs-unified-top-card__primary-description a",
        // Older top-card
        ".topcard__org-name-link",
        ".topcard__flavor--black-link",
        // Public / share job page
        ".sub-nav-cta__optional-url",
        // Any anchor pointing to a company page
        'a[href*="/company/"]'
      ]);
      const descNode = document.getElementById("job-details") || document.querySelector(".jobs-description__content") || document.querySelector(".jobs-description-content__text") || document.querySelector(".description__text") || document.querySelector('[class*="jobs-description"]') || document.querySelector('[class*="job-description"]');
      let description = descNode?.textContent?.trim() ?? "";
      const skillItems = document.querySelectorAll(
        '.job-details-how-you-match-card__skills-item, [class*="how-you-match"] li'
      );
      if (skillItems.length > 0) {
        const skillsText = Array.from(skillItems).map((el) => el.textContent?.trim()).filter(Boolean).join(" ");
        description = skillsText + "\n\n" + description;
      }
      if (!title && !description) {
        return null;
      }
      return { title, company, description };
    }
  };

  // src/features/analyzer/keyword.extractor.ts
  var STOP_WORDS = /* @__PURE__ */ new Set([
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "aren't",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can't",
    "cannot",
    "could",
    "couldn't",
    "did",
    "didn't",
    "do",
    "does",
    "doesn't",
    "doing",
    "don't",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "hadn't",
    "has",
    "hasn't",
    "have",
    "haven't",
    "having",
    "he",
    "he'd",
    "he'll",
    "he's",
    "her",
    "here",
    "here's",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "how's",
    "i",
    "i'd",
    "i'll",
    "i'm",
    "i've",
    "if",
    "in",
    "into",
    "is",
    "isn't",
    "it",
    "it's",
    "its",
    "itself",
    "let's",
    "me",
    "more",
    "most",
    "mustn't",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "ought",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "shan't",
    "she",
    "she'd",
    "she'll",
    "she's",
    "should",
    "shouldn't",
    "so",
    "some",
    "such",
    "than",
    "that",
    "that's",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "there's",
    "these",
    "they",
    "they'd",
    "they'll",
    "they're",
    "they've",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "wasn't",
    "we",
    "we'd",
    "we'll",
    "we're",
    "we've",
    "were",
    "weren't",
    "what",
    "what's",
    "when",
    "when's",
    "where",
    "where's",
    "which",
    "while",
    "who",
    "who's",
    "whom",
    "why",
    "why's",
    "with",
    "won't",
    "would",
    "wouldn't",
    "you",
    "you'd",
    "you'll",
    "you're",
    "you've",
    "your",
    "yours",
    "yourself",
    "yourselves"
  ]);
  var KeywordExtractor = class {
    /**
     * Normalizes text by lowercasing and replacing non-alphanumeric (except some tech characters) with spaces.
     */
    static normalize(text) {
      return text.toLowerCase().replace(/[^\w\s+#.-]/g, " ").replace(/\s+/g, " ").trim();
    }
    /**
     * Extracts a unique set of words from a block of text, omitting standard stop words.
     */
    static extractUniqueWords(text) {
      const normalized = this.normalize(text);
      const words = normalized.split(" ");
      const uniqueKeywords = /* @__PURE__ */ new Set();
      for (const word of words) {
        if (word.length > 1 && !STOP_WORDS.has(word)) {
          const cleanWord = word.replace(/^[.#-]+|[.#-]+$/g, "");
          if (cleanWord && !STOP_WORDS.has(cleanWord)) {
            uniqueKeywords.add(cleanWord);
          }
        }
      }
      return uniqueKeywords;
    }
  };

  // src/features/analyzer/matcher.service.ts
  var MatcherService = class {
    /**
     * Determines exact matches by checking if the Profile's listed skills 
     * are present exactly (case-insensitive) in the normalized JD text.
     */
    static calculateMatch(jdText, profile) {
      const jdKeywords = KeywordExtractor.extractUniqueWords(jdText);
      const normalizedJD = KeywordExtractor.normalize(jdText);
      const matched = [];
      const missing = [];
      const userSkills = profile.skills || [];
      if (userSkills.length === 0) {
        return { score: 0, matched: [], missing: [] };
      }
      userSkills.forEach((skill) => {
        const normalizedSkill = KeywordExtractor.normalize(skill);
        const isMultiWord = normalizedSkill.includes(" ");
        if (isMultiWord) {
          if (normalizedJD.includes(normalizedSkill)) {
            matched.push(skill);
          } else {
            missing.push(skill);
          }
        } else {
          if (jdKeywords.has(normalizedSkill)) {
            matched.push(skill);
          } else {
            missing.push(skill);
          }
        }
      });
      const score = Math.round(matched.length / userSkills.length * 100);
      return {
        score,
        matched,
        missing
      };
    }
  };

  // src/features/analyzer/ui/sidebar.ts
  var SidebarUI = class {
    container;
    shadow;
    contentEl;
    constructor() {
      this.container = document.createElement("div");
      this.container.id = "lux-analyzer-sidebar";
      this.container.style.position = "fixed";
      this.container.style.top = "100px";
      this.container.style.right = "0";
      this.container.style.zIndex = "2147483647";
      this.container.style.transition = "transform 0.3s ease-in-out";
      this.shadow = this.container.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `
      :host {
        display: block;
      }
      .panel {
        width: 350px;
        max-height: 80vh;
        background-color: #ffffff;
        box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
      }
      .toggle-btn {
        position: absolute;
        left: -40px;
        top: 20px;
        width: 40px;
        height: 40px;
        background-color: #0073b1;
        color: white;
        border: none;
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
        cursor: pointer;
        box-shadow: -2px 0 5px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        z-index: 2147483647;
      }
      .header {
        padding: 16px;
        background-color: #0073b1;
        color: white;
        border-top-left-radius: 8px;
        flex-shrink: 0;
      }
      .header h2 { margin: 0; font-size: 16px; font-weight: 600; }
      .header p { margin: 4px 0 0; font-size: 14px; opacity: 0.9; }
      .content { padding: 16px; overflow-y: auto; flex-grow: 1; }
      .score-card { text-align: center; padding: 16px; background-color: #f3f2ef; border-radius: 8px; margin-bottom: 16px; }
      .score-value { font-size: 32px; font-weight: bold; color: #0073b1; }
      .score-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
      .skills-section { margin-bottom: 16px; }
      .skills-section h3 { font-size: 14px; margin: 0 0 8px 0; color: #333; }
      .skill-tag { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin: 0 4px 4px 0; font-weight: 500; }
      .skill-tag.matched { background-color: #def1d7; color: #1e5a1b; border: 1px solid #b7e1ad; }
      .skill-tag.missing { background-color: #fbe0e0; color: #a91515; border: 1px solid #f5c2c2; }
    `;
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "toggle-btn";
      toggleBtn.textContent = ">";
      toggleBtn.onclick = () => this.toggle();
      const panel = document.createElement("div");
      panel.className = "panel";
      this.contentEl = document.createElement("div");
      panel.appendChild(this.contentEl);
      this.shadow.appendChild(style);
      this.shadow.appendChild(toggleBtn);
      this.shadow.appendChild(panel);
      document.body.appendChild(this.container);
    }
    toggle() {
      const isCollapsed = this.container.style.transform === "translateX(100%)";
      if (isCollapsed) {
        this.container.style.transform = "translateX(0)";
        this.shadow.querySelector(".toggle-btn").textContent = ">";
      } else {
        this.container.style.transform = "translateX(100%)";
        this.shadow.querySelector(".toggle-btn").textContent = "<";
      }
    }
    render(job, match, isLogged = false) {
      const matchedHtml = match.matched.map((s) => `<span class="skill-tag matched">${s}</span>`).join("");
      const missingHtml = match.missing.map((s) => `<span class="skill-tag missing">${s}</span>`).join("");
      const buttonHtml = isLogged ? `<button disabled style="width: 100%; padding: 12px; background-color: #666; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: not-allowed;">Already Logged</button>` : `<button id="btn-log-app" style="width: 100%; padding: 12px; background-color: #0073b1; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Log Application</button>`;
      this.contentEl.innerHTML = `
      <div class="header">
        <h2>${job.title}</h2>
        <p>${job.company}</p>
      </div>
      <div class="content">
        <div class="score-card">
          <div class="score-value">${match.score}%</div>
          <div class="score-label">Match Score</div>
        </div>
        
        <div class="skills-section">
          <h3>Matched Skills</h3>
          <div>${matchedHtml || '<span style="color: #666; font-size: 12px;">None</span>'}</div>
        </div>

        <div class="skills-section">
          <h3>Missing Skills</h3>
          <div>${missingHtml || '<span style="color: #666; font-size: 12px;">None</span>'}</div>
        </div>

        <div style="margin-top: 20px;">
          ${buttonHtml}
        </div>
      </div>
    `;
      if (!isLogged) {
        this.shadow.getElementById("btn-log-app")?.addEventListener("click", (e) => {
          const btn = e.target;
          btn.textContent = "Saving...";
          btn.disabled = true;
          chrome.runtime.sendMessage({
            type: "LOG_APPLICATION",
            payload: {
              company: job.company || "Unknown Company",
              role: job.title || "Unknown Job",
              jobUrl: job.url || window.location.href.split("?")[0],
              platform: "LinkedIn",
              // matches ApplicationPlatform.LinkedIn
              status: "Applied",
              // matches ApplicationStatus.Applied
              matchScore: match.score,
              appliedAt: (/* @__PURE__ */ new Date()).toISOString(),
              source: "LinkedIn"
            }
          }, (res) => {
            if (res && res.success) {
              btn.textContent = "Already Logged";
              btn.style.backgroundColor = "#666";
              btn.style.cursor = "not-allowed";
            } else {
              btn.textContent = "Error Saving";
              btn.style.backgroundColor = "#d9534f";
              console.error("Failed to log application:", res?.error);
            }
          });
        });
      }
    }
    renderSetupUI() {
      this.contentEl.innerHTML = `
      <div class="header" style="background-color: #d9534f;">
        <h2>Lux Setup Required</h2>
      </div>
      <div class="content" style="text-align: center; margin-top: 20px;">
        <p style="margin-bottom: 20px; color: #333; line-height: 1.5;">Create your profile in the Lux Options page before analyzing jobs.</p>
        <button id="btn-open-options" style="background-color: #0073b1; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">Open Options</button>
      </div>
    `;
      this.shadow.getElementById("btn-open-options")?.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
      });
    }
    destroy() {
      this.container.remove();
    }
  };

  // src/content/analyzer.ts
  var sidebar = null;
  var currentJobKey = "";
  var isAnalyzing = false;
  async function fetchProfile() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "GET_PROFILE" }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(null);
            return;
          }
          resolve(response?.success ? response.data : null);
        });
      } catch {
        resolve(null);
      }
    });
  }
  async function checkLogged(url) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "CHECK_APPLICATION", payload: { jobUrl: url } }, (res) => {
          if (chrome.runtime.lastError) {
            resolve(false);
            return;
          }
          resolve(res?.data || false);
        });
      } catch {
        resolve(false);
      }
    });
  }
  async function analyzeJob() {
    if (isAnalyzing) return;
    isAnalyzing = true;
    try {
      if (!window.location.href.includes("linkedin.com/jobs")) {
        if (sidebar) {
          sidebar.destroy();
          sidebar = null;
          currentJobKey = "";
        }
        return;
      }
      let job = LinkedInExtractor.extract();
      if (!job) {
        await new Promise((r) => setTimeout(r, 1500));
        job = LinkedInExtractor.extract();
      }
      const jobTitle = job?.title || "Unknown Job";
      const jobCompany = job?.company || "Unknown Company";
      const jobKey = jobTitle + "|" + jobCompany;
      if (jobKey === currentJobKey && sidebar) return;
      currentJobKey = jobKey;
      if (!sidebar) {
        sidebar = new SidebarUI();
      }
      let profile = null;
      try {
        profile = await fetchProfile();
      } catch {
      }
      if (!profile) {
        sidebar.renderSetupUI();
        return;
      }
      let match = { score: 0, matched: [], missing: [] };
      try {
        match = MatcherService.calculateMatch(job?.description ?? "", profile);
      } catch {
      }
      const url = window.location.href.split("?")[0] ?? window.location.href;
      let isLogged = false;
      try {
        isLogged = await checkLogged(url);
      } catch {
      }
      const fullJob = {
        title: job?.title || jobTitle,
        company: job?.company || jobCompany,
        description: job?.description || "",
        url
      };
      sidebar.render(fullJob, match, isLogged);
    } finally {
      isAnalyzing = false;
    }
  }
  var jobObserver = null;
  function observeJobContainer() {
    const container = document.querySelector(".jobs-details") || document.querySelector(".job-view-layout") || document.body;
    if (jobObserver) jobObserver.disconnect();
    let debounceTimer;
    jobObserver = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        analyzeJob();
      }, 500);
    });
    jobObserver.observe(container, { childList: true, subtree: true, characterData: true });
  }
  function initAnalyzer() {
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        currentJobKey = "";
        analyzeJob();
        observeJobContainer();
      }
    }).observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      analyzeJob();
      observeJobContainer();
    }, 1e3);
    setTimeout(() => {
      if (!sidebar) analyzeJob();
    }, 3e3);
  }
  initAnalyzer();
})();
