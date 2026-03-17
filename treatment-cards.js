(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────
   * TAGANIMAL — treatment-add-heart-form.js
   *
   * V2 COMPLETE
   * - Wizard 1 → 6
   * - Progress bar + labels
   * - Suggestions nom
   * - Raccourcis date
   * - Choix mode fin : durée / date
   * - Preview intelligent
   * - Récapitulatif final
   * - Validation UX
   * - AJAX submit → ta_care_save
   * - Toast feedback
   *
   * Compatible avec :
   * - form-treatment.php
   * - entry-heart.js
   * - TA_HEALTH localisé via AssetRegistry
   * ───────────────────────────────────────────────────────────── */

  const LOG = "[TA_TREATMENT]";
  const log = (...args) => console.log(LOG, ...args);

  /* ── CONTEXTE WORDPRESS ──────────────────────────────────── */

  const TA = window.TA_HEALTH || null;
  if (!TA || !TA.ajax_url || !TA.nonce || !TA.post_id) {
    console.error(LOG, "TA_HEALTH manquant", TA);
    return;
  }

  const ajaxUrl = String(TA.ajax_url);
  const nonce   = String(TA.nonce);
  const postId  = String(TA.post_id);

  /* ── HELPERS DOM ─────────────────────────────────────────── */

  const $  = (sel, ctx = document) => ctx ? ctx.querySelector(sel) : null;
  const $$ = (sel, ctx = document) => ctx ? Array.from(ctx.querySelectorAll(sel)) : [];

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function getRoot() {
    return document.querySelector("[data-ta-entry-root]") || document;
  }

  function getForm(root) {
    return $('[data-ta-health-form="treatment"]', root);
  }

  function getSteps(form) {
    return $$("[data-ta-treatment-step]", form);
  }

  function getStepEl(form, n) {
    return $(`[data-ta-treatment-step="${ n }"]`, form);
  }

  function getActiveStep(form) {
    const active = getSteps(form).find(el => !el.hidden);
    return parseInt(active?.dataset.taTreatmentStep || "1", 10);
  }

  function getFieldVal(form, name) {
    return String($(`[name="${ name }"]`, form)?.value || "").trim();
  }

  function setFieldVal(form, name, value) {
    const el = $(`[name="${ name }"]`, form);
    if (el) el.value = value;
  }

  function isYmd(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
  }

  function isPositiveInt(value) {
    return /^\d+$/.test(String(value || "").trim()) && parseInt(value, 10) > 0;
  }

  /* ── UTILS DATE ──────────────────────────────────────────── */

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function yesterdayISO() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  function fmtFR(iso) {
    if (!isYmd(iso)) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function addDays(iso, days) {
    if (!isYmd(iso) || !isPositiveInt(days)) return null;

    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + parseInt(days, 10));

    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yy}-${mm}-${dd}`;
  }

  function compareYmd(a, b) {
    if (!isYmd(a) || !isYmd(b)) return 0;
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }

  /* ── ÉTAPES VISUELLES / PROGRESS BAR ─────────────────────── */

  /**
   * Position visuelle dans la barre :
   * step 1 -> 1
   * step 2 -> 2
   * step 3 -> 3
   * step 4 -> 4
   * step 5 -> 4   (date de fin = même position visuelle que durée)
   * step 6 -> 5
   */
  function getVisualStep(step) {
    if (step === 5) return 4;
    if (step === 6) return 5;
    return step;
  }

  function updateProgress(form, step) {
    const visual = getVisualStep(step);
    const fill = $("#ta-tr-progress-fill", form);
    const track = fill?.parentElement || null;
    const labels = $$("[data-tr-label]", form);

    const pctMap = {
      1: 20,
      2: 40,
      3: 60,
      4: 80,
      5: 100,
    };

    const pct = pctMap[visual] || 20;

    if (fill) {
      fill.style.width = `${pct}%`;
    }

    if (track) {
      track.setAttribute("aria-valuenow", String(pct));
    }

    labels.forEach(el => {
      const n = parseInt(el.dataset.trLabel || "0", 10);
      el.classList.toggle("is-active", n === visual);
      el.classList.toggle("is-done", n < visual);
    });
  }

  function showStep(form, step) {
    const steps = getSteps(form);
    const target = Math.max(1, Math.min(step, steps.length));

    steps.forEach(el => {
      const isActive = String(el.dataset.taTreatmentStep) === String(target);
      el.hidden = !isActive;
      el.classList.toggle("is-active", isActive);
    });

    updateProgress(form, target);

    if (target === 4) refreshDurationPreview(form);
    if (target === 5) refreshDatePreview(form);
    if (target === 6) refreshRecap(form);

    log("→ étape", target);
  }

  /* ── MODE DE FIN ─────────────────────────────────────────── */

  function getSelectedEndMode(form) {
    return String($('#ta-tr-end-mode', form)?.value || "").trim();
  }

  function setSelectedEndMode(form, mode) {
    const hidden = $("#ta-tr-end-mode", form);
    if (hidden) hidden.value = mode;

    $$('input[name="_treatment_end_mode_ui"]', form).forEach(input => {
      const checked = input.value === mode;
      input.checked = checked;

      const label = input.closest(".ta-form-freq");
      if (label) {
        label.classList.toggle("is-selected", checked);
      }
    });

    const confirmBtn = $("[data-ta-tr-mode-confirm]", form);
    if (confirmBtn) confirmBtn.disabled = !mode;
  }

  /* ── PREVIEWS ────────────────────────────────────────────── */

  function computeTreatmentEnd(form) {
    const start   = getFieldVal(form, "treatment_start");
    const mode    = getSelectedEndMode(form);
    const duration = getFieldVal(form, "treatment_duration_days");
    const endDate  = getFieldVal(form, "treatment_end_date");

    if (!isYmd(start)) {
      return {
        valid: false,
        mode,
        start,
        endISO: null,
        reason: "Date de début manquante.",
      };
    }

    if (mode === "duration") {
      if (!isPositiveInt(duration)) {
        return {
          valid: false,
          mode,
          start,
          endISO: null,
          reason: "Durée non renseignée.",
        };
      }

      const endISO = addDays(start, duration);
      if (!isYmd(endISO)) {
        return {
          valid: false,
          mode,
          start,
          endISO: null,
          reason: "Calcul de la fin impossible.",
        };
      }

      return {
        valid: true,
        mode,
        start,
        endISO,
        durationDays: parseInt(duration, 10),
        reason: null,
      };
    }

    if (mode === "date") {
      if (!isYmd(endDate)) {
        return {
          valid: false,
          mode,
          start,
          endISO: null,
          reason: "Date de fin non renseignée.",
        };
      }

      if (compareYmd(endDate, start) < 0) {
        return {
          valid: false,
          mode,
          start,
          endISO: null,
          reason: "La date de fin ne peut pas être avant le début.",
        };
      }

      return {
        valid: true,
        mode,
        start,
        endISO: endDate,
        reason: null,
      };
    }

    return {
      valid: false,
      mode,
      start,
      endISO: null,
      reason: "Mode de fin non sélectionné.",
    };
  }

  function refreshDurationPreview(form) {
    const box = $("#ta-tr-preview-duration", form);
    const dateEl = $("#ta-tr-preview-end-duration", form);
    if (!box || !dateEl) return;

    const result = computeTreatmentEnd(form);

    if (result.mode === "duration" && result.valid) {
      box.dataset.state = "reminder";
      dateEl.textContent = fmtFR(result.endISO);
    } else {
      box.dataset.state = "history";
      dateEl.textContent = "—";
    }
  }

  function refreshDatePreview(form) {
    const box = $("#ta-tr-preview-date", form);
    const dateEl = $("#ta-tr-preview-end-date", form);
    const historyBody = box ? $(".ta-form-preview__pane[data-pane='history'] .ta-form-preview__body", box) : null;

    if (!box || !dateEl) return;

    const result = computeTreatmentEnd(form);

    if (result.mode === "date" && result.valid) {
      box.dataset.state = "reminder";
      dateEl.textContent = fmtFR(result.endISO);
    } else {
      box.dataset.state = "history";
      dateEl.textContent = "—";

      if (historyBody && result.mode === "date" && result.reason) {
        historyBody.textContent = result.reason;
      }
    }
  }

  function refreshRecap(form) {
    const name = getFieldVal(form, "treatment_name");
    const start = getFieldVal(form, "treatment_start");
    const result = computeTreatmentEnd(form);

    const nameEl  = $("#ta-tr-recap-name", form);
    const startEl = $("#ta-tr-recap-start", form);
    const endEl   = $("#ta-tr-recap-end", form);

    if (nameEl)  nameEl.textContent  = name || "—";
    if (startEl) startEl.textContent = isYmd(start) ? fmtFR(start) : "—";

    if (endEl) {
      if (result.valid && result.endISO) {
        if (result.mode === "duration" && result.durationDays) {
          endEl.textContent = `${fmtFR(result.endISO)} (${result.durationDays} j)`;
        } else {
          endEl.textContent = fmtFR(result.endISO);
        }
      } else {
        endEl.textContent = "—";
      }
    }
  }

  /* ── VALIDATION UX ───────────────────────────────────────── */

  function markError(el) {
    if (!el) return;
    el.classList.add("has-error");
    try { el.focus(); } catch (e) {}
    el.addEventListener("input", () => el.classList.remove("has-error"), { once: true });
    el.addEventListener("change", () => el.classList.remove("has-error"), { once: true });
  }

  function validateStep(form, step) {
    if (step === 1) {
      const el = $('[name="treatment_name"]', form);
      if (!(el?.value || "").trim()) {
        markError(el);
        showToast("Le nom du traitement est requis.", "error");
        return false;
      }
    }

    if (step === 2) {
      const el = $('[name="treatment_start"]', form);
      if (!isYmd((el?.value || "").trim())) {
        markError(el);
        showToast("Veuillez sélectionner une date de début.", "error");
        return false;
      }
    }

    if (step === 3) {
      const mode = getSelectedEndMode(form);
      if (!mode) {
        showToast("Choisissez comment se termine le traitement.", "error");
        return false;
      }
    }

    if (step === 4) {
      const durationEl = $('[name="treatment_duration_days"]', form);
      const result = computeTreatmentEnd(form);

      if (getSelectedEndMode(form) !== "duration") {
        showToast("Mode de fin invalide.", "error");
        return false;
      }

      if (!isPositiveInt(durationEl?.value || "")) {
        markError(durationEl);
        showToast("Veuillez renseigner une durée valide.", "error");
        return false;
      }

      if (!result.valid) {
        markError(durationEl);
        showToast(result.reason || "Durée invalide.", "error");
        return false;
      }
    }

    if (step === 5) {
      const endEl = $('[name="treatment_end_date"]', form);
      const result = computeTreatmentEnd(form);

      if (getSelectedEndMode(form) !== "date") {
        showToast("Mode de fin invalide.", "error");
        return false;
      }

      if (!isYmd(endEl?.value || "")) {
        markError(endEl);
        showToast("Veuillez sélectionner une date de fin.", "error");
        return false;
      }

      if (!result.valid) {
        markError(endEl);
        showToast(result.reason || "Date de fin invalide.", "error");
        return false;
      }
    }

    return true;
  }

  /* ── TOAST ───────────────────────────────────────────────── */

  function showToast(msg, type = "info") {
    let t = $("#ta-treatment-toast");

    if (!t) {
      t = document.createElement("div");
      t.id = "ta-treatment-toast";
      document.body.appendChild(t);
    }

    t.className = `vax-toast vax-toast--${type}`;
    t.textContent = msg;
    t.hidden = false;

    clearTimeout(t._tid);
    requestAnimationFrame(() => t.classList.add("is-visible"));

    t._tid = setTimeout(() => {
      t.classList.remove("is-visible");
      setTimeout(() => { t.hidden = true; }, 220);
    }, 2800);
  }

  /* ── SUBMIT AJAX ─────────────────────────────────────────── */

  async function doSubmit(form) {
    const submitBtn = $("[data-ta-treatment-submit]", form);

    const name     = getFieldVal(form, "treatment_name");
    const start    = getFieldVal(form, "treatment_start");
    const mode     = getSelectedEndMode(form);
    const reminder = $("#ta-tr-reminder-checkbox", form)?.checked ? "1" : "0";

    const result = computeTreatmentEnd(form);

    if (!name || !isYmd(start) || !mode || !result.valid || !result.endISO) {
      showToast("Le formulaire traitement est incomplet.", "error");
      return;
    }

    const payload = new URLSearchParams({
      action: "ta_care_save",
      nonce,
      post_id: postId,
      type: "treatment",
      label: name,
      executed_at: start,
      reminder_enabled: reminder,
    });

    payload.set("meta[end_mode]", mode);

    if (mode === "duration") {
      payload.set("meta[duration_days]", getFieldVal(form, "treatment_duration_days"));
      payload.set("meta[end_date]", result.endISO);
    }

    if (mode === "date") {
      payload.set("meta[end_date]", getFieldVal(form, "treatment_end_date"));
    }

    log("SUBMIT →", {
      name,
      start,
      mode,
      reminder,
      endISO: result.endISO,
    });

    if (submitBtn) {
      submitBtn.classList.add("is-loading");
      submitBtn.disabled = true;
    }

    try {
      const res = await fetch(ajaxUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: payload.toString(),
      });

      const json = await res.json();

      if (!json?.success) {
        throw new Error(json?.data?.message || "Erreur serveur");
      }

      sessionStorage.setItem("ta_open_health_treatment", "1");
      if (json.data && json.data.care_id) {
        sessionStorage.setItem("ta_highlight_care_id", json.data.care_id);
      }

      showToast(`💊 Traitement enregistré jusqu'au ${fmtFR(result.endISO)}`, "success");

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error(LOG, err);
      showToast(err.message || "Erreur réseau", "error");

      if (submitBtn) {
        submitBtn.classList.remove("is-loading");
        submitBtn.disabled = false;
      }
    }
  }

  /* ── EVENTS ──────────────────────────────────────────────── */

  function bindEvents(root, form) {
    root.addEventListener("click", (e) => {
      /* Suggestions nom */
      const chip = e.target.closest("[data-ta-tr-suggest]");
      if (chip && form.contains(chip)) {
        const val = chip.dataset.taTrSuggest || "";
        const input = $('[name="treatment_name"]', form);
        if (input) {
          input.value = val;
          input.classList.remove("has-error");
        }
        return;
      }

      /* Raccourcis date */
      const dateShortcut = e.target.closest("[data-ta-tr-date]");
      if (dateShortcut && form.contains(dateShortcut)) {
        const input = $('[name="treatment_start"]', form);
        if (input) {
          input.value = dateShortcut.dataset.taTrDate === "yesterday"
            ? yesterdayISO()
            : todayISO();

          input.classList.remove("has-error");
          refreshDurationPreview(form);
          refreshDatePreview(form);
          refreshRecap(form);
        }
        return;
      }

      /* Durées fréquentes */
      const durationChip = e.target.closest("[data-ta-tr-duration]");
      if (durationChip && form.contains(durationChip)) {
        const val = durationChip.dataset.taTrDuration || "";
        const input = $('[name="treatment_duration_days"]', form);
        if (input) {
          input.value = val;
          input.classList.remove("has-error");
          refreshDurationPreview(form);
          refreshRecap(form);
        }
        return;
      }

      /* Navigation */
      const btn = e.target.closest(
        "[data-ta-treatment-next],[data-ta-treatment-prev],[data-ta-treatment-submit]"
      );
      if (!btn || !form.contains(btn)) return;

      e.preventDefault();

      const step = getActiveStep(form);

      if (btn.hasAttribute("data-ta-treatment-submit")) {
        if (
          validateStep(form, 1) &&
          validateStep(form, 2) &&
          validateStep(form, 3) &&
          (
            (getSelectedEndMode(form) === "duration" && validateStep(form, 4)) ||
            (getSelectedEndMode(form) === "date" && validateStep(form, 5))
          )
        ) {
          doSubmit(form);
        }
        return;
      }

      if (btn.hasAttribute("data-ta-treatment-prev")) {
        if (step === 2) return showStep(form, 1);
        if (step === 3) return showStep(form, 2);
        if (step === 4 || step === 5) return showStep(form, 3);
        if (step === 6) {
          return showStep(form, getSelectedEndMode(form) === "date" ? 5 : 4);
        }
        return;
      }

      if (btn.hasAttribute("data-ta-treatment-next")) {
        if (!validateStep(form, step)) return;

        if (step === 1) return showStep(form, 2);
        if (step === 2) return showStep(form, 3);

        if (step === 3) {
          const mode = getSelectedEndMode(form);
          return showStep(form, mode === "date" ? 5 : 4);
        }

        if (step === 4 || step === 5) {
          refreshRecap(form);
          return showStep(form, 6);
        }
      }
    });

    /* Choix mode fin via radios */
    $$('input[name="_treatment_end_mode_ui"]', form).forEach(input => {
      input.addEventListener("change", () => {
        setSelectedEndMode(form, input.value);
      });
    });

    /* Saisie durée */
    const durationEl = $('[name="treatment_duration_days"]', form);
    if (durationEl) {
      durationEl.addEventListener("input", () => {
        durationEl.classList.remove("has-error");
        refreshDurationPreview(form);
        refreshRecap(form);
      });
    }

    /* Saisie date début */
    const startEl = $('[name="treatment_start"]', form);
    if (startEl) {
      startEl.addEventListener("change", () => {
        startEl.classList.remove("has-error");
        refreshDurationPreview(form);
        refreshDatePreview(form);
        refreshRecap(form);
      });
    }

    /* Saisie date fin */
    const endDateEl = $('[name="treatment_end_date"]', form);
    if (endDateEl) {
      endDateEl.addEventListener("change", () => {
        endDateEl.classList.remove("has-error");
        refreshDatePreview(form);
        refreshRecap(form);
      });
    }
  }

  /* ── INIT ────────────────────────────────────────────────── */

  function init() {
    const root = getRoot();
    const form = getForm(root);

    if (!form) {
      log("formulaire traitement introuvable — abandon");
      return;
    }

    const startEl = $('[name="treatment_start"]', form);
    if (startEl && !startEl.value) {
      startEl.value = todayISO();
    }

    setSelectedEndMode(form, "");
    refreshDurationPreview(form);
    refreshDatePreview(form);
    refreshRecap(form);

    showStep(form, 1);
    bindEvents(root, form);

    log("READY");
  }

  onReady(init);
})();