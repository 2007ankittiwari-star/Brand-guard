
/* =========================================
   BRANDGUARD — DEMO AUDIT ENGINE
   Local frontend only. No AI API or backend.
   ========================================= */

"use strict";

const $ = (selector) => document.querySelector(selector);

const originalExample = `Meet the new FitFuel Vanilla Protein!

Get 50 grams of protein in every serving and guarantee muscle growth in just 7 days.

Made for your everyday fitness routine. Try our vanilla protein today!`;

const approvedFacts = [
  {
    id: "F-001",
    text: "FitFuel Vanilla Protein contains 20 grams of protein per serving.",
    source: "Approved product specification"
  },
  {
    id: "F-002",
    text: "FitFuel Vanilla Protein is available in vanilla flavour.",
    source: "Approved product catalogue"
  },
  {
    id: "F-003",
    text: "The product contains 2 grams of sugar per serving.",
    source: "Approved nutrition label"
  },
  {
    id: "F-004",
    text: "The product is intended for everyday fitness routines.",
    source: "Approved brand description"
  },
  {
    id: "F-005",
    text: "The product is sold in a 1 kg package.",
    source: "Approved product catalogue"
  },
  {
    id: "F-006",
    text: "The recommended serving size is 30 grams.",
    source: "Approved product specification"
  },
  {
    id: "F-007",
    text: "The product is available through the official FitFuel store.",
    source: "Approved sales information"
  },
  {
    id: "F-008",
    text: "The brand voice should be clear, friendly, and professional.",
    source: "Brand voice guidelines"
  }
];

const state = {
  findings: [],
  auditComplete: false,
  acceptedRevision: false,
  overridden: false,
  submitted: false,
  decision: "Draft",
  originalDraft: "",
  suggestedDraft: "",
  history: [],
  currentDocument: "FitFuel — Launch announcement"
};

let toastTimer;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2800);
}

function addHistory(title, detail) {
  state.history.unshift({
    title,
    detail,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  renderHistory();
  saveReviewHistory();
}

const HISTORY_STORAGE_KEY = "brandguard_review_history";

function saveReviewHistory() {
  try {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(state.history)
    );
  } catch (error) {
    console.error("Could not save review history:", error);
  }
}

function loadReviewHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);

    if (saved) {
      const history = JSON.parse(saved);

      if (Array.isArray(history)) {
        state.history = history;
      }
    }
  } catch (error) {
    console.error("Could not load review history:", error);
  }
}


function updateWordCount() {
  const text = $("#draft-text").value.trim();
  const count = text ? text.split(/\s+/).length : 0;
  $("#word-count").textContent = `${count} words`;
}

function updateStatus(status) {
  state.decision = status;

  $("#review-status").innerHTML = `
    <span class="status-dot"></span>
    ${escapeHTML(status)}
  `;

  $("#metric-status").textContent = status;
  $("#reviewer-state").textContent = status;
}

function resetReviewState() {
  state.findings = [];
  state.auditComplete = false;
  state.acceptedRevision = false;
  state.overridden = false;
  state.submitted = false;
  state.originalDraft = "";
  state.suggestedDraft = "";
  state.currentDocument = $("#document-title").value.trim() || "Untitled draft";

  $("#finding-count").textContent = "—";
  $("#findings-badge").textContent = "—";
  $("#last-audit").textContent = "Not yet audited";

  $("#audit-summary").innerHTML = `
    <div class="summary-symbol">↳</div>
    <div>
      <strong>Ready for review</strong>
      <p>Run an audit to inspect claims against approved brand facts and guidelines.</p>
    </div>
  `;

  $("#findings-list").innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⌕</div>
      <strong>Your evidence will appear here.</strong>
      <p>Audit the draft to see claim-level findings, source references, and suggested edits.</p>
    </div>
  `;

  $("#original-preview").textContent =
    "Run an audit to compare the original with a suggested revision.";

  $("#suggested-preview").textContent =
    "Your suggested revision will appear here.";

  $("#revision-note").textContent = "Suggestions require human review.";
  $("#accept-button").disabled = true;
  $("#keep-button").disabled = true;
  $("#submit-button").disabled = true;
  $("#approve-button").disabled = true;
  $("#return-button").disabled = true;
  $("#review-comment").value = "";
  $("#approval-message").textContent =
    "Complete the audit and review the draft before requesting approval.";

  updateStatus("Draft");
}

/* -----------------------------------------
   Rule-based content audit
   ----------------------------------------- */
async function runAudit() {
  const draft = $("#draft-text").value.trim();

  if (!draft) {
    showToast("Add some content before running the audit.");
    $("#draft-text").focus();
    return;
  }

  const auditButton = $("#audit-button");
  const originalButtonText = auditButton.textContent;

  auditButton.disabled = true;
  auditButton.textContent = "Auditing with AI...";

  try {
    const response = await fetch(
      "https://brandguard-api.ankit-25bce10159.workers.dev",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
        brandName: $("#brand-name")?.value.trim() || "",
        draft: draft,
        brandFacts: ""
      })
      }
    );

    const data = await response.json();

    if (!response.ok) {
    throw new Error(
    [data.error, data.details].filter(Boolean).join(": ") ||
    "The AI audit could not be completed."
  );
}

    const report = data.result || "";

    if (!report.trim()) {
      throw new Error("The AI returned an empty audit report.");
    }

    // Extract the overall verdict.
    const verdictMatch = report.match(
      /OVERALL VERDICT[\s\S]*?\*\*(High risk|Needs revision|Looks good)\*\*/i
    );

    const verdict = verdictMatch
      ? verdictMatch[1]
      : "Needs revision";

    // Extract the rewritten content.
    const rewrittenMatch = report.match(
      /REWRITTEN CONTENT\s*[:\n]*([\s\S]*?)(?=\n\s*#{1,3}\s*CHANGES MADE|\n\s*CHANGES MADE\b|$)/i
    );

    let suggested = rewrittenMatch
      ? rewrittenMatch[1].trim()
      : "";

   
    suggested = suggested
      .replace(/^```[^\n]*\n?/, "")
      .replace(/\n?```$/, "")
      .replace(/^\*\*|\*\*$/g, "")
      .trim();

    if (!suggested) {
      suggested = draft;
    }

    resetReviewState();

    state.originalDraft = draft;
    state.suggestedDraft = suggested;
    state.auditComplete = true;
    state.currentDocument =
      $("#document-title").value.trim() || "Untitled draft";

    // Store the AI report in the existing findings interface.
    state.findings = [{
      id: "ai-audit",
      severity: verdict.toLowerCase() === "high risk"
        ? "danger"
        : verdict.toLowerCase() === "needs revision"
          ? "warning"
          : "success",
      type: "AI content audit",
      title: verdict,
      quote: draft.slice(0, 300),
      evidence: report,
      source: data.sources && data.sources.length
        ? data.sources.map(source => source.title).join(", ")
        : "Gemini AI review · Approved brand facts",
      description:
        "Review the AI's analysis and suggested revision before making a decision."
    }];

    // Update the existing dashboard.
    $("#finding-count").textContent =
      verdict === "Looks good" ? "0" : "1";

    $("#findings-badge").textContent = "1";

    $("#last-audit").textContent =
      `Audited ${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}`;

    $("#original-preview").textContent = draft;
    $("#suggested-preview").textContent = suggested;

    $("#audit-summary").innerHTML = `
      <div class="summary-symbol">↳</div>
      <div>
        <strong>${escapeHTML(verdict)}</strong>
        <p>AI audit completed. Review the report and proposed revision before approval.</p>
      </div>
    `;

   
    renderFindings();

    $("#accept-button").disabled = suggested === draft;
    $("#keep-button").disabled = false;
    $("#submit-button").disabled = false;
    $("#return-button").disabled = false;
    $("#approve-button").disabled = false;

    $("#revision-note").textContent =
      "AI suggestions require human review.";

    $("#approval-message").textContent =
      "Review the AI findings and choose whether to accept the revision or keep the original.";

    updateStatus("Audit complete");

    addHistory(
      "AI content audit completed",
      `${state.currentDocument} · ${verdict}`
    );

    showToast("AI audit complete. Review the findings.");
    saveProgress();

  } catch (error) {
    console.error("BrandGuard AI audit error:", error);
    showToast(`Audit failed: ${error.message}`);
  } finally {
    auditButton.disabled = false;
    auditButton.textContent = originalButtonText;
  }
}

/* -----------------------------------------
   Render findings safely
   ----------------------------------------- */

function renderFindings() {
  const container = $("#findings-list");

  container.innerHTML = state.findings.map((finding, index) => {
    const icon = finding.severity === "danger"
      ? "!"
      : finding.severity === "warning"
        ? "?"
        : "✓";

    return `
      <article class="finding">
        <div class="finding-top">
          <div class="finding-icon ${finding.severity}">${icon}</div>
          <div class="finding-title">
            <strong>${escapeHTML(finding.title)}</strong>
            <span class="finding-type">${escapeHTML(finding.type)}</span>
          </div>
        </div>

        <blockquote class="finding-quote">
          “${escapeHTML(finding.quote)}”
        </blockquote>

        <div class="evidence-box">
          <span class="evidence-label">EVIDENCE / EXPLANATION</span>
          <p>${escapeHTML(finding.evidence)}</p>
          <span class="evidence-source">${escapeHTML(finding.source)}</span>
          <p style="margin-top:7px;color:#777b72">
            ${escapeHTML(finding.description)}
          </p>
        </div>

        <div class="finding-actions">
          <button class="mini-button" data-action="evidence"
            data-index="${index}">
            View evidence
          </button>
          <button class="mini-button" data-action="revision"
            data-index="${index}">
            View revision
          </button>
        </div>
      </article>
    `;
  }).join("");
}

$("#findings-list").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const finding = state.findings[Number(button.dataset.index)];
  if (!finding) return;

  if (button.dataset.action === "evidence") {
    showToast(`${finding.source}: ${finding.evidence}`);
  }

  if (button.dataset.action === "revision") {
    $("#revision-panel").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    $("#suggested-preview").textContent = state.suggestedDraft;
  }
});

/* -----------------------------------------
   Creator revision decisions
   ----------------------------------------- */

$("#accept-button").addEventListener("click", () => {
  if (!state.auditComplete) return;

  $("#draft-text").value = state.suggestedDraft;
  updateWordCount();

  state.acceptedRevision = true;
  state.overridden = false;

  $("#accept-button").disabled = true;
  $("#keep-button").disabled = false;
  $("#submit-button").disabled = false;

  $("#revision-note").textContent =
    "Revision accepted by creator. Re-audit before final approval.";

  $("#approval-message").textContent =
    "Revision accepted. Re-run the audit to check the edited content before submission.";

  updateStatus("Revision accepted");

  addHistory(
    "Suggested revision accepted",
    "Creator applied the proposed text edits."
  );

  showToast("Revision applied. Re-run the audit before submission.");
  saveProgress();
});

$("#keep-button").addEventListener("click", () => {
  if (!state.auditComplete) return;

  // Restore the exact text audited, if a previous suggestion was accepted.
  $("#draft-text").value = state.originalDraft;
  updateWordCount();

  state.acceptedRevision = false;
  state.overridden = true;

  $("#accept-button").disabled =
    state.suggestedDraft === state.originalDraft;

  $("#keep-button").disabled = false;
  $("#submit-button").disabled = false;

  $("#revision-note").textContent =
    "Original retained by creator. Findings remain available for reviewer consideration.";

  $("#approval-message").textContent =
    "The creator retained the original wording. The reviewer can assess the unresolved findings.";

  updateStatus("Original retained");

  addHistory(
    "Original wording retained",
    "Creator chose not to apply the suggested revision."
  );

  showToast("Original wording retained. Reviewer approval is still required.");
  saveProgress();
});

/* -----------------------------------------
   Submit and reviewer decisions
   ----------------------------------------- */

$("#submit-button").addEventListener("click", () => {
  if (!state.auditComplete) {
    showToast("Run an audit before submitting.");
    return;
  }

  const currentText = $("#draft-text").value.trim();

  if (currentText !== state.originalDraft) {
    showToast("The text changed after the audit. Re-run the audit first.");
    return;
  }

  state.submitted = true;

  $("#approve-button").disabled = false;
  $("#return-button").disabled = false;
  $("#submit-button").disabled = true;

  updateStatus("Pending review");

  $("#reviewer-state").textContent = "Ready for reviewer decision";

  $("#approval-message").textContent =
    "Submitted to the reviewer. Final approval is not automatic.";

  addHistory(
    "Submitted for review",
    `${state.currentDocument} is awaiting a human decision.`
  );

  $("#reviewer-panel").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  showToast("Submitted for review. A reviewer decision is now required.");
  saveProgress();
});

$("#approve-button").addEventListener("click", () => {
  if (!state.submitted) return;

  const comment = $("#review-comment").value.trim();

  updateStatus("Approved");
  $("#reviewer-state").textContent = "Approved by reviewer";
  $("#approval-message").textContent =
    "The reviewer approved this draft in the local demo.";

  $("#approve-button").disabled = true;
  $("#return-button").disabled = true;

  addHistory(
    "Content approved",
    comment || "Reviewer approved the submitted draft."
  );

  showToast("Demo decision recorded: approved.");
  saveProgress();
});

$("#return-button").addEventListener("click", () => {
  if (!state.submitted) return;

  const comment = $("#review-comment").value.trim();

  updateStatus("Revision requested");
  $("#reviewer-state").textContent = "Returned to creator";

  $("#approval-message").textContent =
    "The reviewer returned the draft. Update the text and run a new audit before resubmitting.";

  $("#approve-button").disabled = true;
  $("#return-button").disabled = true;
  $("#submit-button").disabled = false;

  state.submitted = false;

  addHistory(
    "Content returned for revision",
    comment || "Reviewer requested another revision."
  );

  showToast("Draft returned for revision.");
  saveProgress();
});

/* -----------------------------------------
   Navigation
   ----------------------------------------- */

const viewNames = {
  editor: "Content review",
  facts: "Approved facts",
  guidelines: "Brand guidelines",
  incomplete: "Incomplete audits",
  history: "Review history"
};

function showView(viewName) {
  document.querySelectorAll(".page-view").forEach(view => {
    view.classList.add("hidden");
  });

  const target = $(`#${viewName}-view`);

  if (!target) return;

  target.classList.remove("hidden");
  $("#breadcrumb-page").textContent = viewNames[viewName];

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === viewName
    );
  });
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

/* -----------------------------------------
   Approved facts table
   ----------------------------------------- */

function renderFacts() {
  $("#fact-count").textContent =
    String(approvedFacts.length).padStart(2, "0");

  $("#facts-total").textContent =
    `${String(approvedFacts.length).padStart(2, "0")} RECORDS`;

  $("#facts-table").innerHTML = approvedFacts.map(fact => `
    <tr>
      <td>${escapeHTML(fact.id)}</td>
      <td>${escapeHTML(fact.text)}</td>
      <td>${escapeHTML(fact.source)}</td>
      <td>● Approved</td>
    </tr>
  `).join("");
}

function formatAuditReport(report) {
  const escapeHTML = (text) =>
    String(text).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const sections = [
    "OVERALL VERDICT",
    "CLAIM CHECK",
    "BRAND ALIGNMENT",
    "TONE AND CLARITY",
    "REWRITTEN CONTENT",
    "CHANGES MADE",
    "SOURCES"
  ];

  let formatted = escapeHTML(report);

  // Remove common Markdown formatting artifacts.
  formatted = formatted
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/(^|\n)#{1,3}\s*/g, "$1")
    .replace(/---+/g, "");

  // Turn report headings into separate visual sections.
  for (const section of sections) {
    const escapedSection = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    formatted = formatted.replace(
      new RegExp(`(^|\\n)${escapedSection}\\s*:?`, "gi"),
      `$1<div class="audit-report-heading">${section}</div>`
    );
  }

  // Separate numbered claims onto their own lines.
  formatted = formatted.replace(
    /(\s)(\d+\.\s+(?:Claim|\\*\\*Claim))/gi,
    "\n$2"
  );

  // Keep line breaks visible in the UI.
  formatted = formatted.replace(/\n/g, "<br>");

  return `<div class="audit-report">${formatted}</div>`;
}


/* -----------------------------------------
   Review history
   ----------------------------------------- */

function renderHistory() {
  const container = $("#history-list");

  if (!state.history.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No activity recorded yet.</strong>
        <p>Run an audit or make a review decision to see it here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.history.map(item => `
    <div class="history-item">
      <div class="history-symbol">↳</div>
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.detail)}</p>
      </div>
      <span class="history-time">${escapeHTML(item.time)}</span>
    </div>
  `).join("");
}

/* -----------------------------------------
   Reset and input events
   ----------------------------------------- */

$("#audit-button").addEventListener("click", runAudit);

$("#reset-button").addEventListener("click", () => {
  $("#draft-text").value = originalExample;
  $("#document-title").value = "FitFuel — Launch announcement";
  $("#template-select").value = "Social Post";

  resetReviewState();
  updateWordCount();

  showToast("Example draft restored.");
});

$("#draft-text").addEventListener("input", () => {
  updateWordCount();

  if (state.auditComplete &&
      $("#draft-text").value.trim() !== state.originalDraft) {
    $("#last-audit").textContent = "Changes not yet audited";
    $("#submit-button").disabled = true;
    $("#approve-button").disabled = true;
    $("#return-button").disabled = true;

    $("#approval-message").textContent =
      "The draft changed after its audit. Run a new audit before submitting.";
  }
});

$("#document-title").addEventListener("input", () => {
  state.currentDocument =
    $("#document-title").value.trim() || "Untitled draft";
});

$("#template-select").addEventListener("change", () => {
  showToast(
    `${$("#template-select").value} template selected. Audit rules remain the same in this demo.`
  );
});

/* -----------------------------------------
   Incomplete audits (save & resume)
   ----------------------------------------- */

const INCOMPLETE_STORAGE_KEY = "brandguard_incomplete_audits";
let incompleteAudits = [];
let currentDraftId = newDraftId();
let saveTimer;

function newDraftId() {
  return "draft-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function loadIncompleteAudits() {
  try {
    const saved = localStorage.getItem(INCOMPLETE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) incompleteAudits = parsed;
    }
  } catch (error) {
    console.error("Could not load incomplete audits:", error);
  }
}

function persistIncompleteAudits() {
  try {
    localStorage.setItem(
      INCOMPLETE_STORAGE_KEY,
      JSON.stringify(incompleteAudits)
    );
  } catch (error) {
    console.error("Could not save incomplete audits:", error);
  }
}

function removeIncomplete(id) {
  incompleteAudits = incompleteAudits.filter(item => item.id !== id);
  persistIncompleteAudits();
  renderIncomplete();
}

function saveProgress() {
  const draft = $("#draft-text").value.trim();

  if (!draft) return;

  // A finished audit is no longer "incomplete".
  if (state.decision === "Approved") {
    removeIncomplete(currentDraftId);
    return;
  }

  // Don't save the untouched example draft.
  if (!state.auditComplete && draft === originalExample.trim()) return;

  const entry = {
    id: currentDraftId,
    title: $("#document-title").value.trim() || "Untitled draft",
    brand: $("#brand-name")?.value || "",
    template: $("#template-select").value,
    draft: $("#draft-text").value,
    comment: $("#review-comment").value,
    decision: state.decision,
    updatedAt: Date.now(),
    state: {
      findings: state.findings,
      auditComplete: state.auditComplete,
      acceptedRevision: state.acceptedRevision,
      overridden: state.overridden,
      submitted: state.submitted,
      originalDraft: state.originalDraft,
      suggestedDraft: state.suggestedDraft
    }
  };

  const index = incompleteAudits.findIndex(item => item.id === entry.id);
  if (index >= 0) incompleteAudits[index] = entry;
  else incompleteAudits.push(entry);

  incompleteAudits.sort((a, b) => b.updatedAt - a.updatedAt);
  persistIncompleteAudits();
  renderIncomplete();
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveProgress, 500);
}

function renderIncomplete() {
  const container = $("#incomplete-list");
  const badge = $("#incomplete-count");

  if (badge) badge.textContent = incompleteAudits.length || "";
  if (!container) return;

  if (!incompleteAudits.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No unfinished audits.</strong>
        <p>Drafts you leave before approval will be saved here automatically.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = incompleteAudits.map(item => {
    const words = item.draft.trim().split(/\s+/).filter(Boolean).length;
    return `
      <div class="history-item">
        <div class="history-symbol">↳</div>
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <p>${escapeHTML(item.decision)} · ${words} words · saved
            ${escapeHTML(new Date(item.updatedAt).toLocaleString([], {
              day: "numeric", month: "short",
              hour: "2-digit", minute: "2-digit"
            }))}</p>
          <button class="mini-button" data-action="resume"
            data-id="${escapeHTML(item.id)}">Resume</button>
          <button class="mini-button" data-action="discard"
            data-id="${escapeHTML(item.id)}">Discard</button>
        </div>
      </div>
    `;
  }).join("");
}

function resumeAudit(id) {
  const entry = incompleteAudits.find(item => item.id === id);
  if (!entry) return;

  currentDraftId = entry.id;

  $("#draft-text").value = entry.draft;
  $("#document-title").value = entry.title;
  if ($("#brand-name")) $("#brand-name").value = entry.brand || "";
  $("#template-select").value = entry.template;

  resetReviewState();

  const saved = entry.state;

  if (saved && saved.auditComplete) {
    state.findings = saved.findings || [];
    state.auditComplete = true;
    state.acceptedRevision = !!saved.acceptedRevision;
    state.overridden = !!saved.overridden;
    state.submitted = !!saved.submitted;
    state.originalDraft = saved.originalDraft || "";
    state.suggestedDraft = saved.suggestedDraft || "";

    const verdict = state.findings[0]?.title || "Needs revision";
    const changed = entry.draft.trim() !== state.originalDraft;

    $("#finding-count").textContent = verdict === "Looks good" ? "0" : "1";
    $("#findings-badge").textContent = "1";
    $("#last-audit").textContent = changed
      ? "Changes not yet audited"
      : "Restored from saved progress";

    $("#original-preview").textContent = state.originalDraft;
    $("#suggested-preview").textContent = state.suggestedDraft;

    $("#audit-summary").innerHTML = `
      <div class="summary-symbol">↳</div>
      <div>
        <strong>${escapeHTML(verdict)}</strong>
        <p>Audit restored from your saved progress. Pick up where you left off.</p>
      </div>
    `;

    renderFindings();

    $("#accept-button").disabled =
      state.acceptedRevision ||
      state.suggestedDraft === state.originalDraft;
    $("#keep-button").disabled = false;
    $("#submit-button").disabled = state.submitted || changed;
    $("#approve-button").disabled = !state.submitted;
    $("#return-button").disabled = !state.submitted;

    $("#revision-note").textContent =
      "AI suggestions require human review.";
    $("#approval-message").textContent = changed
      ? "The draft changed after its audit. Run a new audit before submitting."
      : "Review the AI findings and choose whether to accept the revision or keep the original.";

    updateStatus(entry.decision || "Audit complete");
  }

  $("#review-comment").value = entry.comment || "";
  updateWordCount();
  showView("editor");
  showToast(`Resumed "${entry.title}".`);
}

$("#incomplete-list").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "resume") resumeAudit(button.dataset.id);

  if (button.dataset.action === "discard") {
    removeIncomplete(button.dataset.id);
    showToast("Unfinished audit discarded.");
  }
});

// Save when the user leaves or switches away from the tab.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveProgress();
});
window.addEventListener("pagehide", saveProgress);

// Autosave while typing, and start a fresh draft ID on reset.
$("#draft-text").addEventListener("input", scheduleSave);
$("#document-title").addEventListener("input", scheduleSave);
$("#review-comment").addEventListener("input", scheduleSave);
$("#reset-button").addEventListener("click", () => {
  currentDraftId = newDraftId();
});

/* -----------------------------------------
   Initialisation
   ----------------------------------------- */
loadReviewHistory();
renderFacts();
renderHistory();
updateWordCount();
resetReviewState();
loadReviewHistory();
loadIncompleteAudits();
renderFacts();
renderHistory();
renderIncomplete();
updateWordCount();
resetReviewState();
