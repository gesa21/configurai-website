/* =====================================================================
   ConfigurAI assessment popup
   Self-contained. Include once per page with:
     <script src="/configurai-assessment.js" defer></script>

   Triggers: desktop = exit-intent OR 20s (whichever first).
             mobile  = 10s on page.
   Shows once per visitor (suppressed for 30 days after it is seen).
   Does not run on the paths listed in EXCLUDE_PATHS.
   ===================================================================== */
(function () {
  "use strict";

  // ---- CONFIG -------------------------------------------------------
  // Replace with your deployed Cloudflare Worker URL before going live.
  var WORKER_URL = "https://configurai-beehiiv.orgesa-meli.workers.dev";

  // Pages the popup must NOT appear on (never interrupt a buyer).
  var EXCLUDE_PATHS = [
    "professionals-audit",
    "business-owners-audit",
    "checkout",
    "thank-you",
    "booking"
  ];

  var DESKTOP_DELAY_MS = 3000; // 3 seconds
  var MOBILE_DELAY_MS  = 3000; // 3 seconds
  var SUPPRESS_DAYS    = 30;    // do not show again for this many days
  var STORAGE_KEY      = "cfg_assessment_seen_at";

  // ---- GUARDS -------------------------------------------------------
  var path = window.location.pathname.toLowerCase();
  for (var i = 0; i < EXCLUDE_PATHS.length; i++) {
    if (path.indexOf(EXCLUDE_PATHS[i]) !== -1) return;
  }
  try {
    var seenAt = localStorage.getItem(STORAGE_KEY);
    if (seenAt && (Date.now() - parseInt(seenAt, 10)) < SUPPRESS_DAYS * 864e5) return;
  } catch (e) { /* localStorage blocked, continue */ }

  var isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  var shown = false;

  // ---- STYLES -------------------------------------------------------
  var css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap');
  #cfgBackdrop{position:fixed;inset:0;background:rgba(13,27,42,0.55);backdrop-filter:blur(2px);z-index:99999;display:none;align-items:center;justify-content:center;padding:20px;font-family:'Barlow',sans-serif;}
  #cfgBackdrop.show{display:flex;animation:cfgBgFade .4s ease;}
  @keyframes cfgBgFade{from{opacity:0}to{opacity:1}}
  .cfg-overlay{position:relative;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;background:#FFFFFF;border-radius:4px;box-shadow:0 30px 80px rgba(13,27,42,0.4);animation:cfgRise .55s cubic-bezier(.16,1,.3,1);}
  @keyframes cfgRise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  .cfg-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border:none;background:transparent;color:#FFFFFF;font-size:24px;cursor:pointer;opacity:.7;z-index:5;line-height:1;}
  .cfg-close:hover{opacity:1;}
  .cfg-top{background:#0D1B2A;padding:26px 34px 22px;color:#FFFFFF;}
  .cfg-eyebrow{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#D5FF4D;margin-bottom:10px;}
  .cfg-headline{font-family:'Bebas Neue',sans-serif;font-size:38px;line-height:.98;letter-spacing:.5px;}
  .cfg-sub{font-size:14.5px;color:#DCEAE8;margin-top:12px;line-height:1.45;max-width:92%;}
  .cfg-progress{height:3px;background:rgba(255,255,255,.12);margin-top:22px;border-radius:2px;overflow:hidden;}
  .cfg-progress-bar{height:100%;background:#D5FF4D;width:0;transition:width .5s cubic-bezier(.16,1,.3,1);}
  .cfg-body{padding:30px 34px 34px;}
  .cfg-step{display:none;animation:cfgFade .45s ease;}
  .cfg-step.active{display:block;}
  @keyframes cfgFade{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
  .cfg-q-count{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(13,27,42,.55);margin-bottom:12px;}
  .cfg-question{font-size:21px;font-weight:600;color:#0D1B2A;line-height:1.25;margin-bottom:22px;}
  .cfg-option{display:block;width:100%;text-align:left;background:#FFFFFF;border:1.5px solid rgba(13,27,42,.12);border-radius:3px;padding:15px 18px;margin-bottom:10px;font-family:'Barlow',sans-serif;font-size:15.5px;color:#0D1B2A;cursor:pointer;transition:all .18s ease;}
  .cfg-option:hover{border-color:#0D1B2A;transform:translateX(3px);}
  .cfg-option.chosen{border-color:#0D1B2A;background:#0D1B2A;color:#FFFFFF;}
  .cfg-field-label{font-size:13px;font-weight:600;color:#0D1B2A;margin-bottom:7px;display:block;}
  .cfg-input{width:100%;padding:14px 16px;border:1.5px solid rgba(13,27,42,.12);border-radius:3px;font-family:'Barlow',sans-serif;font-size:15.5px;color:#0D1B2A;margin-bottom:16px;background:#FFFFFF;}
  .cfg-input:focus{outline:none;border-color:#0D1B2A;}
  .cfg-input::placeholder{color:rgba(13,27,42,.35);}
  .cfg-cta{width:100%;background:#D5FF4D;color:#0D1B2A;border:none;border-radius:3px;padding:16px;font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:1px;cursor:pointer;transition:transform .15s,filter .15s;}
  .cfg-cta:hover{filter:brightness(.94);transform:translateY(-1px);}
  .cfg-cta:disabled{opacity:.4;cursor:not-allowed;transform:none;}
  .cfg-privacy{font-size:12px;color:rgba(13,27,42,.55);text-align:center;margin-top:14px;line-height:1.4;}
  .cfg-result-eyebrow{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(13,27,42,.55);margin-bottom:10px;}
  .cfg-result-headline{font-size:20px;font-weight:700;color:#0D1B2A;line-height:1.3;margin-bottom:16px;}
  .cfg-result-body{font-size:15px;color:#0D1B2A;line-height:1.6;margin-bottom:16px;}
  .cfg-result-card{background:#DCEAE8;border-radius:3px;padding:18px 20px;margin-bottom:22px;}
  .cfg-result-card-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0D1B2A;opacity:.65;margin-bottom:8px;}
  .cfg-result-card-text{font-size:15px;color:#0D1B2A;line-height:1.55;font-weight:500;}
  .cfg-recs-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(13,27,42,.55);margin-bottom:14px;}
  .cfg-rec{display:block;text-decoration:none;border:1.5px solid rgba(13,27,42,.12);border-radius:3px;padding:16px 18px;margin-bottom:10px;transition:all .18s ease;}
  .cfg-rec:hover{border-color:#0D1B2A;transform:translateX(3px);}
  .cfg-rec.best{border-color:#0D1B2A;background:#0D1B2A;}
  .cfg-rec-tag{display:inline-block;background:#D5FF4D;color:#0D1B2A;font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:2px;margin-bottom:9px;}
  .cfg-rec-name{font-size:15.5px;font-weight:700;color:#0D1B2A;margin-bottom:5px;line-height:1.25;}
  .cfg-rec.best .cfg-rec-name{color:#FFFFFF;}
  .cfg-rec-desc{font-size:13.5px;color:rgba(13,27,42,.55);line-height:1.45;}
  .cfg-rec.best .cfg-rec-desc{color:#DCEAE8;}
  .cfg-rec-arrow{color:#0D1B2A;font-weight:700;}
  .cfg-rec.best .cfg-rec-arrow{color:#D5FF4D;}
  .cfg-secondary{display:block;text-align:center;margin-top:14px;font-size:13px;color:rgba(13,27,42,.55);cursor:pointer;background:none;border:none;width:100%;font-family:'Barlow',sans-serif;}
  .cfg-secondary:hover{color:#0D1B2A;}
  @media(max-width:480px){.cfg-headline{font-size:32px}.cfg-top{padding:22px 24px 18px}.cfg-body{padding:24px 24px 28px}.cfg-question{font-size:19px}}
  `;

  // ---- MARKUP -------------------------------------------------------
  var html = `
  <div class="cfg-overlay" id="cfgModal" role="dialog" aria-modal="true" aria-label="AI assessment">
    <button class="cfg-close" id="cfgCloseBtn" aria-label="Close">&times;</button>
    <div class="cfg-top">
      <div class="cfg-eyebrow">ConfigurAI</div>
      <div class="cfg-headline">Where could AI actually help you?</div>
      <div class="cfg-sub">A one minute assessment. Four questions about your work, and a straight answer on where AI would genuinely save you time.</div>
      <div class="cfg-progress"><div class="cfg-progress-bar" id="cfgBar"></div></div>
    </div>
    <div class="cfg-body">
      <div class="cfg-step active" id="step-intro">
        <div class="cfg-question">Just answer four quick questions and I will show you where the real opportunity is.</div>
        <button class="cfg-cta" id="cfgStartBtn">Start the assessment</button>
      </div>
      <div class="cfg-step" id="step-q1">
        <div class="cfg-q-count">Question 1 of 4</div>
        <div class="cfg-question">First, which sounds more like you?</div>
        <button class="cfg-option" data-k="segment" data-v="pro">I am employed, in a role at a company</button>
        <button class="cfg-option" data-k="segment" data-v="owner">I run my own business, or work for myself</button>
      </div>
      <div class="cfg-step" id="step-q2">
        <div class="cfg-q-count">Question 2 of 4</div>
        <div class="cfg-question">Of these, which quietly eats the most of your time?</div>
        <button class="cfg-option" data-k="drain" data-v="reporting">Repetitive reporting or pulling data together</button>
        <button class="cfg-option" data-k="drain" data-v="writing">Writing emails, documents or proposals</button>
        <button class="cfg-option" data-k="drain" data-v="research">Research and finding the right information</button>
        <button class="cfg-option" data-k="drain" data-v="meetings">Meetings, notes and chasing follow ups</button>
      </div>
      <div class="cfg-step" id="step-q3">
        <div class="cfg-q-count">Question 3 of 4</div>
        <div class="cfg-question">How would you honestly describe where you are with AI tools today?</div>
        <button class="cfg-option" data-k="level" data-v="never">Never really used them</button>
        <button class="cfg-option" data-k="level" data-v="tried">Tried ChatGPT, Claude or other tools, found them a bit underwhelming</button>
        <button class="cfg-option" data-k="level" data-v="sometimes">Use them now and then for small things</button>
        <button class="cfg-option" data-k="level" data-v="regular">Use them regularly, but suspect I am scratching the surface</button>
      </div>
      <div class="cfg-step" id="step-q4">
        <div class="cfg-q-count">Question 4 of 4</div>
        <div class="cfg-question">If AI gave you back a few hours each week, what would that time be for?</div>
        <button class="cfg-option" data-k="goal" data-v="highervalue">Higher value work I never get to</button>
        <button class="cfg-option" data-k="goal" data-v="overtime">Fewer late nights and less overtime</button>
        <button class="cfg-option" data-k="goal" data-v="grow">Growing the business</button>
        <button class="cfg-option" data-k="goal" data-v="breathe">Honestly, just room to breathe</button>
      </div>
      <div class="cfg-step" id="step-email">
        <div class="cfg-q-count">Almost there</div>
        <div class="cfg-question">Your result is ready.</div>
        <p class="cfg-result-body" style="margin-bottom:18px;">Add your name and email to see it. You will also join my occasional notes on AI, the kind that are genuinely worth your time.</p>
        <label class="cfg-field-label" for="cfgName">Your name</label>
        <input class="cfg-input" type="text" id="cfgName" placeholder="Your name">
        <label class="cfg-field-label" for="cfgEmail">Email</label>
        <input class="cfg-input" type="email" id="cfgEmail" placeholder="Your email address">
        <button class="cfg-cta" id="cfgSubmit" disabled>Show me my results</button>
        <p class="cfg-privacy">No noise, and you can unsubscribe whenever you like.</p>
      </div>
      <div class="cfg-step" id="step-result">
        <div class="cfg-result-eyebrow">Your assessment</div>
        <div class="cfg-result-headline" id="cfgResultHeadline"></div>
        <div class="cfg-result-body" id="cfgResultBody"></div>
        <div class="cfg-result-card">
          <div class="cfg-result-card-label">Where to start</div>
          <div class="cfg-result-card-text" id="cfgResultCard"></div>
        </div>
        <div class="cfg-recs-label">How I can help you take it further</div>
        <div id="cfgRecs"></div>
        <button class="cfg-secondary" id="cfgCloseResult">Close</button>
      </div>
    </div>
  </div>`;

  // ---- INJECT -------------------------------------------------------
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var backdrop = document.createElement("div");
  backdrop.id = "cfgBackdrop";
  backdrop.innerHTML = html;
  document.body.appendChild(backdrop);

  // ---- STATE + LOGIC ------------------------------------------------
  var state = { segment: null, drain: null, level: null, goal: null, name: "", email: "" };
  var steps = ["step-intro","step-q1","step-q2","step-q3","step-q4","step-email","step-result"];
  var idx = 0;
  var progress = { "step-intro":0,"step-q1":20,"step-q2":40,"step-q3":60,"step-q4":80,"step-email":92,"step-result":100 };

  function $(id){ return document.getElementById(id); }
  function showStep(id){
    var all = backdrop.querySelectorAll(".cfg-step");
    for (var j=0;j<all.length;j++) all[j].classList.remove("active");
    $(id).classList.add("active");
    $("cfgBar").style.width = progress[id] + "%";
  }
  function openModal(){
    if (shown) return;
    shown = true;
    backdrop.classList.add("show");
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch(e){}
  }
  function closeModal(){ backdrop.classList.remove("show"); }

  $("cfgStartBtn").addEventListener("click", function(){ idx=1; showStep("step-q1"); });
  $("cfgCloseBtn").addEventListener("click", closeModal);
  $("cfgCloseResult").addEventListener("click", closeModal);
  backdrop.addEventListener("click", function(e){ if (e.target === backdrop) closeModal(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeModal(); });

  var opts = backdrop.querySelectorAll(".cfg-option");
  for (var k=0;k<opts.length;k++){
    opts[k].addEventListener("click", function(){
      state[this.getAttribute("data-k")] = this.getAttribute("data-v");
      var sibs = this.parentElement.querySelectorAll(".cfg-option");
      for (var s=0;s<sibs.length;s++) sibs[s].classList.remove("chosen");
      this.classList.add("chosen");
      var self = this;
      setTimeout(function(){ idx++; showStep(steps[idx]); }, 280);
    });
  }

  function validate(){
    var n = $("cfgName").value.trim();
    var em = $("cfgEmail").value.trim();
    var ok = n.length > 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em);
    $("cfgSubmit").disabled = !ok;
  }
  $("cfgName").addEventListener("input", validate);
  $("cfgEmail").addEventListener("input", validate);

  $("cfgSubmit").addEventListener("click", function(){
    state.name = $("cfgName").value.trim();
    state.email = $("cfgEmail").value.trim();
    $("cfgSubmit").disabled = true;
    $("cfgSubmit").textContent = "One moment...";

    // Send to the Cloudflare Worker (which adds them to Beehiiv).
    // We show the result regardless, so a network hiccup never blocks the user.
    fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    }).catch(function(){ /* ignore, result still shows */ });

    buildResult();
    idx = 6;
    showStep("step-result");
  });

  function buildResult(){
    var drainCopy = {
      reporting:{head:"Your biggest AI opportunity is in reporting and data work.",body:"Reporting is one of the highest-impact places to start, because the work is repetitive, rule-based, and eats hours that should go elsewhere. The professionals I work with usually reclaim several hours a week here once the right setup is in place.",card:"Begin with the report you rebuild most often. That single workflow is almost always where the first real time saving appears."},
      writing:{head:"Your biggest AI opportunity is in writing and documents.",body:"Emails, proposals and documents are where AI is genuinely strong right now, not to replace your judgement, but to remove the blank-page time and the second drafts. Done well, it gives you back the part of writing that is pure friction.",card:"Start with the type of document you write most often. Build one reliable approach for it, then reuse it."},
      research:{head:"Your biggest AI opportunity is in research and finding information.",body:"Gathering and making sense of information is slow manual work, and it is exactly where AI can compress hours into minutes when it is set up properly rather than used as a search box.",card:"Pick one recurring question you always end up researching. That is the place to build your first proper workflow."},
      meetings:{head:"Your biggest AI opportunity is around meetings and follow ups.",body:"Notes, actions and the endless chasing afterwards are quiet time drains. This is one of the easiest areas to fix, and the relief is immediate because it removes work you never wanted to be doing.",card:"Start with your meeting notes and follow-up actions. It is the quickest win and the one you feel straight away."}
    };
    var levelNudge = {
      never:" Starting from scratch is genuinely an advantage here, because you will learn it the right way rather than unlearning bad habits.",
      tried:" If those tools underwhelmed you, that usually means the approach was wrong, not the tool. The difference is in how you set it up.",
      sometimes:" You already have a foothold, the opportunity now is turning the occasional use into a reliable system.",
      regular:" You are further along than most, so the gain for you is depth, the workflows that go well beyond everyday prompts."
    };
    var d = drainCopy[state.drain] || drainCopy.reporting;
    $("cfgResultHeadline").textContent = d.head;
    $("cfgResultBody").textContent = d.body + (levelNudge[state.level] || "");
    $("cfgResultCard").textContent = d.card;
    buildRecs();
  }

  function buildRecs(){
    var owner = state.segment === "owner";
    var audit = { name: owner ? "Business Owner AI Audit" : "Professional AI Audit",
      desc: owner ? "A call about your business, then a written plan of where AI recovers time and revenue, and a follow-up to get it running."
                  : "A call about your actual work, then a written plan of exactly where AI saves you time, and a follow-up to get it running.",
      url: owner ? "https://configurai.com/business-owners-audit.html" : "https://configurai.com/professionals-audit.html" };
    var cohort = { name: owner ? "The Cohort: AI Systems for Business Growth" : "The Cohort: Applied AI Leadership and Automation",
      desc: owner ? "A six-week programme to build AI systems that quietly run more of your operations."
                  : "A six-week applied programme to make AI a genuine, confident part of how you work.",
      url: owner ? "https://configurai.com/business-owners.html" : "https://configurai.com/professionals.html" };
    var membership = { name: "AI Workflow Insiders",
      desc: "My community. Each week I rebuild a real member workflow on video, plus working prompts, tool updates, and a monthly live call.",
      url: "https://www.skool.com/ai-workflow-insiders-2123/about" };

    var beginner = (state.level === "never" || state.level === "tried");
    var ordered = beginner ? [cohort, audit, membership] : [audit, cohort, membership];

    var c = $("cfgRecs");
    c.innerHTML = "";
    ordered.forEach(function(srv, n){
      var a = document.createElement("a");
      a.href = srv.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.className = "cfg-rec" + (n === 0 ? " best" : "");
      a.innerHTML = (n === 0 ? '<span class="cfg-rec-tag">Best fit for you</span><br>' : "") +
        '<div class="cfg-rec-name">' + srv.name + '</div>' +
        '<div class="cfg-rec-desc">' + srv.desc + ' <span class="cfg-rec-arrow">&rarr;</span></div>';
      c.appendChild(a);
    });
  }

  // ---- TRIGGERS -----------------------------------------------------
  if (isMobile) {
    setTimeout(openModal, MOBILE_DELAY_MS);
  } else {
    setTimeout(openModal, DESKTOP_DELAY_MS);
    document.addEventListener("mouseout", function(e){
      if (!e.relatedTarget && e.clientY <= 0) openModal();
    });
  }
})();
