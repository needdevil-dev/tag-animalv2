(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────
   * antiparasite-heart-form.js
   *
   * Responsabilités :
   *  1. Navigation wizard (étapes 1→2→3)
   *  2. Barre de progression
   *  3. Raccourcis date / suggestions nom
   *  4. Badge "date passée"
   *  5. Aperçu intelligent (rappel ou historique)
   *  6. Validation UX
   *  7. Soumission AJAX → ta_protection_administer
   *  8. Toast feedback
   *
   * Zéro style inline. Tout passe par des classes CSS.
   * La décision finale du cycle reste côté PHP.
   * ───────────────────────────────────────────────────────────── */

  const LOG = "[TA_AP]";
  const log = (...a) => console.log(LOG, ...a);

  /* ── CONTEXTE WORDPRESS ──────────────────────────────────── */

  const TA = window.TA_HEALTH || null;
  if (!TA || !TA.ajax_url || !TA.nonce || !TA.post_id) {
    console.error(LOG, "TA_HEALTH manquant", TA);
    return;
  }

  const ajaxUrl = String(TA.ajax_url);
  const nonce   = String(TA.nonce);
  const postId  = String(TA.post_id);

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
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function addMonths(iso, n) {
    if (!iso || n <= 0) return null;
    const [y, m, d] = iso.split("-").map(Number);
    const total  = m - 1 + n;
    const newY   = y + Math.floor(total / 12);
    const newM   = ((total % 12) + 12) % 12;
    const maxD   = new Date(newY, newM + 1, 0).getDate();
    const finalD = Math.min(d, maxD);
    const pad    = v => String(v).padStart(2, "0");
    return `${newY}-${pad(newM + 1)}-${pad(finalD)}`;
  }

  function isDatePast(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    return iso < todayISO();
  }

  /* ── RÈGLE MÉTIER RAPPEL ─────────────────────────────────── */

  function computeReminder(executedAt, months) {
    const today = todayISO();

    if (months <= 0) {
      return { active: false, nextDueISO: null, reason: "Aucun rappel sélectionné." };
    }

    if (!executedAt || !/^\d{4}-\d{2}-\d{2}$/.test(executedAt)) {
      return { active: false, nextDueISO: null, reason: "Date d'administration manquante." };
    }

    const nextDueISO = addMonths(executedAt, months);
    if (!nextDueISO) {
      return { active: false, nextDueISO: null, reason: "Calcul de la date impossible." };
    }

    if (nextDueISO <= today) {
      return {
        active: false,
        nextDueISO,
        reason: `Le prochain rappel (${fmtFR(nextDueISO)}) est déjà dépassé.`,
      };
    }

    return { active: true, nextDueISO, reason: null };
  }

  /* ── SÉLECTEURS ──────────────────────────────────────────── */

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const getRoot  = ()  => $("[data-ta-entry-root]");
  const getForm  = (r) => $('[data-ta-health-form="antiparasite"]', r);
  const getSteps = (f) => $$("[data-ta-ap-step]", f);

  function getActiveN(form) {
    const active = getSteps(form).find(el => !el.hidden);
    return parseInt(active?.dataset.taApStep ?? "1", 10);
  }

  function getMonths(form) {
    const el = $('[name="reminder_delay_months"]:checked', form);
    return el ? parseInt(el.value, 10) : 1;
  }

  function getFieldVal(form, name) {
    return ($(`[name="${name}"]`, form)?.value ?? "").trim();
  }

  /* ── BARRE DE PROGRESSION ────────────────────────────────── */

  function updateProgress(form, current) {
    const scope = form.closest("[data-ta-entry-root]") ?? document;

    $$("[data-prog]", scope).forEach(el => {
      const n = parseInt(el.dataset.prog, 10);
      el.classList.toggle("is-active", n === current);
      el.classList.toggle("is-done", n < current);
    });

    $$(".ta-form-progress__line", scope).forEach((line, i) => {
      line.classList.toggle("is-done", i < current - 1);
    });
  }

  /* ── NAVIGATION ──────────────────────────────────────────── */

  function showStep(form, n) {
    const steps  = getSteps(form);
    const target = Math.max(1, Math.min(n, steps.length));

    steps.forEach(el => {
      el.hidden = String(el.dataset.taApStep) !== String(target);
    });

    updateProgress(form, target);

    if (target === 3) refreshPreview(form);

    log("→ étape", target);
  }

  /* ── APERÇU INTELLIGENT ──────────────────────────────────── */

  function refreshPreview(form) {
    const preview = $("#ta-ap-preview", form);
    if (!preview) return;

    const executedAt = getFieldVal(form, "executed_at");
    const months     = getMonths(form);
    const result     = computeReminder(executedAt, months);

    preview.dataset.state = result.active ? "reminder" : "history";

    const reminderEnabled = $('[name="reminder_enabled"]', form);
    if (reminderEnabled) {
      reminderEnabled.value = result.active ? "1" : "0";
    }

    if (result.active) {
      const el = $("#ta-ap-preview-date", form);
      if (el) el.textContent = fmtFR(result.nextDueISO);
    } else {
      const el = $("#ta-ap-preview-reason", form);
      if (el) el.textContent = result.reason || "Aucun rappel ne sera créé.";
    }

    log("Aperçu →", result.active
      ? `rappel actif — ${result.nextDueISO}`
      : `historique — ${result.reason}`);
  }

  /* ── BADGE DATE PASSÉE ───────────────────────────────────── */

  function refreshDateBadge(form, iso) {
    const badge = $("#ta-ap-past-badge", form);
    const span  = badge ? badge.querySelector("span") : null;

    if (!badge || !span) return;

    if (!iso) {
      badge.hidden = true;
      return;
    }

    const months = getMonths(form);
    const result = computeReminder(iso, months);

    if (!result.active && result.nextDueISO && isDatePast(result.nextDueISO)) {
      span.textContent = `Le prochain rappel calculé (${fmtFR(result.nextDueISO)}) est déjà passé. Ce soin sera enregistré dans l'historique uniquement.`;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  /* ── VALIDATION UX ───────────────────────────────────────── */

  function validateStep(form, n) {
    if (n === 1) {
      const el = $('[name="antiparasite_name"]', form);
      if (!(el?.value ?? "").trim()) {
        markError(el);
        showToast("Le nom du produit est requis.", "error");
        return false;
      }
    }

    if (n === 2) {
      const el = $('[name="executed_at"]', form);
      if (!/^\d{4}-\d{2}-\d{2}$/.test((el?.value ?? "").trim())) {
        markError(el);
        showToast("Veuillez sélectionner une date.", "error");
        return false;
      }
    }

    return true;
  }

  function markError(el) {
    if (!el) return;
    el.classList.add("has-error");
    el.focus();
    el.addEventListener(
      "input",
      () => el.classList.remove("has-error"),
      { once: true }
    );
  }

  /* ── TOAST ───────────────────────────────────────────────── */

  function showToast(msg, type = "info") {
    let t = $("#ta-ap-toast");

    if (!t) {
      t = document.createElement("div");
      t.id = "ta-ap-toast";
      document.body.appendChild(t);
    }

    t.className   = `vax-toast vax-toast--${type}`;
    t.textContent = msg;
    t.hidden      = false;

    clearTimeout(t._tid);
    requestAnimationFrame(() => t.classList.add("is-visible"));

    t._tid = setTimeout(() => {
      t.classList.remove("is-visible");
      setTimeout(() => { t.hidden = true; }, 200);
    }, 2800);
  }

  /* ── ÉVÉNEMENTS ──────────────────────────────────────────── */

  function bindEvents(root, form) {
    root.addEventListener("click", e => {
      const chip = e.target.closest("[data-ta-ap-suggest]");
      if (chip && form.contains(chip)) {
        const inp = $('[name="antiparasite_name"]', form);
        if (inp) {
          inp.value = chip.dataset.taApSuggest;
          inp.classList.remove("has-error");
        }
        return;
      }

      const sc = e.target.closest("[data-ta-ap-date]");
      if (sc && form.contains(sc)) {
        const inp = $('[name="executed_at"]', form);
        if (inp) {
          inp.value = sc.dataset.taApDate === "yesterday" ? yesterdayISO() : todayISO();
          refreshDateBadge(form, inp.value);
          refreshPreview(form);
        }
        return;
      }

      const btn = e.target.closest("[data-ta-ap-next],[data-ta-ap-prev],[data-ta-ap-submit]");
      if (!btn || !form.contains(btn)) return;
      e.preventDefault();

      const n = getActiveN(form);

      if (btn.hasAttribute("data-ta-ap-submit")) {
        if (validateStep(form, 1) && validateStep(form, 2)) {
          doSubmit(form);
        }
        return;
      }

      if (btn.hasAttribute("data-ta-ap-next")) {
        if (validateStep(form, n)) {
          showStep(form, n + 1);
        }
        return;
      }

      if (btn.hasAttribute("data-ta-ap-prev")) {
        showStep(form, n - 1);
      }
    });

    const dateInp = $('[name="executed_at"]', form);
    if (dateInp) {
      dateInp.addEventListener("change", () => {
        refreshDateBadge(form, dateInp.value);
        refreshPreview(form);
      });
    }

    $$('[name="reminder_delay_months"]', form).forEach(r => {
      r.addEventListener("change", () => {
        refreshDateBadge(form, getFieldVal(form, "executed_at"));
        refreshPreview(form);
      });
    });
  }

  /* ── SOUMISSION AJAX ─────────────────────────────────────── */

  async function doSubmit(form) {
    const submitBtn = $("[data-ta-ap-submit]", form);
    const name      = getFieldVal(form, "antiparasite_name");
    const date      = getFieldVal(form, "executed_at");
    const months    = getMonths(form);
    const reminder  = computeReminder(date, months);

    const payload = new URLSearchParams({
      action:          "ta_protection_administer",
      nonce,
      post_id:         postId,
      type:            "antiparasite",
      scope:           "external",
      label:           name,
      executed_at:     date,
      interval_months: String(months),
      reminder_enabled: reminder.active ? "1" : "0",
    });

    log("SUBMIT →", {
      name,
      date,
      months,
      active: reminder.active,
      nextDue: reminder.nextDueISO
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
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: payload.toString(),
      });

      const json = await res.json();
      if (!json?.success) {
        throw new Error(json?.data?.message || "Erreur serveur");
      }

      const isActive = reminder.active;

      sessionStorage.setItem("ta_open_health_reminders", "1");
      if (json.data && json.data.care_id) {
        sessionStorage.setItem("ta_highlight_care_id", json.data.care_id);
      }

      showToast(
        isActive
          ? `🔔 Rappel programmé le ${fmtFR(reminder.nextDueISO)}`
          : "📋 Enregistré dans l'historique",
        "success"
      );

      setTimeout(() => {
        if (isActive) {
          window.location.hash = "#ta-screen-health";
        }
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

  /* ── INIT ────────────────────────────────────────────────── */

  function init() {
    const root = getRoot();
    const form = getForm(root);

    if (!form) {
      log("formulaire introuvable — abandon");
      return;
    }

    const dateInp = $('[name="executed_at"]', form);
    if (dateInp && !dateInp.value) {
      dateInp.value = todayISO();
      refreshDateBadge(form, dateInp.value);
    }

    showStep(form, 1);
    bindEvents(root, form);
    refreshPreview(form);

    log("READY");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();