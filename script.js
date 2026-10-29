
"use strict";

const $ = (selector) => document.querySelector(selector);

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
  state.seo = null;
  state.verdict = "";
  renderSeo();
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
        brandFacts: "",
        format: $("#template-select").value
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

    // Extract the overall verdict from "Risk Level: Low/Medium/High".
    const riskMatch = report.match(/Risk Level\s*:\s*\**\s*(Low|Medium|High)/i);
    const risk = riskMatch ? riskMatch[1].toLowerCase() : "";

    const verdict =
      risk === "high" ? "High risk" :
      risk === "low" ? "Looks good" :
      "Needs revision";

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
    state.verdict = verdict;
    state.seo = data.seo || null;
    state.currentDocument =
      $("#document-title").value.trim() || "Untitled draft";

    // Store the AI report in the existing findings interface.
    state.findings = parseAuditFindings(report, draft, data.sources || []);

    // Update the existing dashboard.
    $("#finding-count").textContent = String(state.findings.length);
$("#findings-badge").textContent = String(state.findings.length);

    $("#last-audit").textContent =
"use strict";

const $ = (selector) => document.querySelector(selector);

function getDocName() {
  return $("#brand-name")?.value.trim() || "Untitled draft";
}

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
}

function resetReviewState() {
  state.findings = [];
  state.auditComplete = false;
  state.acceptedRevision = false;
  state.overridden = false;
  state.submitted = false;
  state.originalDraft = "";
  state.suggestedDraft = "";
  state.currentDocument = getDocName(); 
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
  state.seo = null;
  state.verdict = "";
  renderSeo();
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
        brandFacts: "",
        format: $("#template-select").value
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

    console.log("RAW REPORT:\n", report);

    // Extract the overall verdict from "Risk Level: Low/Medium/High".
    const riskMatch = report.match(/Risk Level\s*:\s*\**\s*(Low|Medium|High)/i);
    const risk = riskMatch ? riskMatch[1].toLowerCase() : "";

    const verdict =
      risk === "high" ? "High risk" :
      risk === "low" ? "Looks good" :
      "Needs revision";

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
    state.verdict = verdict;
    state.seo = data.seo || null;
    state.currentDocument = getDocName();

    // Store the AI report in the existing findings interface.
    state.findings = parseAuditFindings(report, draft, data.sources || []);

    // Update the existing dashboard.
    $("#finding-count").textContent = String(state.findings.length);
    $("#findings-badge").textContent = String(state.findings.length);

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
    renderSeo();

    $("#accept-button").disabled = suggested === draft;
    $("#keep-button").disabled = false;
    $("#submit-button").disabled = false;
    $("#approve-button").disabled = true;

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

function parseAuditFindings(report, draft, sources = []) {
  const text = String(report || "").replace(/\r/g, "");

  // Prefer the claim section, but do not depend on the model returning
  // that heading perfectly. Claim extraction must not depend on document title.
  const sectionMatch = text.match(
    /(?:CLAIM(?:-BY-CLAIM)?\s+(?:CHECK|VERIFICATION)|CLAIM CHECK|CLAIM VERIFICATION)\s*:?\s*([\s\S]*?)(?=\n\s*(?:BRAND ALIGNMENT|TONE AND CLARITY|REWRITTEN CONTENT|CHANGES MADE|SOURCES)\s*:?\s*(?:\n|$)|$)/i
  );
  const claimSection = (sectionMatch ? sectionMatch[1] : text).trim();

  // Accept common model variations: "Claim 1:", "**Claim 1:**",
  // "1. Claim:", "1) Claim:", and numbered original-claim blocks.
  const claimStart = /(?:^|\n)\s*(?:[*#>-]+\s*)?(?:Claim\s*#?\s*\d+\s*:|\d+\s*[\).]\s*(?:\*\*)?Claim(?:\*\*)?\s*:|\d+\s*[\).]\s*(?:\*\*)?Original Claim(?:\*\*)?\s*:)/gi;
  const starts = [];
  let match;
  while ((match = claimStart.exec(claimSection)) !== null) {
    starts.push({ index: match.index + (match[0].startsWith("\n") ? 1 : 0), end: claimStart.lastIndex });
  }

  // If the report uses fields but omitted explicit claim numbering, split at
  // each Original Claim label rather than collapsing everything into one card.
  if (starts.length === 0) {
    const fieldStart = /(?:^|\n)\s*(?:[*#>-]+\s*)?Original Claim\s*:/gi;
    while ((match = fieldStart.exec(claimSection)) !== null) {
      starts.push({ index: match.index + (match[0].startsWith("\n") ? 1 : 0), end: fieldStart.lastIndex });
    }
  }

  function readField(block, labels) {
    const labelPattern = labels.join("|");
    const match = block.match(
      new RegExp(
        "(?:^|\\n)\\s*(?:[*#>-]+\\s*)?(?:" + labelPattern +
        ")\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:[*#>-]+\\s*)?(?:Original Claim|Claim|Verdict|Status|Why It Was Flagged|Explanation|Evidence Found|Evidence|Source URL|Source|Suggested Fix)\\s*:|$)",
        "i"
      )
    );
    return match ? match[1].trim().replace(/^\s*[-•]\s*/, "").replace(/\*\*/g, "") : "";
  }

  const chunks = starts.length
    ? starts.map((item, index) =>
        claimSection.slice(item.index, index + 1 < starts.length ? starts[index + 1].index : claimSection.length).trim()
      )
    : [];

  const findings = chunks.map((block, index) => {
    const claim = readField(block, ["Original Claim", "Claim"]);
    const verdict = readField(block, ["Verdict", "Status"]);
    const explanation = readField(block, ["Why It Was Flagged", "Explanation"]);
    const evidence = readField(block, ["Evidence Found", "Evidence"]);
    const sourceUrl = readField(block, ["Source URL"]);
    const sourceName = readField(block, ["Source"]);
    const suggestedFix = readField(block, ["Suggested Fix"]);
    const statusText = verdict.toLowerCase();

    let severity = "unverified";
    if (/\bcontradicted\b|\bfalse\b|\binaccurate\b|\bunsupported by evidence\b/.test(statusText)) {
      severity = "danger";
    } else if (/\bsupported\b|\bverified\b|\bsubstantiated\b/.test(statusText)) {
      severity = "success";
    }

    const validUrl = (() => {
      try {
        const url = new URL(sourceUrl);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
      } catch {
        return "";
      }
    })();

    return {
      id: `claim-${index + 1}`,
      severity,
      type: "Claim verification",
      title: claim || `Claim ${index + 1}`,
      quote: claim,
      evidence: evidence || "No specific supporting evidence was provided.",
      source: sourceName || (validUrl ? validUrl : "No source identified"),
      sourceUrl: validUrl,
      description: explanation || "Review the available evidence before making a decision.",
      suggestedFix
    };
  }).filter(item => item.quote);

  if (findings.length) return findings;

  // Keep the report visible if the AI does not follow the expected format.
  return [{
    id: "ai-audit-fallback",
    severity: "unverified",
    type: "Full audit report",
    title: "Claim details need review",
    quote: draft.slice(0, 300),
    evidence: text || "The AI did not return a readable report.",
    source: sources.length
      ? sources.map(item => item.title || item.url).join(", ")
      : "No sources identified",
    description: "The report could not be separated into individual claims. Check the AI response format."
  }];
}


function renderFindings() {
  const container = $("#findings-list");

  container.innerHTML = state.findings.map((finding, index) => {
    const severity = finding.severity || "unverified";

    const statusLabel = {
      success: "Supported",
      danger: "Contradicted",
      warning: "Needs review",
      unverified: "Unverified"
    }[severity] || "Unverified";

    const icon = {
      success: "✓",
      danger: "✕",
      warning: "!",
      unverified: "?"
    }[severity] || "?";

    const sourceLink = finding.sourceUrl
      ? `<a class="claim-source-link"
           href="${escapeHTML(finding.sourceUrl)}"
           target="_blank"
           rel="noopener noreferrer">Open source ↗</a>`
      : "";

    return `
      <article class="finding claim-card ${severity}">
        <div class="claim-card-header">
          <div class="finding-icon ${severity}">${icon}</div>

          <div class="finding-title">
            <strong>${escapeHTML(finding.title)}</strong>
            <span class="finding-type">
              Claim ${index + 1} · ${escapeHTML(finding.type || "Claim verification")}
            </span>
          </div>

          <span class="claim-status ${severity}">
            ${statusLabel}
          </span>
        </div>

        <section class="claim-section">
          <span class="claim-section-label">ORIGINAL CLAIM</span>
          <p>${escapeHTML(finding.quote || "No claim text provided.")}</p>
        </section>

        <section class="claim-section">
          <span class="claim-section-label">WHY IT WAS FLAGGED</span>
          <p>${escapeHTML(finding.description || "No explanation provided.")}</p>
        </section>

        <section class="claim-section evidence-section">
          <span class="claim-section-label">EVIDENCE FOUND</span>
          <p>${escapeHTML(finding.evidence || "No evidence provided.")}</p>

          <div class="claim-source">
            <span class="claim-section-label">SOURCE</span>
            <span>${escapeHTML(finding.source || "No source identified")}</span>
            ${sourceLink}
          </div>
        </section>

        ${finding.suggestedFix ? `
          <section class="claim-section suggested-fix">
            <span class="claim-section-label">SUGGESTED FIX</span>
            <p>${escapeHTML(finding.suggestedFix)}</p>
          </section>
        ` : ""}

        <div class="finding-actions">
          <button class="mini-button"
            data-action="evidence"
            data-index="${index}">
            View evidence
          </button>

          <button class="mini-button"
            data-action="revision"
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
  $("#submit-button").disabled = true;

  updateStatus("Pending review");

  $("#approval-message").textContent =
    "Submitted to the reviewer. Final approval is not automatic.";

  addHistory(
    "Submitted for review",
    `${state.currentDocument} is awaiting a human decision.`
  );

  $("#approve-button").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  showToast("Submitted for review. A reviewer decision is now required.");
  saveProgress();
});

$("#approve-button").addEventListener("click", () => {
  if (!state.submitted) return;

  updateStatus("Approved");
  $("#approval-message").textContent =
    "The reviewer approved this draft.";

  $("#approve-button").disabled = true;

  addHistory(
    "Content approved",
    "Reviewer approved the submitted draft."
  );

  showToast("Audit Approved !");
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

$("#draft-text").addEventListener("input", () => {
  updateWordCount();

  if (state.auditComplete &&
      $("#draft-text").value.trim() !== state.originalDraft) {
    $("#last-audit").textContent = "Changes not yet audited";
    $("#submit-button").disabled = true;
    $("#approve-button").disabled = true;

    $("#approval-message").textContent =
      "The draft changed after its audit. Run a new audit before submitting.";
  }
});

$("#brand-name").addEventListener("input", () => {
  state.currentDocument = getDocName();
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

  const entry = {
    id: currentDraftId,
    title: getDocName(),
    brand: $("#brand-name")?.value || "",
    template: $("#template-select").value,
    draft: $("#draft-text").value,
    decision: state.decision,
    updatedAt: Date.now(),
    state: {
      findings: state.findings,
      auditComplete: state.auditComplete,
      acceptedRevision: state.acceptedRevision,
      overridden: state.overridden,
      submitted: state.submitted,
      originalDraft: state.originalDraft,
      suggestedDraft: state.suggestedDraft,
      verdict: state.verdict,
      seo: state.seo
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
    state.verdict = saved.verdict || "Needs revision";
    state.seo = saved.seo || null;
    const verdict = state.verdict;
    const changed = entry.draft.trim() !== state.originalDraft;

    $("#finding-count").textContent = String(state.findings.length);
    $("#findings-badge").textContent = String(state.findings.length);
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
    renderSeo();

    $("#accept-button").disabled =
      state.acceptedRevision ||
      state.suggestedDraft === state.originalDraft;
    $("#keep-button").disabled = false;
    $("#submit-button").disabled = state.submitted || changed;
    $("#approve-button").disabled = !state.submitted;

    $("#revision-note").textContent =
      "AI suggestions require human review.";
    $("#approval-message").textContent = changed
      ? "The draft changed after its audit. Run a new audit before submitting."
      : "Review the AI findings and choose whether to accept the revision or keep the original.";

    updateStatus(entry.decision || "Audit complete");
  }

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
$("#brand-name").addEventListener("input", scheduleSave);
/* -----------------------------------------
   SEO content score
   ----------------------------------------- */

function seoTier(score) {
  return score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
}

function renderSeo() {
  const metric = $("#metric-seo");
  if (metric) metric.textContent = state.seo ? String(state.seo.score) : "—";
  const body = $("#seo-body");
  if (!body) return;

  const seo = state.seo;

  if (!seo) {
    body.innerHTML = state.auditComplete
      ? `<div class="empty-state">
           <strong>SEO score unavailable.</strong>
           <p>The score could not be generated for this audit. Run the audit again to retry.</p>
         </div>`
      : `<div class="empty-state">
           <div class="empty-icon">◎</div>
           <strong>Your SEO score will appear here.</strong>
           <p>Run an audit to see a score out of 100 and recommendations that keep your message.</p>
         </div>`;
    return;
  }

  const tier = seoTier(seo.score);

  const keywords = (seo.suggestedKeywords || [])
    .map(k => `<span class="seo-chip">${escapeHTML(k)}</span>`)
    .join("");

  const categories = (seo.categories || []).map(cat => {
    const pct = cat.max ? Math.round((cat.score / cat.max) * 100) : 0;
    return `
      <div class="seo-category">
        <div class="seo-category-top">
          <strong>${escapeHTML(cat.name)}</strong>
          <span>${cat.score} / ${cat.max}</span>
        </div>
        <div class="seo-bar"><i class="${seoTier(pct)}" style="width:${pct}%"></i></div>
        ${cat.finding ? `<p>${escapeHTML(cat.finding)}</p>` : ""}
      </div>
    `;
  }).join("");

  const recommendations = (seo.recommendations || []).map((rec, i) => `
    <div class="seo-rec">
      <span class="seo-rec-num">${i + 1}</span>
      <div>
        <strong>${escapeHTML(rec.area || "Improvement")}</strong>
        ${rec.issue ? `<p>${escapeHTML(rec.issue)}</p>` : ""}
        <p class="seo-rec-action">${escapeHTML(rec.recommendation)}</p>
        ${rec.example ? `<blockquote>${escapeHTML(rec.example)}</blockquote>` : ""}
      </div>
    </div>
  `).join("");

  body.innerHTML = `
    <div class="seo-score-row">
      <div class="seo-score ${tier}">
        <strong>${seo.score}</strong><span>/ 100</span>
      </div>
      <div class="seo-score-meta">
        <strong>${escapeHTML(seo.rating)}</strong>
        ${seo.primaryKeyword
          ? `<p>Primary keyword: <b>${escapeHTML(seo.primaryKeyword)}</b></p>`
          : ""}
        <div class="seo-keywords">${keywords}</div>
      </div>
    </div>

    <div class="seo-breakdown">${categories}</div>

    ${recommendations
      ? `<div class="seo-recs">
           <span class="seo-label">RECOMMENDATIONS · YOUR MESSAGE STAYS INTACT</span>
           ${recommendations}
         </div>`
      : ""}

    <p class="seo-note">AI-generated estimate based on the draft and web search context. Treat it as guidance, not a ranking guarantee.</p>
  `;
}

/* -----------------------------------------
   Initialisation
   ----------------------------------------- */
loadReviewHistory();
loadIncompleteAudits();
renderHistory();
renderIncomplete();
updateWordCount();
resetReviewState();

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
    renderSeo();

    $("#accept-button").disabled = suggested === draft;
    $("#keep-button").disabled = false;
    $("#submit-button").disabled = false;
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

function parseAuditFindings(report, draft, sources = []) {
  const text = String(report || "");

  const sectionMatch = text.match(
    /(?:CLAIM(?:-BY-CLAIM)?\s+(?:CHECK|VERIFICATION)|CLAIM CHECK|CLAIM VERIFICATION)\s*:?([\s\S]*?)(?=\n\s*(?:BRAND ALIGNMENT|TONE AND CLARITY|REWRITTEN CONTENT|CHANGES MADE|SOURCES)\s*:?\s*(?:\n|$)|$)/i
  );

  let claimSection = sectionMatch ? sectionMatch[1].trim() : "";

// If the expected heading is missing, search the full report
// for numbered claim entries instead of immediately falling back.
if (!claimSection) {
  const firstClaim = text.search(
    /^\s*(?:Claim\s*\d+\s*:|\d+\s*[\).]\s*Claim\s*:)/im
  );

  if (firstClaim !== -1) {
    claimSection = text.slice(firstClaim).trim();
  }
}

  // Recognize claims formatted as "Claim 1:", "1. Claim:", or "Claim:"
  const chunks = claimSection
  .split(
    /(?=^\s*(?:Claim\s*\d+\s*:|\d+\s*[\).]\s*Claim\s*:))/im
  )
  .map(item => item.trim())
  .filter(Boolean);
  function readField(block, labels) {
    const labelPattern = labels.join("|");

    const match = block.match(
      new RegExp(
        "(?:^|\\n)\\s*(?:" + labelPattern +
        ")\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:Original Claim|Claim|Verdict|Status|Why It Was Flagged|Explanation|Evidence Found|Evidence|Source URL|Source|Suggested Fix)\\s*:|$)",
        "i"
      )
    );

    return match ? match[1].trim().replace(/^\s*[-•]\s*/, "") : "";
  }

  const findings = chunks.map((block, index) => {
    const claim = readField(block, [
      "Original Claim",
      "Claim"
    ]);

    const verdict = readField(block, [
      "Verdict",
      "Status"
    ]);

    const explanation = readField(block, [
      "Why It Was Flagged",
      "Explanation"
    ]);

    const evidence = readField(block, [
      "Evidence Found",
      "Evidence"
    ]);

    const sourceUrl = readField(block, [
      "Source URL"
    ]);

    const sourceName = readField(block, [
      "Source"
    ]);

    const suggestedFix = readField(block, [
      "Suggested Fix"
    ]);

    const statusText = verdict.toLowerCase();

    let severity = "unverified";

    if (/\bcontradicted\b|\bfalse\b|\binaccurate\b|\bunsupported by evidence\b/.test(statusText)) {
      severity = "danger";
    } else if (/\bsupported\b|\bverified\b|\bsubstantiated\b/.test(statusText)) {
      severity = "success";
    }

    const validUrl = (() => {
      try {
        const url = new URL(sourceUrl);
        return ["http:", "https:"].includes(url.protocol)
          ? url.href
          : "";
      } catch {
        return "";
      }
    })();

    return {
      id: `claim-${index + 1}`,
      severity,
      type: "Claim verification",
      title: claim || `Claim ${index + 1}`,
      quote: claim || block.slice(0, 300),
      evidence: evidence || "No specific supporting evidence was provided.",
      source: sourceName || (validUrl ? validUrl : "No source identified"),
      sourceUrl: validUrl,
      description: explanation || "Review the available evidence before making a decision.",
      suggestedFix
    };
  }).filter(item => item.quote);

  if (findings.length) {
    return findings;
  }

  // Keep the report visible if the AI does not follow the expected format.
  return [{
    id: "ai-audit-fallback",
    severity: "unverified",
    type: "Full audit report",
    title: "Claim details need review",
    quote: draft.slice(0, 300),
    evidence: text || "The AI did not return a readable report.",
    source: sources.length
      ? sources.map(item => item.title || item.url).join(", ")
      : "No sources identified",
    description: "The report could not be separated into individual claims. Check the AI response format."
  }];
}



function renderFindings() {
  const container = $("#findings-list");

  container.innerHTML = state.findings.map((finding, index) => {
    const severity = finding.severity || "unverified";

    const statusLabel = {
      success: "Supported",
      danger: "Contradicted",
      warning: "Needs review",
      unverified: "Unverified"
    }[severity] || "Unverified";

    const icon = {
      success: "✓",
      danger: "✕",
      warning: "!",
      unverified: "?"
    }[severity] || "?";

    const sourceLink = finding.sourceUrl
      ? `<a class="claim-source-link"
           href="${escapeHTML(finding.sourceUrl)}"
           target="_blank"
           rel="noopener noreferrer">Open source ↗</a>`
      : "";

    return `
      <article class="finding claim-card ${severity}">
        <div class="claim-card-header">
          <div class="finding-icon ${severity}">${icon}</div>

          <div class="finding-title">
            <strong>${escapeHTML(finding.title)}</strong>
            <span class="finding-type">
              Claim ${index + 1} · ${escapeHTML(finding.type || "Claim verification")}
            </span>
          </div>

          <span class="claim-status ${severity}">
            ${statusLabel}
          </span>
        </div>

        <section class="claim-section">
          <span class="claim-section-label">ORIGINAL CLAIM</span>
          <p>${escapeHTML(finding.quote || "No claim text provided.")}</p>
        </section>

        <section class="claim-section">
          <span class="claim-section-label">WHY IT WAS FLAGGED</span>
          <p>${escapeHTML(finding.description || "No explanation provided.")}</p>
        </section>

        <section class="claim-section evidence-section">
          <span class="claim-section-label">EVIDENCE FOUND</span>
          <p>${escapeHTML(finding.evidence || "No evidence provided.")}</p>

          <div class="claim-source">
            <span class="claim-section-label">SOURCE</span>
            <span>${escapeHTML(finding.source || "No source identified")}</span>
            ${sourceLink}
          </div>
        </section>

        ${finding.suggestedFix ? `
          <section class="claim-section suggested-fix">
            <span class="claim-section-label">SUGGESTED FIX</span>
            <p>${escapeHTML(finding.suggestedFix)}</p>
          </section>
        ` : ""}

        <div class="finding-actions">
          <button class="mini-button"
            data-action="evidence"
            data-index="${index}">
            View evidence
          </button>

          <button class="mini-button"
            data-action="revision"
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
  $("#submit-button").disabled = true;

  updateStatus("Pending review");

  $("#approval-message").textContent =
    "Submitted to the reviewer. Final approval is not automatic.";

  addHistory(
    "Submitted for review",
    `${state.currentDocument} is awaiting a human decision.`
  );

  $("#approve-button").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  showToast("Submitted for review. A reviewer decision is now required.");
  saveProgress();
});

$("#approve-button").addEventListener("click", () => {
  if (!state.submitted) return;

  updateStatus("Approved");
  $("#approval-message").textContent =
    "The reviewer approved this draft in the local demo.";

  $("#approve-button").disabled = true;

  addHistory(
    "Content approved",
    "Reviewer approved the submitted draft."
  );

  showToast("Demo decision recorded: approved.");
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

$("#draft-text").addEventListener("input", () => {
  updateWordCount();

  if (state.auditComplete &&
      $("#draft-text").value.trim() !== state.originalDraft) {
    $("#last-audit").textContent = "Changes not yet audited";
    $("#submit-button").disabled = true;
    $("#approve-button").disabled = true;

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

  const entry = {
    id: currentDraftId,
    title: $("#document-title").value.trim() || "Untitled draft",
    brand: $("#brand-name")?.value || "",
    template: $("#template-select").value,
    draft: $("#draft-text").value,
    decision: state.decision,
    updatedAt: Date.now(),
    state: {
      findings: state.findings,
      auditComplete: state.auditComplete,
      acceptedRevision: state.acceptedRevision,
      overridden: state.overridden,
      submitted: state.submitted,
      originalDraft: state.originalDraft,
      suggestedDraft: state.suggestedDraft,
      verdict: state.verdict,
      seo: state.seo
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
    state.verdict = saved.verdict || "Needs revision";
    state.seo = saved.seo || null;
    const verdict = state.verdict;
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
    renderSeo();

    $("#accept-button").disabled =
      state.acceptedRevision ||
      state.suggestedDraft === state.originalDraft;
    $("#keep-button").disabled = false;
    $("#submit-button").disabled = state.submitted || changed;
    $("#approve-button").disabled = !state.submitted;

    $("#revision-note").textContent =
      "AI suggestions require human review.";
    $("#approval-message").textContent = changed
      ? "The draft changed after its audit. Run a new audit before submitting."
      : "Review the AI findings and choose whether to accept the revision or keep the original.";

    updateStatus(entry.decision || "Audit complete");
  }

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

/* -----------------------------------------
   SEO content score
   ----------------------------------------- */

function seoTier(score) {
  return score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
}

function renderSeo() {
  const body = $("#seo-body");
  if (!body) return;

  const seo = state.seo;

  if (!seo) {
    body.innerHTML = state.auditComplete
      ? `<div class="empty-state">
           <strong>SEO score unavailable.</strong>
           <p>The score could not be generated for this audit. Run the audit again to retry.</p>
         </div>`
      : `<div class="empty-state">
           <div class="empty-icon">◎</div>
           <strong>Your SEO score will appear here.</strong>
           <p>Run an audit to see a score out of 100 and recommendations that keep your message.</p>
         </div>`;
    return;
  }

  const tier = seoTier(seo.score);

  const keywords = (seo.suggestedKeywords || [])
    .map(k => `<span class="seo-chip">${escapeHTML(k)}</span>`)
    .join("");

  const categories = (seo.categories || []).map(cat => {
    const pct = cat.max ? Math.round((cat.score / cat.max) * 100) : 0;
    return `
      <div class="seo-category">
        <div class="seo-category-top">
          <strong>${escapeHTML(cat.name)}</strong>
          <span>${cat.score} / ${cat.max}</span>
        </div>
        <div class="seo-bar"><i class="${seoTier(pct)}" style="width:${pct}%"></i></div>
        ${cat.finding ? `<p>${escapeHTML(cat.finding)}</p>` : ""}
      </div>
    `;
  }).join("");

  const recommendations = (seo.recommendations || []).map((rec, i) => `
    <div class="seo-rec">
      <span class="seo-rec-num">${i + 1}</span>
      <div>
        <strong>${escapeHTML(rec.area || "Improvement")}</strong>
        ${rec.issue ? `<p>${escapeHTML(rec.issue)}</p>` : ""}
        <p class="seo-rec-action">${escapeHTML(rec.recommendation)}</p>
        ${rec.example ? `<blockquote>${escapeHTML(rec.example)}</blockquote>` : ""}
      </div>
    </div>
  `).join("");

  body.innerHTML = `
    <div class="seo-score-row">
      <div class="seo-score ${tier}">
        <strong>${seo.score}</strong><span>/ 100</span>
      </div>
      <div class="seo-score-meta">
        <strong>${escapeHTML(seo.rating)}</strong>
        ${seo.primaryKeyword
          ? `<p>Primary keyword: <b>${escapeHTML(seo.primaryKeyword)}</b></p>`
          : ""}
        <div class="seo-keywords">${keywords}</div>
      </div>
    </div>

    <div class="seo-breakdown">${categories}</div>

    ${recommendations
      ? `<div class="seo-recs">
           <span class="seo-label">RECOMMENDATIONS · YOUR MESSAGE STAYS INTACT</span>
           ${recommendations}
         </div>`
      : ""}

    <p class="seo-note">AI-generated estimate based on the draft and web search context. Treat it as guidance, not a ranking guarantee.</p>
  `;
}

/* -----------------------------------------
   Initialisation
   ----------------------------------------- */
loadReviewHistory();
loadIncompleteAudits();
renderFacts();
renderHistory();
renderIncomplete();
updateWordCount();
resetReviewState();
