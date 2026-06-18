import type { MatchResult } from '../matcher.service';
import type { ExtractedJob } from '../linkedin.extractor';

export class SidebarUI {
  private container: HTMLElement;
  private shadow: ShadowRoot;
  private contentEl: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'lux-analyzer-sidebar';
    // Position fixed outside shadow so it anchors to document body correctly
    this.container.style.position = 'fixed';
    this.container.style.top = '100px';
    this.container.style.right = '0';
    this.container.style.zIndex = '2147483647';
    this.container.style.transition = 'transform 0.3s ease-in-out';
    
    this.shadow = this.container.attachShadow({ mode: 'open' });

    // Include CSS inline for simplicity and to ensure it works via Content Script securely.
    // Normally we'd import CSS as a string if using Vite ?inline plugin, 
    // but for vanilla TS we can just set innerHTML of a style tag to be bulletproof.
    const style = document.createElement('style');
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

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.textContent = '>';
    toggleBtn.onclick = () => this.toggle();

    const panel = document.createElement('div');
    panel.className = 'panel';

    this.contentEl = document.createElement('div');
    panel.appendChild(this.contentEl);

    this.shadow.appendChild(style);
    this.shadow.appendChild(toggleBtn);
    this.shadow.appendChild(panel);

    document.body.appendChild(this.container);
  }

  toggle() {
    const isCollapsed = this.container.style.transform === 'translateX(100%)';
    if (isCollapsed) {
      this.container.style.transform = 'translateX(0)';
      this.shadow.querySelector('.toggle-btn')!.textContent = '>';
    } else {
      this.container.style.transform = 'translateX(100%)';
      this.shadow.querySelector('.toggle-btn')!.textContent = '<';
    }
  }

  render(job: ExtractedJob, match: MatchResult) {
    const matchedHtml = match.matched.map(s => `<span class="skill-tag matched">${s}</span>`).join('');
    const missingHtml = match.missing.map(s => `<span class="skill-tag missing">${s}</span>`).join('');

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
      </div>
    `;
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

    this.shadow.getElementById('btn-open-options')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
    });
  }

  destroy() {
    this.container.remove();
  }
}
