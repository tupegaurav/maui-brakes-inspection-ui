// ── Configuration ──────────────────────────────────────────────
// Paste your n8n production webhook URL here (Webhook node → Production URL).
const WEBHOOK_URL = "https://gauravai.app.n8n.cloud/webhook/mauli-inspection";

// ── Elements ───────────────────────────────────────────────────
const form = document.getElementById("inspection-form");
const submitBtn = document.getElementById("submit-btn");
const networkError = document.getElementById("network-error");
const resultPanel = document.getElementById("result-panel");
const resultMessage = document.getElementById("result-message");
const resultErrors = document.getElementById("result-errors");
const resetBtn = document.getElementById("reset-btn");
const andonStatus = document.getElementById("andon-status");

const lights = {
  critical: document.getElementById("light-critical"),
  warning: document.getElementById("light-warning"),
  normal: document.getElementById("light-normal"),
};

// ── Andon light control ────────────────────────────────────────
function setAndon(severity) {
  Object.entries(lights).forEach(([key, el]) => {
    el.classList.remove(`lit-${key}`);
  });

  if (severity && lights[severity]) {
    lights[severity].classList.add(`lit-${severity}`);
    andonStatus.textContent = severity.toUpperCase();
  } else {
    andonStatus.textContent = "STANDBY";
  }
}

// ── Form submit ────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  networkError.hidden = true;
  resultPanel.hidden = true;

  if (!WEBHOOK_URL || WEBHOOK_URL.includes("your-n8n-instance")) {
    networkError.textContent =
      "No webhook URL configured. Edit script.js and set WEBHOOK_URL.";
    networkError.hidden = false;
    return;
  }

  const entry = {
    partName: document.getElementById("partName").value,
    checkQty: Number(document.getElementById("checkQty").value),
    okQty: Number(document.getElementById("okQty").value),
    rejQty: Number(document.getElementById("rejQty").value),
    reworkQty: Number(document.getElementById("reworkQty").value),
    inspectorId: document.getElementById("inspectorId").value,
    shift: document.getElementById("shift").value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    if (!res.ok) throw new Error(`Server responded ${res.status}`);

    const data = await res.json();
    const isValid = data.isValid ?? data.valid;
    const severity = data.severity || (isValid ? "normal" : "critical");
    const errors = data.errors || [];

    setAndon(severity);

    resultMessage.textContent = isValid
      ? "Entry passed validation and was logged to the sheet."
      : "Entry did not pass validation. Nothing was logged.";

    resultErrors.innerHTML = "";
    errors.forEach((err) => {
      const li = document.createElement("li");
      li.textContent = `· ${err}`;
      resultErrors.appendChild(li);
    });

    resultPanel.hidden = false;
  } catch (err) {
    networkError.textContent = `Couldn't reach the line: ${err.message}`;
    networkError.hidden = false;
    setAndon(null);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Log Entry";
  }
});

// ── Reset for next entry ──────────────────────────────────────
resetBtn.addEventListener("click", () => {
  form.reset();
  resultPanel.hidden = true;
  networkError.hidden = true;
  setAndon(null);
});
