import"./modulepreload-polyfill-B5Qt9EMX.js";import{P as p}from"./profile.service-DdFAZ5jv.js";import{Z as A}from"./schemas-BiSfgbmu.js";const E={dailyApplicationLimit:100};class S{static async getSettings(){return typeof chrome>"u"||!chrome.storage||!chrome.storage.local?{...E}:new Promise(s=>{chrome.storage.local.get(["settings"],i=>{const r=i.settings;s({...E,...r||{}})})})}static async updateSettings(s){if(typeof chrome>"u"||!chrome.storage||!chrome.storage.local)return;const r={...await this.getSettings(),...s};return new Promise(o=>{chrome.storage.local.set({settings:r},()=>o())})}}async function $(){var g,b,f;const d=document.getElementById("profile-form"),s=document.getElementById("btn-delete"),i=document.getElementById("alert-box"),r=document.getElementById("education-container"),o=document.getElementById("experience-container"),m=document.getElementById("projects-container");function c(e,t){i.textContent=e,i.className=`alert alert-${t}`,setTimeout(()=>{i.className="alert hidden"},5e3)}function u(e){var a;const t=document.createElement("div");t.className="dynamic-entry",t.innerHTML=`
      <div class="dynamic-entry-header">
        <button type="button" class="btn btn-danger btn-sm btn-remove">Remove</button>
      </div>
      <div class="form-group">
        <label>Degree *</label>
        <input type="text" name="edu-degree" value="${(e==null?void 0:e.degree)||""}" required>
      </div>
      <div class="form-group">
        <label>University *</label>
        <input type="text" name="edu-university" value="${(e==null?void 0:e.university)||""}" required>
      </div>
      <div class="form-group">
        <label>CGPA</label>
        <input type="text" name="edu-cgpa" value="${(e==null?void 0:e.cgpa)||""}">
      </div>
      <div class="form-group">
        <label>Graduation Year</label>
        <input type="text" name="edu-year" value="${(e==null?void 0:e.year)||""}">
      </div>
    `,(a=t.querySelector(".btn-remove"))==null||a.addEventListener("click",()=>t.remove()),r.appendChild(t)}function v(e){var a;const t=document.createElement("div");t.className="dynamic-entry",t.innerHTML=`
      <div class="dynamic-entry-header">
        <button type="button" class="btn btn-danger btn-sm btn-remove">Remove</button>
      </div>
      <div class="form-group">
        <label>Company *</label>
        <input type="text" name="exp-company" value="${(e==null?void 0:e.company)||""}" required>
      </div>
      <div class="form-group">
        <label>Role *</label>
        <input type="text" name="exp-role" value="${(e==null?void 0:e.role)||""}" required>
      </div>
      <div class="form-group">
        <label>Duration *</label>
        <input type="text" name="exp-duration" value="${(e==null?void 0:e.duration)||""}" required>
      </div>
      <div class="form-group">
        <label>Bullet Points (One per line) *</label>
        <textarea name="exp-bullets" rows="4" required>${((e==null?void 0:e.bullets)||[]).join(`
`)}</textarea>
      </div>
    `,(a=t.querySelector(".btn-remove"))==null||a.addEventListener("click",()=>t.remove()),o.appendChild(t)}function y(e){var a;const t=document.createElement("div");t.className="dynamic-entry",t.innerHTML=`
      <div class="dynamic-entry-header">
        <button type="button" class="btn btn-danger btn-sm btn-remove">Remove</button>
      </div>
      <div class="form-group">
        <label>Title *</label>
        <input type="text" name="proj-title" value="${(e==null?void 0:e.title)||""}" required>
      </div>
      <div class="form-group">
        <label>Description *</label>
        <textarea name="proj-description" rows="3" required>${(e==null?void 0:e.description)||""}</textarea>
      </div>
      <div class="form-group">
        <label>Tech Stack (Comma separated)</label>
        <input type="text" name="proj-stack" value="${((e==null?void 0:e.stack)||[]).join(", ")}">
      </div>
      <div class="form-group">
        <label>Link URL</label>
        <input type="url" name="proj-link" value="${(e==null?void 0:e.link)||""}">
      </div>
    `,(a=t.querySelector(".btn-remove"))==null||a.addEventListener("click",()=>t.remove()),m.appendChild(t)}(g=document.getElementById("btn-add-education"))==null||g.addEventListener("click",()=>u()),(b=document.getElementById("btn-add-experience"))==null||b.addEventListener("click",()=>v()),(f=document.getElementById("btn-add-project"))==null||f.addEventListener("click",()=>y());async function k(){try{const e=await p.getProfile();e&&(document.getElementById("name").value=e.personal.name,document.getElementById("email").value=e.personal.email,document.getElementById("phone").value=e.personal.phone||"",document.getElementById("linkedin").value=e.personal.linkedin||"",document.getElementById("github").value=e.personal.github||"",document.getElementById("portfolio").value=e.personal.portfolio||"",document.getElementById("skills").value=e.skills.join(", "),e.education.forEach(a=>u(a)),e.experience.forEach(a=>v(a)),e.projects.forEach(a=>y(a))),r.children.length===0&&u(),o.children.length===0&&v(),m.children.length===0&&y();const t=await S.getSettings();document.getElementById("dailyLimit").value=t.dailyApplicationLimit.toString()}catch(e){console.error(e),c("Failed to load profile data.","error")}}d.addEventListener("submit",async e=>{var h;e.preventDefault();const t=new FormData(d),a=t.get("skills"),q=a?a.split(",").map(n=>n.trim()).filter(n=>n):[],L=Array.from(r.querySelectorAll(".dynamic-entry")).map(n=>({degree:n.querySelector('[name="edu-degree"]').value,university:n.querySelector('[name="edu-university"]').value,cgpa:n.querySelector('[name="edu-cgpa"]').value,year:n.querySelector('[name="edu-year"]').value})),B=Array.from(o.querySelectorAll(".dynamic-entry")).map(n=>({company:n.querySelector('[name="exp-company"]').value,role:n.querySelector('[name="exp-role"]').value,duration:n.querySelector('[name="exp-duration"]').value,bullets:n.querySelector('[name="exp-bullets"]').value.split(`
`).map(l=>l.trim()).filter(l=>l)})),I=Array.from(m.querySelectorAll(".dynamic-entry")).map(n=>({title:n.querySelector('[name="proj-title"]').value,description:n.querySelector('[name="proj-description"]').value,stack:n.querySelector('[name="proj-stack"]').value.split(",").map(l=>l.trim()).filter(l=>l),link:n.querySelector('[name="proj-link"]').value})),w={personal:{name:t.get("name"),email:t.get("email"),phone:t.get("phone"),linkedin:t.get("linkedin"),github:t.get("github"),portfolio:t.get("portfolio")},skills:q,education:L,experience:B,projects:I};try{await p.saveProfile(w),await S.updateSettings({dailyApplicationLimit:parseInt(t.get("dailyLimit"),10)}),c("Profile saved successfully!","success")}catch(n){n instanceof A?c(`Validation Error: ${(h=n.issues[0])==null?void 0:h.message}`,"error"):(c("An unexpected error occurred.","error"),console.error(n))}}),s.addEventListener("click",async()=>{if(confirm("Are you sure you want to delete your profile? This cannot be undone."))try{await p.deleteProfile(),d.reset(),r.innerHTML="",o.innerHTML="",m.innerHTML="",u(),v(),y(),c("Profile deleted.","success")}catch(e){console.error(e),c("Failed to delete profile.","error")}}),await k()}document.addEventListener("DOMContentLoaded",$);
