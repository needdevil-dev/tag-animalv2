(function () {
  "use strict";

  /**
   * =========================================================
   * TAGANIMAL — VERMIFUGE HEART FORM
   * =========================================================
   *
   * Objectif :
   * Reproduire le même comportement premium que le formulaire
   * antiparasite, mais adapté au vermifuge.
   *
   * Responsabilités :
   *  1. Navigation wizard 3 étapes
   *  2. Barre de progression visuelle
   *  3. Suggestions de nom produit
   *  4. Raccourcis de date (aujourd'hui / hier)
   *  5. Badge "rappel déjà dépassé"
   *  6. Aperçu intelligent :
   *       - rappel futur
   *       - historique uniquement
   *  7. Soumission AJAX vers ta_protection_administer
   *  8. Mise à jour fréquence depuis les cartes existantes
   *
   * Règles :
   * - Zéro logique métier finale côté JS
   * - Le PHP reste source de vérité
   * - Le JS ne fait que guider l’UX et envoyer les données
   * =========================================================
   */

  const LOG = "[TA_VERMIFUGE]";

  const TA = window.TA_HEALTH || null;
  if (!TA || !TA.ajax_url || !TA.nonce || !TA.post_id) {
    console.error(LOG, "TA_HEALTH missing");
    return;
  }

  const ajaxUrl = String(TA.ajax_url);
  const nonce   = String(TA.nonce);
  const postId  = String(TA.post_id);

  /* =========================================================
   * UTILS GÉNÉRAUX
   * ========================================================= */

  function log(...args) {
    console.log(LOG, ...args);
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function qs(root, selector) {
    return root ? root.querySelector(selector) : null;
  }

  function qsa(root, selector) {
    return root ? Array.from(root.querySelectorAll(selector)) : [];
  }

  function getValue(form, selector) {
    return (qs(form, selector)?.value || "").trim();
  }

  function isYmd(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
  }

  function toInt(value, fallback = 0) {
    const n = parseInt(String(value || ""), 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateFr(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  function todayYmd() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function yesterdayYmd() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseYmdToDate(ymd) {
    if (!isYmd(ymd)) return null;
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0, 0); // midi pour éviter certains décalages TZ
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function addMonthsSafe(date, months) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

    const source = new Date(date.getTime());
    const day = source.getDate();

    const result = new Date(source.getTime());
    result.setDate(1);
    result.setMonth(result.getMonth() + months);

    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, lastDay));

    return result;
  }

  function isPastDay(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;

    const now = new Date();
    const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return a < b;
  }

  function disableButtonTemporarily(btn, disabled) {
    if (!btn) return;
    btn.disabled = !!disabled;
    btn.classList.toggle("is-loading", !!disabled);
    btn.setAttribute("aria-busy", disabled ? "true" : "false");
  }

  /* =========================================================
   * PROGRESSION / WIZARD
   * ========================================================= */

  function getSteps(form) {
    return qsa(form, "[data-ta-vm-step]");
  }

  function getCurrentStep(form) {
    const active = getSteps(form).find((step) => !step.hidden);
    return toInt(active?.dataset.taVmStep || form.dataset.taStep || "1", 1);
  }

  function syncProgress(form, stepNumber) {
    const items = qsa(form, ".ta-form-progress__item[data-prog]");

    items.forEach((item) => {
      const prog = toInt(item.dataset.prog, 0);
      item.classList.toggle("is-current", prog === stepNumber);
      item.classList.toggle("is-done", prog < stepNumber);
      item.classList.toggle("is-upcoming", prog > stepNumber);
    });
  }

  function showStep(form, stepNumber) {
    const steps = getSteps(form);

    steps.forEach((step) => {
      const active = String(step.dataset.taVmStep) === String(stepNumber);
      step.hidden = !active;
      step.classList.toggle("is-active", active);
    });

    form.dataset.taStep = String(stepNumber);
    syncProgress(form, stepNumber);
    log("step", stepNumber);
  }

  /* =========================================================
   * UI — SUGGESTIONS / DATES / PREVIEW
   * ========================================================= */

  function fillSuggestedName(form, value) {
    const input = qs(form, '[name="vermifuge_name"]');
    if (!input) return;

    input.value = String(value || "").trim();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
  }

  function setExecutedDate(form, ymd) {
    const input = qs(form, '[name="executed_at"]');
    if (!input || !isYmd(ymd)) return;

    input.value = ymd;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    updateVermifugePreview(form);
  }

  function getSelectedFrequency(form) {
    const checked = qs(form, 'input[name="reminder_delay_months"]:checked');
    return toInt(checked?.value || "0", 0);
  }

  function updatePastBadge(form) {
    const badge = qs(form, "#ta-vm-past-badge");
    const badgeText = qs(form, "#ta-vm-past-badge span");
    const date = parseYmdToDate(getValue(form, '[name="executed_at"]'));
    const months = getSelectedFrequency(form);

    if (!badge || !badgeText) return;

    // Si pas de date valide, on cache
    if (!date) {
      badge.hidden = true;
      badgeText.textContent = "";
      return;
    }

    // Sans rappel => pas de badge "rappel dépassé"
    if (months <= 0) {
      badge.hidden = true;
      badgeText.textContent = "";
      return;
    }

    const nextDue = addMonthsSafe(date, months);
    const overdue = nextDue && isPastDay(nextDue);

    if (overdue) {
      badge.hidden = false;
      badgeText.textContent = `Le prochain rappel théorique (${formatDateFr(nextDue)}) est déjà dépassé.`;
    } else {
      badge.hidden = true;
      badgeText.textContent = "";
    }
  }

  function updateVermifugePreview(form) {
    const preview = qs(form, "#ta-vm-preview");
    const previewDate = qs(form, "#ta-vm-preview-date");
    const previewReason = qs(form, "#ta-vm-preview-reason");

    if (!preview || !previewDate || !previewReason) return;

    const executedAt = getValue(form, '[name="executed_at"]');
    const date = parseYmdToDate(executedAt);
    const months = getSelectedFrequency(form);

    // Cas incomplet : on reste neutre
    if (!date) {
      preview.dataset.state = "history";
      previewDate.textContent = "—";
      previewReason.textContent = "Choisissez une date pour calculer l’aperçu.";
      updatePastBadge(form);
      return;
    }

    // Sans rappel = historique seulement
    if (months <= 0) {
      preview.dataset.state = "history";
      previewDate.textContent = "—";
      previewReason.textContent = "Ce vermifuge sera ajouté à l’historique sans rappel.";
      updatePastBadge(form);
      return;
    }

    const nextDue = addMonthsSafe(date, months);

    if (!nextDue) {
      preview.dataset.state = "history";
      previewDate.textContent = "—";
      previewReason.textContent = "Impossible de calculer la prochaine date de rappel.";
      updatePastBadge(form);
      return;
    }

    // Si la prochaine échéance est déjà passée, on affiche "historique uniquement"
    if (isPastDay(nextDue)) {
      preview.dataset.state = "history";
      previewDate.textContent = formatDateFr(nextDue);
      previewReason.textContent = `Le rappel théorique du ${formatDateFr(nextDue)} est déjà passé. L’entrée ira dans l’historique.`;
      updatePastBadge(form);
      return;
    }

    // Cas nominal : rappel actif
    preview.dataset.state = "reminder";
    previewDate.textContent = formatDateFr(nextDue);
    previewReason.textContent = "";
    updatePastBadge(form);
  }

  /* =========================================================
   * VALIDATION PAR ÉTAPE
   * ========================================================= */

  function validateStep1(form) {
    const value = getValue(form, '[name="vermifuge_name"]');
    if (!value) {
      alert("Nom du vermifuge requis.");
      return false;
    }
    return true;
  }

  function validateStep2(form) {
    const date = getValue(form, '[name="executed_at"]');
    if (!isYmd(date)) {
      alert("Date invalide (format YYYY-MM-DD).");
      return false;
    }
    return true;
  }

  function validateBeforeSubmit(form) {
    return validateStep1(form) && validateStep2(form);
  }

  /* =========================================================
   * AJAX — SOUMISSION
   * ========================================================= */

  async function submitVermifuge(form, submitBtn) {
    const name = getValue(form, '[name="vermifuge_name"]');
    const date = getValue(form, '[name="executed_at"]');
    const freq = getSelectedFrequency(form);
    const scope = getValue(form, '[name="scope"]') || "external";

    if (!validateBeforeSubmit(form)) return;

    const payload = new URLSearchParams({
      action: "ta_protection_administer",
      nonce,
      post_id: postId,
      type: "vermifuge",
      scope: scope,
      label: name,
      executed_at: date,
      interval_months: String(freq)
    });

    disableButtonTemporarily(submitBtn, true);

    try {
      const response = await fetch(ajaxUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload.toString()
      });

      const json = await response.json();

      if (!json || !json.success) {
        alert(json?.data?.message || "Erreur serveur");
        return;
      }

      log("saved", json);
      window.location.reload();
    } catch (error) {
      console.error(LOG, error);
      alert("Erreur réseau");
    } finally {
      disableButtonTemporarily(submitBtn, false);
    }
  }

  /* =========================================================
   * AJAX — UPDATE FREQUENCY DEPUIS LES CARTES EXISTANTES
   * ========================================================= */

  async function updateFrequency(cycleId, months) {
    if (!cycleId) return;

    const payload = new URLSearchParams({
      action: "ta_protection_update_frequency",
      nonce,
      post_id: postId,
      cycle_id: String(cycleId),
      interval_months: String(months)
    });

    try {
      const response = await fetch(ajaxUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload.toString()
      });

      const json = await response.json();

      if (!json || !json.success) {
        alert(json?.data?.message || "Erreur serveur");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(LOG, error);
      alert("Erreur réseau");
    }
  }

  /* =========================================================
   * BINDINGS DU FORMULAIRE
   * ========================================================= */

  function bindSuggestions(form) {
    form.addEventListener("click", function (e) {
      const chip = e.target.closest("[data-ta-vm-suggest]");
      if (!chip) return;

      e.preventDefault();
      fillSuggestedName(form, chip.dataset.taVmSuggest || "");
    });
  }

  function bindDateShortcuts(form) {
    form.addEventListener("click", function (e) {
      const shortcut = e.target.closest("[data-ta-vm-date]");
      if (!shortcut) return;

      e.preventDefault();

      const action = String(shortcut.dataset.taVmDate || "").trim();

      if (action === "today") {
        setExecutedDate(form, todayYmd());
      } else if (action === "yesterday") {
        setExecutedDate(form, yesterdayYmd());
      }
    });
  }

  function bindReactivePreview(form) {
    form.addEventListener("change", function (e) {
      const target = e.target;

      if (
        target.matches('[name="executed_at"]') ||
        target.matches('input[name="reminder_delay_months"]')
      ) {
        updateVermifugePreview(form);
      }
    });

    form.addEventListener("input", function (e) {
      const target = e.target;
      if (target.matches('[name="executed_at"]')) {
        updateVermifugePreview(form);
      }
    });
  }

  function bindWizardNavigation(form) {
    form.addEventListener("click", async function (e) {
      const next = e.target.closest("[data-ta-vm-next]");
      const prev = e.target.closest("[data-ta-vm-prev]");
      const submit = e.target.closest("[data-ta-vm-submit]");

      if (!next && !prev && !submit) return;

      e.preventDefault();

      const steps = getSteps(form);
      const last = steps.length || 3;
      const current = getCurrentStep(form);

      // SUBMIT
      if (submit) {
        await submitVermifuge(form, submit);
        return;
      }

      // PREV
      if (prev) {
        showStep(form, Math.max(current - 1, 1));
        return;
      }

      // NEXT
      if (next) {
        if (current === 1 && !validateStep1(form)) return;
        if (current === 2 && !validateStep2(form)) return;

        showStep(form, Math.min(current + 1, last));
        updateVermifugePreview(form);
      }
    });
  }

  function bindGlobalFrequencySelects() {
    const root = document.querySelector("[data-ta-entry-root]");
    if (!root) return;

    root.addEventListener("change", function (e) {
      const select = e.target.closest("[data-ta-frequency-select]");
      if (!select) return;

      const cycleId = select.dataset.cycleId || "";
      const months = toInt(select.value || "0", 0);

      updateFrequency(cycleId, months);
    });
  }

  /* =========================================================
   * INIT FORM
   * ========================================================= */

  function initVermifugeForm(form) {
    log("init form");

    const steps = getSteps(form);
    if (!steps.length) {
      console.warn(LOG, "no steps found");
      return;
    }

    bindSuggestions(form);
    bindDateShortcuts(form);
    bindReactivePreview(form);
    bindWizardNavigation(form);

    showStep(form, 1);
    updateVermifugePreview(form);
  }

  /* =========================================================
   * BOOT
   * ========================================================= */

  onReady(function () {
    const forms = document.querySelectorAll('[data-ta-health-form="vermifuge"]');

    if (!forms.length) {
      console.warn(LOG, "no form found");
      return;
    }

    forms.forEach(initVermifugeForm);
    bindGlobalFrequencySelects();

    log("ready");
  });
})();