/**
 * =========================================================
 * TAGANIMAL — Observation Journal Wizard
 * Fichier : assets/js/journal/observation-journal-form.js
 * =========================================================
 */
(function () {
  "use strict";

  const LOG = "[TA_OBSERVATION]";
  const STEPS = ["cat", "level", "duration", "note", "date"];
  const DEFAULT_ACTION = "ta_observation_save";

  function log(...args) {
    console.log(LOG, ...args);
  }

  function warn(...args) {
    console.warn(LOG, ...args);
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }
    fn();
  }

  function qs(root, selector) {
    return root ? root.querySelector(selector) : null;
  }

  function qsa(root, selector) {
    return root ? Array.from(root.querySelectorAll(selector)) : [];
  }

  function todayIso() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function parseJsonSafe(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  }

  function createToast(message, type) {
    let toast = document.querySelector(".ta-form-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "ta-form-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message || "";
    toast.className = `ta-form-toast ta-form-toast--${type || "success"} is-visible`;

    window.clearTimeout(createToast._timer);
    createToast._timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  onReady(() => {
    const entryRoot = document.querySelector(
      "[data-ta-entry-root='journal'], [data-ta-entry-root='health']"
    );
    const root = document.querySelector(
      "[data-ta-observation-root='journal'], [data-ta-observation-root='health']"
    );

    if (!entryRoot || !root) return;

    if (root.dataset.taObservationBooted === "1") return;
    root.dataset.taObservationBooted = "1";

    const ui = {
      screens: qsa(root, "[data-observation-screen]"),
      catButtons: qsa(root, "[data-observation-cat], [data-ta-cat]"),
      levelButtons: qsa(root, "[data-observation-level], [data-level]"),
      durationButtons: qsa(root, "[data-observation-duration], [data-duration]"),
      noteInput: qs(root, "[data-observation-note], [data-observation-input]"),
      dateInput: qs(root, "[data-observation-date]"),
      nextButton: qs(root, "[data-observation-next]"),
      saveButton: qs(root, "[data-observation-save]"),
      progressFill: qs(root, "[data-observation-progress]"),
      progressLabels: qsa(root, "[data-observation-step-label]"),
      hiddenCat: qs(root, "[data-observation-cat-value]"),
      hiddenLevel: qs(root, "[data-observation-level-value]"),
      hiddenDuration: qs(root, "[data-observation-duration-value]")
    };

    const state = {
      step: "cat",
      category: "",
      level: "",
      duration: "",
      note: "",
      date: ui.dateInput && ui.dateInput.value ? ui.dateInput.value : todayIso(),
      saving: false,
      lastEntryState: entryRoot.getAttribute("data-entry-state") || "home"
    };

    function isObservationScreenActive() {
      return (entryRoot.getAttribute("data-entry-state") || "home") === "observation";
    }

    function getAjaxUrl() {
      if (window.TA_JOURNAL && window.TA_JOURNAL.ajax_url) {
        return window.TA_JOURNAL.ajax_url;
      }
      if (window.ajaxurl) {
        return window.ajaxurl;
      }
      return "/wp-admin/admin-ajax.php";
    }

    function getNonce() {
      if (window.TA_JOURNAL && window.TA_JOURNAL.nonce) {
        return window.TA_JOURNAL.nonce;
      }
      return root.getAttribute("data-nonce") || "";
    }

    function getPostId() {
      if (window.TA_JOURNAL && typeof window.TA_JOURNAL.post_id !== "undefined") {
        return String(window.TA_JOURNAL.post_id || "");
      }
      return root.getAttribute("data-post-id") || "";
    }

    function getActionName() {
      return root.getAttribute("data-observation-action") || DEFAULT_ACTION;
    }

    function syncHiddenFields() {
      if (ui.hiddenCat) ui.hiddenCat.value = state.category;
      if (ui.hiddenLevel) ui.hiddenLevel.value = state.level;
      if (ui.hiddenDuration) ui.hiddenDuration.value = state.duration;
    }

    function syncInputsFromState() {
      if (ui.noteInput) ui.noteInput.value = state.note;
      if (ui.dateInput) ui.dateInput.value = state.date || todayIso();
      syncHiddenFields();
    }

    function syncStateFromInputs() {
      if (ui.noteInput) state.note = ui.noteInput.value.trim();
      if (ui.dateInput) state.date = ui.dateInput.value || todayIso();
    }

    function toggleSelected(buttons, getter, value) {
      buttons.forEach((btn) => {
        const active = getter(btn) === value;
        btn.classList.toggle("is-selected", active);
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function syncSelectedButtons() {
      toggleSelected(
        ui.catButtons,
        (btn) => btn.getAttribute("data-observation-cat") || btn.getAttribute("data-ta-cat") || "",
        state.category
      );

      toggleSelected(
        ui.levelButtons,
        (btn) => btn.getAttribute("data-observation-level") || btn.getAttribute("data-level") || "",
        String(state.level)
      );

      toggleSelected(
        ui.durationButtons,
        (btn) => btn.getAttribute("data-observation-duration") || btn.getAttribute("data-duration") || "",
        state.duration
      );
    }

    function updateProgress() {
      const index = STEPS.indexOf(state.step);
      const safeIndex = index < 0 ? 0 : index;
      const percent = ((safeIndex + 1) / STEPS.length) * 100;

      if (ui.progressFill) {
        ui.progressFill.style.width = `${percent}%`;
      }

      ui.progressLabels.forEach((label, i) => {
        label.classList.toggle("is-active", i === safeIndex);
        label.classList.toggle("is-done", i < safeIndex);
      });
    }

    function renderSteps() {
      ui.screens.forEach((screen) => {
        const screenName = screen.getAttribute("data-observation-screen");
        const active = screenName === state.step;
        screen.hidden = !active;
        screen.classList.toggle("is-active", active);
      });

      syncHiddenFields();
      syncSelectedButtons();
      updateProgress();
    }

    function setStep(nextStep) {
      if (!STEPS.includes(nextStep)) {
        warn("Étape inconnue :", nextStep);
        return;
      }

      state.step = nextStep;
      renderSteps();
      log("step →", state.step);
    }

    function previousStep() {
      const idx = STEPS.indexOf(state.step);
      if (idx <= 0) return false;
      setStep(STEPS[idx - 1]);
      return true;
    }

    function resetWizard() {
      state.step = "cat";
      state.category = "";
      state.level = "";
      state.duration = "";
      state.note = "";
      state.date = todayIso();
      state.saving = false;

      syncInputsFromState();
      syncSelectedButtons();
      renderSteps();

      if (ui.saveButton) {
        ui.saveButton.disabled = false;
        ui.saveButton.classList.remove("is-loading");
      }

      log("wizard reset");
    }

    function goHomeThroughRouter() {
      const firstBackBtn = qs(root, '[data-observation-screen="cat"] [data-entry-back]');
      if (firstBackBtn) {
        firstBackBtn.click();
        return;
      }

      entryRoot.setAttribute("data-entry-state", "home");
      qsa(entryRoot, "[data-entry-screen]").forEach((screen) => {
        screen.hidden = screen.getAttribute("data-entry-screen") !== "home";
      });

      const title = qs(entryRoot, "[data-ta-entry-title] span");
      if (title) {
        const ctx = entryRoot.getAttribute("data-ta-entry-root");
        title.textContent = ctx === "health" ? "➕ Ajouter un soin" : "📓 Journal de vie";
      }
    }

    function validateBeforeSave() {
      syncStateFromInputs();

      if (!state.category) {
        setStep("cat");
        createToast("Choisissez un type d’observation.", "error");
        return false;
      }

      if (!state.level) {
        setStep("level");
        createToast("Choisissez une intensité.", "error");
        return false;
      }

      if (!state.duration) {
        setStep("duration");
        createToast("Choisissez une durée.", "error");
        return false;
      }

      if (!state.date) {
        setStep("date");
        createToast("Choisissez une date.", "error");
        return false;
      }

      return true;
    }

    async function saveObservation() {
      if (state.saving) return;
      if (!validateBeforeSave()) return;

      const ajaxUrl = getAjaxUrl();
      const nonce = getNonce();
      const postId = getPostId();
      const action = getActionName();

      if (!postId) {
        createToast("post_id introuvable pour l’enregistrement.", "error");
        warn("post_id introuvable");
        return;
      }

      const formData = new FormData();
      formData.append("action", action);
      formData.append("nonce", nonce);
      formData.append("post_id", String(postId));

      formData.append("category", state.category);
      formData.append("level", String(state.level));
      formData.append("duration", state.duration);
      formData.append("note", state.note);
      formData.append("observed_at", state.date);

      formData.append("observation_category", state.category);
      formData.append("observation_level", String(state.level));
      formData.append("observation_duration", state.duration);
      formData.append("description", state.note);
      formData.append("entry_date", state.date);
      formData.append("date", state.date);
      formData.append("type", "observation");
      formData.append("kind", "observation");
      const obsCtx = entryRoot.getAttribute("data-ta-entry-root") || "journal";
      formData.append("source", obsCtx);

      state.saving = true;

      if (ui.saveButton) {
        ui.saveButton.disabled = true;
        ui.saveButton.classList.add("is-loading");
      }

      try {
        const response = await fetch(ajaxUrl, {
          method: "POST",
          body: formData,
          credentials: "same-origin"
        });

        const raw = await response.text();
        const json = parseJsonSafe(raw);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (!json) {
          throw new Error("Réponse JSON invalide.");
        }

        if (!json.success) {
          const message =
            (json.data && (json.data.message || json.data.error)) ||
            "Erreur lors de l’enregistrement.";
          throw new Error(message);
        }

        createToast("Observation enregistrée.", "success");

        document.dispatchEvent(new CustomEvent("ta:journal:refresh", {
          detail: { type: "observation", response: json.data || null }
        }));

        document.dispatchEvent(new CustomEvent("ta:history:refresh", {
          detail: { type: "observation", response: json.data || null }
        }));

        resetWizard();
        goHomeThroughRouter();
      } catch (error) {
        console.error(LOG, error);
        createToast(error.message || "Erreur serveur.", "error");
      } finally {
        state.saving = false;

        if (ui.saveButton) {
          ui.saveButton.disabled = false;
          ui.saveButton.classList.remove("is-loading");
        }
      }
    }

    function handleCategoryClick(button) {
      state.category =
        button.getAttribute("data-observation-cat") ||
        button.getAttribute("data-ta-cat") ||
        "";

      syncHiddenFields();
      syncSelectedButtons();
      setStep("level");
    }

    function handleLevelClick(button) {
      state.level =
        button.getAttribute("data-observation-level") ||
        button.getAttribute("data-level") ||
        "";

      syncHiddenFields();
      syncSelectedButtons();
      setStep("duration");
    }

    function handleDurationClick(button) {
      state.duration =
        button.getAttribute("data-observation-duration") ||
        button.getAttribute("data-duration") ||
        "";

      syncHiddenFields();
      syncSelectedButtons();
      setStep("note");
    }

    // Retour interne wizard : gère data-observation-back ET data-entry-back
    root.addEventListener(
      "click",
      (event) => {
        if (!isObservationScreenActive()) return;

        const backBtn = event.target.closest("[data-observation-back], [data-entry-back]");
        if (!backBtn || !root.contains(backBtn)) return;

        if (state.step !== "cat") {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          previousStep();
        }
      },
      true
    );

    root.addEventListener("click", (event) => {
      if (!isObservationScreenActive()) return;

      const catBtn = event.target.closest("[data-observation-cat], [data-ta-cat]");
      if (catBtn && root.contains(catBtn)) {
        event.preventDefault();
        handleCategoryClick(catBtn);
        return;
      }

      const levelBtn = event.target.closest("[data-observation-level], [data-level]");
      if (levelBtn && root.contains(levelBtn)) {
        event.preventDefault();
        handleLevelClick(levelBtn);
        return;
      }

      const durationBtn = event.target.closest("[data-observation-duration], [data-duration]");
      if (durationBtn && root.contains(durationBtn)) {
        event.preventDefault();
        handleDurationClick(durationBtn);
        return;
      }

      const nextBtn = event.target.closest("[data-observation-next]");
      if (nextBtn && root.contains(nextBtn)) {
        event.preventDefault();
        syncStateFromInputs();
        setStep("date");
        return;
      }

      const saveBtn = event.target.closest("[data-observation-save]");
      if (saveBtn && root.contains(saveBtn)) {
        event.preventDefault();
        saveObservation();
      }
    });

    if (ui.noteInput) {
      ui.noteInput.addEventListener("input", () => {
        state.note = ui.noteInput.value.trim();
      });
    }

    if (ui.dateInput) {
      if (!ui.dateInput.value) {
        ui.dateInput.value = state.date;
      }

      ui.dateInput.addEventListener("change", () => {
        state.date = ui.dateInput.value || todayIso();
      });
    }

    const observer = new MutationObserver(() => {
      const current = entryRoot.getAttribute("data-entry-state") || "home";

      if (current !== state.lastEntryState) {
        state.lastEntryState = current;

        if (current === "observation") {
          resetWizard();
        }
      }
    });

    observer.observe(entryRoot, {
      attributes: true,
      attributeFilter: ["data-entry-state"]
    });

    syncInputsFromState();
    syncSelectedButtons();
    renderSteps();

    log("boot:ok");
  });
})();