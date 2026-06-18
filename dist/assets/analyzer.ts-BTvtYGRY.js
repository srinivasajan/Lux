var k=Object.defineProperty;var z=(t,e,o)=>e in t?k(t,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):t[e]=o;var h=(t,e,o)=>z(t,typeof e!="symbol"?e+"":e,o);class j{static extract(){var m,a,c;const e=document.querySelector(".job-details-jobs-unified-top-card__job-title")||document.querySelector(".top-card-layout__title")||document.querySelector("h1"),o=document.querySelector(".job-details-jobs-unified-top-card__company-name")||document.querySelector(".topcard__org-name-link")||document.querySelector(".job-details-jobs-unified-top-card__primary-description a"),n=document.getElementById("job-details")||document.querySelector(".jobs-description-content__text")||document.querySelector(".description__text"),r=((m=e==null?void 0:e.textContent)==null?void 0:m.trim())||"",s=((a=o==null?void 0:o.textContent)==null?void 0:a.trim())||"";let i=((c=n==null?void 0:n.textContent)==null?void 0:c.trim())||"";return document.querySelector(".job-details-how-you-match-card__skills-item")&&(i=`${Array.from(document.querySelectorAll(".job-details-how-you-match-card__skills-item")).map(S=>{var g;return(g=S.textContent)==null?void 0:g.trim()}).join(" ")}

${i}`),!r&&!i?null:{title:r,company:s,description:i}}}const x=new Set(["a","about","above","after","again","against","all","am","an","and","any","are","aren't","as","at","be","because","been","before","being","below","between","both","but","by","can't","cannot","could","couldn't","did","didn't","do","does","doesn't","doing","don't","down","during","each","few","for","from","further","had","hadn't","has","hasn't","have","haven't","having","he","he'd","he'll","he's","her","here","here's","hers","herself","him","himself","his","how","how's","i","i'd","i'll","i'm","i've","if","in","into","is","isn't","it","it's","its","itself","let's","me","more","most","mustn't","my","myself","no","nor","not","of","off","on","once","only","or","other","ought","our","ours","ourselves","out","over","own","same","shan't","she","she'd","she'll","she's","should","shouldn't","so","some","such","than","that","that's","the","their","theirs","them","themselves","then","there","there's","these","they","they'd","they'll","they're","they've","this","those","through","to","too","under","until","up","very","was","wasn't","we","we'd","we'll","we're","we've","were","weren't","what","what's","when","when's","where","where's","which","while","who","who's","whom","why","why's","with","won't","would","wouldn't","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves"]);class f{static normalize(e){return e.toLowerCase().replace(/[^\w\s+#.-]/g," ").replace(/\s+/g," ").trim()}static extractUniqueWords(e){const n=this.normalize(e).split(" "),r=new Set;for(const s of n)if(s.length>1&&!x.has(s)){const i=s.replace(/^[.#-]+|[.#-]+$/g,"");i&&!x.has(i)&&r.add(i)}return r}}class _{static calculateMatch(e,o){const n=f.extractUniqueWords(e),r=f.normalize(e),s=[],i=[],d=o.skills||[];return d.length===0?{score:0,matched:[],missing:[]}:(d.forEach(a=>{const c=f.normalize(a);c.includes(" ")?r.includes(c)?s.push(a):i.push(a):n.has(c)?s.push(a):i.push(a)}),{score:Math.round(s.length/d.length*100),matched:s,missing:i})}}class E{constructor(){h(this,"container");h(this,"shadow");h(this,"contentEl");this.container=document.createElement("div"),this.container.id="lux-analyzer-sidebar",this.container.style.position="fixed",this.container.style.top="100px",this.container.style.right="0",this.container.style.zIndex="2147483647",this.container.style.transition="transform 0.3s ease-in-out",this.shadow=this.container.attachShadow({mode:"open"});const e=document.createElement("style");e.textContent=`
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
    `;const o=document.createElement("button");o.className="toggle-btn",o.textContent=">",o.onclick=()=>this.toggle();const n=document.createElement("div");n.className="panel",this.contentEl=document.createElement("div"),n.appendChild(this.contentEl),this.shadow.appendChild(e),this.shadow.appendChild(o),this.shadow.appendChild(n),document.body.appendChild(this.container)}toggle(){this.container.style.transform==="translateX(100%)"?(this.container.style.transform="translateX(0)",this.shadow.querySelector(".toggle-btn").textContent=">"):(this.container.style.transform="translateX(100%)",this.shadow.querySelector(".toggle-btn").textContent="<")}render(e,o){const n=o.matched.map(s=>`<span class="skill-tag matched">${s}</span>`).join(""),r=o.missing.map(s=>`<span class="skill-tag missing">${s}</span>`).join("");this.contentEl.innerHTML=`
      <div class="header">
        <h2>${e.title}</h2>
        <p>${e.company}</p>
      </div>
      <div class="content">
        <div class="score-card">
          <div class="score-value">${o.score}%</div>
          <div class="score-label">Match Score</div>
        </div>
        
        <div class="skills-section">
          <h3>Matched Skills</h3>
          <div>${n||'<span style="color: #666; font-size: 12px;">None</span>'}</div>
        </div>

        <div class="skills-section">
          <h3>Missing Skills</h3>
          <div>${r||'<span style="color: #666; font-size: 12px;">None</span>'}</div>
        </div>
      </div>
    `}renderSetupUI(){var e;this.contentEl.innerHTML=`
      <div class="header" style="background-color: #d9534f;">
        <h2>Lux Setup Required</h2>
      </div>
      <div class="content" style="text-align: center; margin-top: 20px;">
        <p style="margin-bottom: 20px; color: #333; line-height: 1.5;">Create your profile in the Lux Options page before analyzing jobs.</p>
        <button id="btn-open-options" style="background-color: #0073b1; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">Open Options</button>
      </div>
    `,(e=this.shadow.getElementById("btn-open-options"))==null||e.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_OPTIONS"})})}destroy(){this.container.remove()}}let l=null,p="",b=!1;async function q(){return new Promise(t=>{chrome.runtime.sendMessage({type:"GET_PROFILE"},e=>{e&&e.success?t(e.data):t(null)})})}async function y(){if(!b){b=!0;try{if(!window.location.href.includes("linkedin.com/jobs")){l&&(l.destroy(),l=null,p="");return}const t=j.extract();if(!t)return;const e=t.title+"|"+t.company;if(e===p&&l)return;p=e,l||(l=new E);const o=await q();if(!o||!o.personal.name){l.renderSetupUI();return}const n=_.calculateMatch(t.description,o);l.render(t,n)}finally{b=!1}}}let u=null;function w(){const t=document.querySelector(".jobs-details")||document.querySelector(".job-view-layout");if(!t)return;u&&u.disconnect();let e;u=new MutationObserver(()=>{clearTimeout(e),e=setTimeout(()=>{y()},500)}),u.observe(t,{childList:!0,subtree:!0,characterData:!0})}function C(){let t=location.href;new MutationObserver(()=>{location.href!==t&&(t=location.href,p="",y(),w())}).observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{y(),w()},1e3)}C();export{C as initAnalyzer};
