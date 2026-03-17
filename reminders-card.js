/**
 * =========================================================
 * TAGANIMAL — FORMULAIRE RDV PARTAGÉ (Journal + Santé)
 * =========================================================
 * Version : 1.5.0
 * Rôle    : piloter le wizard RDV multi-pros — contextes
 *           "journal" et "health". Motif "vaccination" :
 *           si des vaccins existent → sélecteur de liaison ;
 *           si aucun vaccin → RDV simple (date directement).
 *
 * Historique :
 * - 1.0.0 : flow v6 praticien → soignant → motif → date...
 * - 1.1.0 : ajout recherche / liaison / création inline
 * - 1.2.0 : unification AJAX
 * - 1.3.0 : remplacement live du bloc RDV via HTML serveur
 * - 1.4.0 : support dual contexte journal/health + vaccin intégré
 * - 1.5.0 : logique vaccin unifiée — picker si vaccins existants,
 *           RDV simple si aucun ; suppression formulaire création vaccin
 * =========================================================
 */
(function () {
  "use strict";

  const ROOT_SELECTOR = '[data-ta-appointment-root]';
  const ENTRY_ROOT_SELECTOR_JOURNAL = "[data-ta-entry-root='journal']";
  const ENTRY_ROOT_SELECTOR_HEALTH  = "[data-ta-entry-root]:not([data-ta-entry-root='journal'])";

  const PRATICIEN_TYPES = {
    veterinaire: { label: "Vétérinaire", icon: "🩺", proRole: "veterinaire" },
    toiletteur:  { label: "Toiletteur", icon: "✂️", proRole: "toiletteur" },
    educateur:   { label: "Éducateur", icon: "🎓", proRole: "educateur" },
    osteopathe:  { label: "Ostéopathe", icon: "🦴", proRole: "osteopathe" },
    pension:     { label: "Pension / Garde", icon: "🏠", proRole: "pension" },
    autre:       { label: "Autre", icon: "📋", proRole: "autre" },
  };

  const MOTIFS_BY_TYPE = {
    veterinaire: {
      vaccination:          { label: "Vaccination", icon: "💉", months: 12 },
      bilan_annuel:         { label: "Bilan annuel", icon: "📋", months: 12 },
      consultation:         { label: "Consultation", icon: "🔍", months: 3 },
      consultation_urgence: { label: "Urgence", icon: "🚨", months: 1 },
      chirurgie:            { label: "Chirurgie", icon: "🏥", months: 1 },
      detartrage:           { label: "Détartrage", icon: "🦷", months: 12 },
      suivi:                { label: "Suivi traitement", icon: "🔁", months: 1 },
      autre:                { label: "Autre", icon: "➕", months: 0 },
    },
    toiletteur: {
      toilettage_complet: { label: "Toilettage complet", icon: "✂️", months: 2 },
      bain_brossage:      { label: "Bain & brossage", icon: "🚿", months: 1 },
      coupe_griffes:      { label: "Coupe des griffes", icon: "🐾", months: 1 },
      epilation:          { label: "Épilation", icon: "🪮", months: 3 },
      coupe_poils:        { label: "Coupe / tonte", icon: "💈", months: 2 },
      autre:              { label: "Autre", icon: "➕", months: 0 },
    },
    educateur: {
      cours_individuel:     { label: "Cours individuel", icon: "🎓", months: 0 },
      cours_groupe:         { label: "Cours en groupe", icon: "👥", months: 0 },
      bilan_comportemental: { label: "Bilan comportemental", icon: "🧠", months: 3 },
      reeducation:          { label: "Rééducation", icon: "🔄", months: 1 },
      autre:                { label: "Autre", icon: "➕", months: 0 },
    },
    osteopathe: {
      bilan_osteo:  { label: "Bilan ostéopathique", icon: "🦴", months: 12 },
      seance:       { label: "Séance", icon: "🤲", months: 3 },
      suivi_postop: { label: "Suivi post-op", icon: "🏥", months: 1 },
      suivi_chro:   { label: "Suivi chronique", icon: "🔁", months: 2 },
      autre:        { label: "Autre", icon: "➕", months: 0 },
    },
    pension: {
      entree_pension: { label: "Entrée en pension", icon: "🏠", months: 0 },
      sortie_pension: { label: "Sortie de pension", icon: "🎒", months: 0 },
      visite:         { label: "Visite", icon: "👀", months: 0 },
      autre:          { label: "Autre", icon: "➕", months: 0 },
    },
    autre: {
      rdv_generique: { label: "Rendez-vous", icon: "📋", months: 0 },
      consultation:  { label: "Consultation", icon: "🔍", months: 3 },
      suivi:         { label: "Suivi", icon: "🔁", months: 1 },
      autre:         { label: "Autre", icon: "➕", months: 0 },
    },
  };

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function debounce(fn, wait) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function escHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDateFR(date) {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function boot(rootEl) {
    const root = rootEl || document.querySelector(ROOT_SELECTOR);
    const TA = window.TA_JOURNAL || window.TA_HEALTH || null;

    if (!root || root.dataset.vetWizardBooted === "1") {
      return;
    }

    // Contexte : 'journal' (défaut) ou 'health'
    const rdvContext = root.dataset.rdvContext || root.dataset.taAppointmentRoot || "journal";

    const ajaxUrl = String((TA && TA.ajax_url) || root.dataset.ajaxUrl || "");
    const journalNonce = String((TA && TA.nonce) || root.dataset.nonce || "");
    const postId = String((TA && TA.post_id) || root.dataset.postId || "");
    const prosNonce = String(root.dataset.taProsNonce || "");

    if (!ajaxUrl || !journalNonce || !postId) {
      console.error("[TA_RDV] contexte AJAX manquant", { ajaxUrl, journalNonce, postId });
      return;
    }

    root.dataset.vetWizardBooted = "1";

    const SCREENS = ["praticien", "soignant", "motif", "datetime", "rappel", "confirm"];
    const TOTAL = SCREENS.length;
    let currentIdx = 0;
    const history = [];

    const state = {
      praticienType: "",
      praticienLabel: "",
      praticienIcon: "",
      proId: 0,
      proName: "",
      motif: "",
      motifLabel: "",
      motifMonths: 12,
      date: "",
      time: "",
      note: "",
      j0: true,
      avant: false,
      avantDays: 3,
      next: true,
      nextMonths: 12,
      pendingLinkedProId: 0,
      linkedCareId: 0,
      linkedCareType: "",
      linkedCareLabel: "",
      imminentVaccinesLoaded: false,
      imminentVaccines: [],
      // Champs vaccin (contexte health uniquement)
      vaccineCreate: {
        name: "",
        lot: "",
        months: 12,
        confirmed: false,
      },
    };
    
    let vaccinePickerRequestId = 0;
    
function applyPrefillAndOpen(payload = {}) {
  resetLinkedCare();

  state.praticienType  = String(payload.prefill_type || "veterinaire");
  state.praticienLabel = PRATICIEN_TYPES[state.praticienType]?.label || "Vétérinaire";
  state.praticienIcon  = PRATICIEN_TYPES[state.praticienType]?.icon || "🩺";

  state.proId   = parseInt(payload.professional_id || "0", 10) || 0;
  state.proName = String(payload.professional_name || "");

  state.motif = String(payload.motif || "vaccination");

  const motifs = MOTIFS_BY_TYPE[state.praticienType] || MOTIFS_BY_TYPE.autre;
  const meta = motifs[state.motif] || { label: state.motif, icon: "➕", months: 0 };

  state.motifLabel  = `${meta.icon} ${meta.label}`;
  state.motifMonths = meta.months || 0;
  state.nextMonths  = meta.months || 0;

  state.linkedCareId    = parseInt(payload.linked_care_id || payload.care_id || "0", 10) || 0;
  state.linkedCareType  = String(payload.linked_care_type || (state.linkedCareId ? "vaccine" : ""));
  state.linkedCareLabel = String(payload.linked_care_label || "");

  // Pré-remplissage date si fournie
  if (payload.prefill_date) {
    const dateInput = root.querySelector("[data-vet-date]");
    if (dateInput) {
      dateInput.value = String(payload.prefill_date);
      state.date = dateInput.value;
    }
  }

  // Inputs cachés
  const idInput         = root.querySelector("[data-vet-pro-id]");
  const nameInput       = root.querySelector("[data-vet-pro-name]");
  const motifInput      = root.querySelector("[data-vet-motif]");
  const linkedIdInput   = root.querySelector("[data-vet-linked-care-id]");
  const linkedTypeInput = root.querySelector("[data-vet-linked-care-type]");

  if (idInput) idInput.value = String(state.proId || "");
  if (nameInput) nameInput.value = state.proName;
  if (motifInput) motifInput.value = state.motif;
  if (linkedIdInput) linkedIdInput.value = String(state.linkedCareId || "");
  if (linkedTypeInput) linkedTypeInput.value = state.linkedCareType;

  // Sélecteur "prochain rappel"
  const nextSel = root.querySelector("[data-vet-next-months]");
  if (nextSel) {
    nextSel.value = meta.months > 0 ? String(meta.months) : "0";
  }

  // Affichage motif autre
  const autreZone = root.querySelector("[data-vet-motif-autre]");
  if (autreZone) {
    autreZone.hidden = state.motif !== "autre";
  }

  // Charger la liste des pros pour que le retour arrière reste cohérent
  if (state.praticienType) {
    loadPros();
  }

  // Sélection visuelle du motif
  root.querySelectorAll(".ta-vet-motif-btn").forEach((btn) => {
    btn.classList.toggle("is-selected", btn.dataset.motif === state.motif);
  });

  applyTheme(state.praticienType);
  updateSoignantHeader();
  activateMotifGrid();
  updateRecapStrip();
  updateNextPreview();

  // Si un vaccin est déjà lié, refléter le visuel
  if (state.linkedCareId && state.linkedCareLabel) {
    const selectedBox = root.querySelector("[data-vet-vaccines-selected]");
    const selectedLabel = root.querySelector("[data-vet-vaccines-selected-label]");
    if (selectedLabel) selectedLabel.textContent = state.linkedCareLabel;
    if (selectedBox) selectedBox.hidden = false;
  }

  history.length = 0;
  history.push("praticien", "soignant", "motif");

  const targetStep = String(payload.open_step || "datetime");
  showScreen(targetStep === "datetime" ? "datetime" : "datetime");
}

    function isVaccinationLinkContext() {
      return SCREENS[currentIdx] === "motif"
        && state.praticienType === "veterinaire"
        && state.motif === "vaccination";
    }

    function closeVaccinePickerOnly() {
      const box = root.querySelector("[data-vet-linked-care-box]");
      if (box) box.hidden = true;
    }

    function syncVaccinePickerVisibility() {
      if (!isVaccinationLinkContext()) {
        closeVaccinePickerOnly();
        return;
      }

      const box = root.querySelector("[data-vet-linked-care-box]");
      if (box && state.imminentVaccinesLoaded) {
        box.hidden = false;
      }
    }

    function getNonceForAction(action) {
      switch (action) {
        case "ta_pros_search":
        case "ta_pros_get":
        case "ta_pros_save":
        case "ta_pros_link":
        case "ta_pros_set_default":
        case "ta_pros_unlink":
          return prosNonce || journalNonce;
        default:
          return journalNonce;
      }
    }

    function postAjax(action, data = {}) {
      const nonce = getNonceForAction(action);
      const params = new URLSearchParams({ action, nonce, post_id: postId, ...data });
      return fetch(ajaxUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params.toString(),
      }).then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok || !json || !json.success) {
          throw new Error((json && json.data && json.data.message) || `AJAX ${action} échoué`);
        }
        return json.data;
      });
    }

    function getScreenEl(name) {
      return root.querySelector(`[data-vet-screen="${name}"]`);
    }

    function updateProgress(idx) {
      const fill = root.querySelector("[data-vet-progress]");
      if (fill) {
        fill.style.width = `${Math.round(((idx + 1) / TOTAL) * 100)}%`;
      }
      root.querySelectorAll("[data-step-label]").forEach((label) => {
        const step = parseInt(label.dataset.stepLabel, 10);
        label.classList.toggle("is-active", step === idx + 1);
        label.classList.toggle("is-done", step < idx + 1);
      });
    }

    function showScreen(name) {
      SCREENS.forEach((screen) => {
        const el = getScreenEl(screen);
        if (el) {
          el.hidden = screen !== name;
        }
      });

      currentIdx = SCREENS.indexOf(name);
      updateProgress(currentIdx);
      syncVaccinePickerVisibility();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function goTo(name) {
      history.push(SCREENS[currentIdx]);
      showScreen(name);
    }

    function goBack() {
      if (!history.length) {
        return;
      }
      const prev = history.pop();
      showScreen(prev);
    }

    function applyTheme(type) {
      if (type) {
        root.setAttribute("data-ta-appointment-type", type);
      } else {
        root.removeAttribute("data-ta-appointment-type");
      }
    }

    function showToast(message, type = "success") {
      const existing = root.querySelector(".ta-form-toast");
      if (existing) {
        existing.remove();
      }
      const toast = document.createElement("div");
      toast.className = `ta-form-toast ta-form-toast--${type}`;
      toast.textContent = message;
      root.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add("is-visible"));
      setTimeout(() => toast.remove(), 3000);
    }

    function updateSoignantHeader() {
      const title = root.querySelector("[data-vet-soignant-title]");
      const badge = root.querySelector("[data-vet-type-badge]");
      if (title) {
        title.textContent = `${state.praticienIcon} ${state.praticienLabel}`;
      }
      if (badge) {
        const icon = badge.querySelector("[data-vet-type-badge-icon]");
        const label = badge.querySelector("[data-vet-type-badge-label]");
        if (icon) icon.textContent = state.praticienIcon;
        if (label) label.textContent = state.praticienLabel;
        badge.hidden = !state.praticienType;
      }
    }

    function updateRecapStrip() {
      const strip = root.querySelector("[data-vet-recap-strip]");
      if (!strip) return;
      const proEl = strip.querySelector("[data-vet-recap-pro]");
      const motifEl = strip.querySelector("[data-vet-recap-motif]");
      if (proEl) {
        proEl.textContent = state.proName || `${state.praticienIcon} ${state.praticienLabel}`;
      }
      if (motifEl) {
        motifEl.textContent = state.motifLabel || "";
      }
      strip.hidden = !state.motifLabel;
    }

    function activateMotifGrid() {
      root.querySelectorAll("[data-motif-grid]").forEach((grid) => {
        grid.classList.toggle("is-active", grid.dataset.motifGrid === state.praticienType);
      });
    }

    function selectPro(pro, goNext = true) {
      state.proId = parseInt(pro.id, 10) || 0;
      state.proName = String(pro.name || pro.clinic || "Sans nom");
      const idInput = root.querySelector("[data-vet-pro-id]");
      const nameInput = root.querySelector("[data-vet-pro-name]");
      if (idInput) idInput.value = String(state.proId);
      if (nameInput) nameInput.value = state.proName;
      updateRecapStrip();
      if (goNext) {
        goTo("motif");
      }
    }

    function renderProCard(pro) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "ta-vet-pro-card" + (pro.is_default ? " ta-vet-pro-card--default" : "");
      const name = escHtml(pro.name || pro.clinic || "Sans nom");
      const clinic = pro.clinic ? `<span class="ta-vet-pro-card__clinic">${escHtml(pro.clinic)}</span>` : "";
      const city = pro.city ? `<span class="ta-vet-pro-card__city">📍 ${escHtml(pro.city)}</span>` : "";
      const phone = pro.phone ? `<span class="ta-vet-pro-card__meta">📞 ${escHtml(pro.phone)}</span>` : "";
      const badge = pro.is_default ? `<span class="ta-form-badge ta-vet-badge--default">⭐ Par défaut</span>` : "";
      card.innerHTML = `
        <div class="ta-vet-pro-card__hd">
          <strong class="ta-vet-pro-card__name">${name}</strong>
          ${badge}
        </div>
        ${clinic}
        <div class="ta-vet-pro-card__meta-row">${city}${phone}</div>
      `;
      card.addEventListener("click", () => {
        root.querySelectorAll(".ta-vet-pro-card").forEach((el) => el.classList.remove("is-selected"));
        card.classList.add("is-selected");
        selectPro(pro, true);
      });
      return card;
    }

    function loadPros(autoSelectId = 0) {
      const listEl = root.querySelector("[data-vet-pro-list]");
      const emptyEl = root.querySelector("[data-vet-pro-empty]");
      const loadingEl = root.querySelector("[data-vet-pro-loading]");
      if (!listEl) return Promise.resolve();

      listEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = true;
      if (loadingEl) loadingEl.hidden = false;

      const proRole = PRATICIEN_TYPES[state.praticienType] ? PRATICIEN_TYPES[state.praticienType].proRole : "";

      return postAjax("ta_pros_for_appointment", { pro_role: proRole })
        .then((data) => {
          if (loadingEl) loadingEl.hidden = true;
          const pros = Array.isArray(data.pros) ? data.pros : [];
          if (!pros.length) {
            if (emptyEl) emptyEl.hidden = false;
            return;
          }
          let selectedAfterRefresh = false;
          pros.forEach((pro) => {
            const card = renderProCard(pro);
            listEl.appendChild(card);
            const shouldSelect = autoSelectId && parseInt(pro.id, 10) === parseInt(autoSelectId, 10);
            if (shouldSelect) {
              selectedAfterRefresh = true;
              card.classList.add("is-selected");
              selectPro(pro, true);
            }
          });
          if (!selectedAfterRefresh && state.proId > 0) {
            const keepSelected = pros.find((item) => parseInt(item.id, 10) === state.proId);
            if (keepSelected) {
              root.querySelectorAll(".ta-vet-pro-card").forEach((el) => {
                if (el.querySelector(".ta-vet-pro-card__name")?.textContent === (keepSelected.name || keepSelected.clinic || "Sans nom")) {
                  el.classList.add("is-selected");
                }
              });
            }
          }
        })
        .catch((error) => {
          if (loadingEl) loadingEl.hidden = true;
          console.error("[TA_RDV] erreur chargement pros", error);
          if (emptyEl) emptyEl.hidden = false;
        });
    }

    function fillConfirm() {
      function setVal(key, value) {
        const el = root.querySelector(`[data-confirm-val="${key}"]`);
        if (el) el.textContent = value;
      }
      setVal("praticien", `${state.praticienIcon} ${state.praticienLabel}`);
      setVal("pro", state.proName || "Non renseigné");
      setVal("motif", state.motifLabel || "—");
      if (state.date) {
        const d = new Date(`${state.date}T12:00:00`);
        setVal("date", `${formatDateFR(d)}${state.time ? ` à ${state.time}` : ""}`);
      } else {
        setVal("date", "—");
      }
      setVal("note", state.note || "—");
      setVal("rappel-j0", state.j0 ? "✅ Oui" : "Non");
      setVal("rappel-avant", state.avant ? `✅ J−${state.avantDays}` : "Non");
      setVal("next", state.next && state.nextMonths > 0 ? `✅ Dans ${state.nextMonths} mois` : "Non");

      // Ligne vaccin lié (tous contextes)
      const vaccineRow = root.querySelector("[data-confirm-row-vaccine]");
      if (vaccineRow) {
        if (state.linkedCareId && state.linkedCareLabel) {
          setVal("vaccine", state.linkedCareLabel);
          vaccineRow.hidden = false;
        } else {
          vaccineRow.hidden = true;
        }
      }
    }

    function updateNextPreview() {
      const preview = root.querySelector("[data-vet-next-preview]");
      const nextSuggestion = root.querySelector("[data-vet-next-suggestion]");
      const months = parseInt(root.querySelector("[data-vet-next-months]")?.value || "0", 10) || 0;
      if (!preview) return;
      if (!state.date || months === 0) {
        preview.hidden = true;
        if (nextSuggestion) {
          nextSuggestion.textContent = "Aucun prochain rendez-vous planifié.";
        }
        return;
      }
      const d = new Date(`${state.date}T12:00:00`);
      d.setMonth(d.getMonth() + months);
      preview.textContent = `→ Prochain RDV prévu le ${formatDateFR(d)}`;
      preview.hidden = false;
      if (nextSuggestion) {
        nextSuggestion.textContent = `Suggestion : dans ${months} mois.`;
      }
    }

    function resetInlinePicker() {
      const panel = root.querySelector("[data-vet-inline-picker]");
      const search = root.querySelector("[data-vet-inline-search]");
      const results = root.querySelector("[data-vet-inline-search-results]");
      const manual = root.querySelector("[data-vet-inline-manual]");
      const msg = root.querySelector("[data-vet-inline-message]");
      if (panel) panel.hidden = true;
      if (search) search.value = "";
      if (results) {
        results.innerHTML = "";
        results.hidden = true;
      }
      if (manual) {
        manual.hidden = true;
        manual.reset();
      }
      if (msg) {
        msg.hidden = true;
        msg.textContent = "";
        msg.className = "ta-vet-inline-message";
      }
    }

    function showInlinePicker() {
      const panel = root.querySelector("[data-vet-inline-picker]");
      const search = root.querySelector("[data-vet-inline-search]");
      if (panel) panel.hidden = false;
      if (search) {
        setTimeout(() => search.focus(), 80);
      }
      panel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function showInlineMessage(text, isError) {
      const msg = root.querySelector("[data-vet-inline-message]");
      if (!msg) return;
      msg.hidden = false;
      msg.textContent = text;
      msg.className = `ta-vet-inline-message ${isError ? "is-error" : "is-success"}`;
    }

    function renderSearchResults(items) {
      const results = root.querySelector("[data-vet-inline-search-results]");
      if (!results) return;
      if (!items.length) {
        results.hidden = true;
        results.innerHTML = "";
        return;
      }
      results.innerHTML = items.map((item) => {
        const title = escHtml(item.cabinet || item.name || "Sans nom");
        const meta = [item.name && item.cabinet ? escHtml(item.name) : "", item.city ? `📍 ${escHtml(item.city)}` : "", item.phone ? `📞 ${escHtml(item.phone)}` : ""]
          .filter(Boolean)
          .join(" · ");
        return `
          <button type="button" class="ta-vet-search-item" data-vet-pick-existing="${String(item.id)}">
            <span class="ta-vet-search-item__title">${title}</span>
            <span class="ta-vet-search-item__meta">${meta || "Professionnel existant"}</span>
            <span class="ta-vet-search-item__cta">Choisir ce contact</span>
          </button>
        `;
      }).join("");
      results.hidden = false;
    }

    const runProsSearch = debounce(() => {
      const search = root.querySelector("[data-vet-inline-search]");
      const results = root.querySelector("[data-vet-inline-search-results]");
      if (!search || !results) return;
      const q = String(search.value || "").trim();
      if (q.length < 2) {
        results.innerHTML = "";
        results.hidden = true;
        return;
      }
      results.hidden = false;
      results.innerHTML = '<div class="ta-vet-search-item"><span class="ta-vet-search-item__title">Recherche en cours…</span></div>';
      postAjax("ta_pros_search", {
        q,
        type: PRATICIEN_TYPES[state.praticienType] ? PRATICIEN_TYPES[state.praticienType].proRole : "",
      }).then((data) => {
        renderSearchResults(Array.isArray(data.items) ? data.items : []);
      }).catch((error) => {
        console.error("[TA_RDV] erreur recherche pros", error);
        results.innerHTML = "";
        results.hidden = true;
      });
    }, 260);

    function initPraticienScreen() {
      root.querySelectorAll("[data-praticien-type]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const type = btn.dataset.praticienType || "";
          if (!PRATICIEN_TYPES[type]) {
            return;
          }
          state.praticienType = type;
          state.praticienLabel = PRATICIEN_TYPES[type].label;
          state.praticienIcon = PRATICIEN_TYPES[type].icon;
          state.proId = 0;
          state.proName = "";
          state.motif = "";
          state.motifLabel = "";
          state.motifMonths = 12;
          hideVaccinePicker();
          applyTheme(type);
          updateSoignantHeader();
          activateMotifGrid();
          resetInlinePicker();
          goTo("soignant");
          loadPros();
        });
      });
    }

    function initSoignantScreen() {
      root.querySelector("[data-vet-skip-pro]")?.addEventListener("click", () => {
        state.proId = 0;
        state.proName = "";
        updateRecapStrip();
        goTo("motif");
      });

      root.querySelector("[data-vet-open-inline-add]")?.addEventListener("click", showInlinePicker);
      root.querySelector("[data-vet-inline-cancel]")?.addEventListener("click", resetInlinePicker);
      root.querySelector("[data-vet-inline-cancel-manual]")?.addEventListener("click", resetInlinePicker);
      root.querySelector("[data-vet-inline-not-found]")?.addEventListener("click", () => {
        root.querySelector("[data-vet-inline-manual]")?.removeAttribute("hidden");
        root.querySelector("[data-vet-inline-manual]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      root.querySelector("[data-vet-inline-search]")?.addEventListener("input", runProsSearch);

      root.addEventListener("click", (event) => {
        const pickBtn = event.target.closest("[data-vet-pick-existing]");
        if (!pickBtn) return;
        const proId = pickBtn.getAttribute("data-vet-pick-existing");
        if (!proId) return;
        pickBtn.disabled = true;
        postAjax("ta_pros_link", {
          pro_id: proId,
          role: PRATICIEN_TYPES[state.praticienType] ? PRATICIEN_TYPES[state.praticienType].proRole : "autre",
        }).then(() => {
          showToast("Soignant ajouté à l'équipe ✓");
          resetInlinePicker();
          loadPros(parseInt(proId, 10));
        }).catch((error) => {
          pickBtn.disabled = false;
          console.error("[TA_RDV] erreur liaison pro", error);
          showInlineMessage(error.message || "Impossible d'ajouter ce soignant.", true);
        });
      });

      root.querySelector("[data-vet-inline-manual]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const proClinic = String(data.get("pro_clinic") || "").trim();
        const proName = String(data.get("pro_name") || "").trim();
        if (!proClinic && !proName) {
          showInlineMessage("Renseigne au moins l'établissement ou le nom du professionnel.", true);
          return;
        }
        const submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;
        postAjax("ta_pros_save", {
          pro_id: "0",
          pro_type: PRATICIEN_TYPES[state.praticienType] ? PRATICIEN_TYPES[state.praticienType].proRole : "autre",
          pro_clinic: proClinic,
          pro_name: proName,
          pro_phone: String(data.get("pro_phone") || "").trim(),
          pro_email: String(data.get("pro_email") || "").trim(),
          pro_city: String(data.get("pro_city") || "").trim(),
          pro_address: String(data.get("pro_address") || "").trim(),
          pro_notes: String(data.get("pro_notes") || "").trim(),
        }).then((response) => {
          if (submitBtn) submitBtn.disabled = false;
          showToast("Soignant enregistré ✓");
          resetInlinePicker();
          loadPros(parseInt(response.pro_id || 0, 10));
        }).catch((error) => {
          if (submitBtn) submitBtn.disabled = false;
          console.error("[TA_RDV] erreur save pro", error);
          showInlineMessage(error.message || "Impossible d'enregistrer le soignant.", true);
        });
      });
    }

function initMotifScreen() {
  root.addEventListener("click", (event) => {
    const btn = event.target.closest(".ta-vet-motif-btn");
    if (!btn) return;
    if (!btn.closest(".ta-vet-motif-grid.is-active")) return;

    const key = btn.dataset.motif || "";
    if (!key) return;

    root.querySelectorAll(".ta-vet-motif-btn").forEach((item) => {
      item.classList.remove("is-selected");
    });
    btn.classList.add("is-selected");

    const motifs = MOTIFS_BY_TYPE[state.praticienType] || MOTIFS_BY_TYPE.autre;
    const meta = motifs[key] || { label: key, icon: "➕", months: 0 };

    state.motif = key;
    state.motifLabel = `${meta.icon} ${meta.label}`;
    state.motifMonths = meta.months;

    const autreZone = root.querySelector("[data-vet-motif-autre]");
    if (autreZone) autreZone.hidden = key !== "autre";

    const nextSel = root.querySelector("[data-vet-next-months]");
    if (nextSel) {
      nextSel.value = meta.months > 0 ? String(meta.months) : "0";
      updateNextPreview();
    }

    const motifInput = root.querySelector("[data-vet-motif]");
    if (motifInput) motifInput.value = key;

    updateRecapStrip();

    if (state.praticienType === "veterinaire" && key === "vaccination") {
      maybeShowVaccinesForMotif();
      return;
    }

    hideVaccinePicker();
    goTo("datetime");
  });

  root.addEventListener("click", (event) => {
    const card = event.target.closest("[data-vet-vaccine-card]");
    if (!card) return;

    root.querySelectorAll("[data-vet-vaccine-card]").forEach((el) => {
      el.classList.remove("is-selected");
    });

    card.classList.add("is-selected");

    state.linkedCareId = parseInt(card.dataset.careId || "0", 10) || 0;
    state.linkedCareType = card.dataset.careType || "vaccine";
    state.linkedCareLabel = card.dataset.label || "";

    const idInput = root.querySelector("[data-vet-linked-care-id]");
    const typeInput = root.querySelector("[data-vet-linked-care-type]");
    const selectedBox = root.querySelector("[data-vet-vaccines-selected]");
    const selectedLabel = root.querySelector("[data-vet-vaccines-selected-label]");

    if (idInput) idInput.value = String(state.linkedCareId);
    if (typeInput) typeInput.value = state.linkedCareType;
    if (selectedLabel) selectedLabel.textContent = state.linkedCareLabel;
    if (selectedBox) selectedBox.hidden = false;

    goTo("datetime");
  });

  root.querySelector("[data-vet-skip-vaccine]")?.addEventListener("click", () => {
    resetLinkedCare();
    goTo("datetime");
  });

  root.querySelector("[data-vet-refresh-vaccines]")?.addEventListener("click", () => {
    loadImminentVaccines();
  });
}

    function initDatetimeScreen() {
      root.querySelector("[data-vet-next='rappel']")?.addEventListener("click", () => {
        const dateInput = root.querySelector("[data-vet-date]");
        if (!dateInput || !dateInput.value) {
          dateInput?.classList.add("has-error");
          return;
        }
        dateInput.classList.remove("has-error");
        state.date = dateInput.value;
        state.time = String(root.querySelector("[data-vet-time]")?.value || "");
        state.note = String(root.querySelector("[data-vet-note]")?.value || "");
        const j0Desc = root.querySelector("[data-vet-j0-date]");
        if (j0Desc && state.date) {
          const d = new Date(`${state.date}T12:00:00`);
          j0Desc.textContent = `Un e-mail sera envoyé le ${formatDateFR(d)}.`;
        }
        updateNextPreview();
        goTo("rappel");
      });
    }

    function initRappelScreen() {
      root.querySelectorAll("[data-vet-toggle]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.vetToggle;
          const isOn = btn.dataset.state === "on";
          const newState = isOn ? "off" : "on";
          btn.dataset.state = newState;
          btn.setAttribute("aria-pressed", String(newState === "on"));
          const input = root.querySelector(`[data-vet-toggle-input="${key}"]`);
          if (input) input.value = newState === "on" ? "1" : "0";
          if (key === "avant") {
            state.avant = newState === "on";
            const delay = root.querySelector("[data-vet-avant-delay]");
            if (delay) delay.hidden = !state.avant;
          }
          if (key === "j0") state.j0 = newState === "on";
          if (key === "next") {
            state.next = newState === "on";
            const freq = root.querySelector("[data-vet-next-freq]");
            if (freq) freq.hidden = !state.next;
          }
        });
      });

      root.querySelectorAll("[data-delay-days]").forEach((pill) => {
        pill.addEventListener("click", () => {
          root.querySelectorAll("[data-delay-days]").forEach((item) => item.classList.remove("is-selected"));
          pill.classList.add("is-selected");
          state.avantDays = parseInt(pill.dataset.delayDays || "3", 10) || 3;
          const hidden = root.querySelector("[data-vet-avant-days-value]");
          if (hidden) hidden.value = String(state.avantDays);
        });
      });

      root.querySelector("[data-vet-next-months]")?.addEventListener("change", (event) => {
        state.nextMonths = parseInt(event.target.value || "0", 10) || 0;
        updateNextPreview();
      });

      root.querySelector("[data-vet-next='confirm']")?.addEventListener("click", () => {
        state.j0 = root.querySelector("[data-vet-toggle-input='j0']")?.value === "1";
        state.avant = root.querySelector("[data-vet-toggle-input='avant']")?.value === "1";
        state.next = root.querySelector("[data-vet-toggle-input='next']")?.value === "1";
        state.avantDays = parseInt(root.querySelector("[data-vet-avant-days-value]")?.value || "3", 10) || 3;
        state.nextMonths = parseInt(root.querySelector("[data-vet-next-months]")?.value || "0", 10) || 0;
        fillConfirm();
        goTo("confirm");
      });
    }

function initSaveButton() {
  root.querySelector("[data-vet-save]")?.addEventListener("click", () => {
    const saveBtn = root.querySelector("[data-vet-save]");
    if (!saveBtn || saveBtn.disabled) return;

    saveBtn.disabled = true;
    saveBtn.classList.add("is-loading");

    const motifAutreInput = root.querySelector("[data-vet-motif-autre-input]");
    const motifFinal = state.motif === "autre" && motifAutreInput?.value.trim()
      ? motifAutreInput.value.trim()
      : state.motif;

    const savePayload = {
      practitioner_type: state.praticienType,
      professional_id: String(state.proId),
      professional_name: state.proName,
      motif: motifFinal,
      appointment_date: state.date,
      appointment_time: state.time,
      note: state.note,
      reminder_email_j0: state.j0 ? "1" : "0",
      reminder_email_avant: state.avant ? "1" : "0",
      plan_next: state.next ? "1" : "0",
      reminder_avant_days: String(state.avantDays),
      next_appointment_months: state.next ? String(state.nextMonths) : "0",
      linked_care_id: String(state.linkedCareId || 0),
      linked_care_type: state.linkedCareId ? "vaccine" : "",
      link_policy: state.linkedCareId ? "suspend_target_reminders" : "none",
      rdv_context: rdvContext,
    };

    // Données vaccin (contexte health + motif vaccination)
    if (rdvContext === "health" && state.vaccineCreate.confirmed && state.vaccineCreate.name) {
      savePayload.vaccine_name = state.vaccineCreate.name;
      savePayload.vaccine_lot = state.vaccineCreate.lot || "";
      savePayload.vaccine_reminder_months = String(state.vaccineCreate.months);
      savePayload.create_vaccine = "1";
    }

    postAjax("ta_care_appointment_save", savePayload)
    .then(async (response) => {
      saveBtn.disabled = false;
      saveBtn.classList.remove("is-loading");

      let replaced = false;

      try {
        replaced = replaceAppointmentsBlockFromResponse(response);
      } catch (err) {
        console.error("[TA_RDV] erreur replace bloc", err);
      }

      if (
        !replaced &&
        window.TARemindersUnified &&
        typeof window.TARemindersUnified.reloadJournal === "function"
      ) {
        try {
          await window.TARemindersUnified.reloadJournal();
        } catch (err) {
          console.error("[TA_RDV] erreur reloadJournal", err);
        }
      }

      showToast("Rendez-vous enregistré ✓");

      setTimeout(() => {
        resetWizard();

        const evt = new CustomEvent("ta:rdv:saved", {
          bubbles: true,
          detail: { block: response && response.block ? response.block : null }
        });

        root.dispatchEvent(evt);
        document.dispatchEvent(evt);
        window.dispatchEvent(evt);
      }, 1200);
    })
    .catch((error) => {
      saveBtn.disabled = false;
      saveBtn.classList.remove("is-loading");
      console.error("[TA_RDV] erreur save", error);
      showToast("Erreur lors de l'enregistrement", "error");
    });
  });
}
    
    function replaceAppointmentsBlockFromResponse(response) {
      const blockResponse = response && response.block ? response.block : null;
      if (!blockResponse || typeof blockResponse.html !== "string" || !blockResponse.html.trim()) {
        console.warn("[TA_RDV] réponse bloc vide", response);
        return false;
      }
    
      const currentBlock = document.querySelector('#ta-journal-upcoming-rdv[data-ta-journal-block="upcoming-rdv"]');
      const currentRoot = currentBlock ? currentBlock.closest("[data-ta-journal-reminders-root]") : null;
    
      if (!currentRoot) {
        console.warn("[TA_RDV] bloc RDV courant introuvable");
        return false;
      }
    
      const wrapper = document.createElement("div");
      wrapper.innerHTML = blockResponse.html.trim();
    
      const nextBlock = wrapper.querySelector('#ta-journal-upcoming-rdv[data-ta-journal-block="upcoming-rdv"]');
      const nextRoot = nextBlock ? nextBlock.closest("[data-ta-journal-reminders-root]") : null;
    
      if (!nextRoot) {
        console.warn("[TA_RDV] bloc RDV serveur introuvable dans le HTML retourné");
        return false;
      }
    
      currentRoot.replaceWith(nextRoot);
    
      if (window.TARemindersUnified && typeof window.TARemindersUnified.bootAll === "function") {
        window.TARemindersUnified.bootAll();
      }
    
      return true;
    }


    function resetLinkedCare() {
  state.linkedCareId = 0;
  state.linkedCareType = "";
  state.linkedCareLabel = "";

  const idInput = root.querySelector("[data-vet-linked-care-id]");
  const typeInput = root.querySelector("[data-vet-linked-care-type]");
  const selectedBox = root.querySelector("[data-vet-vaccines-selected]");
  const selectedLabel = root.querySelector("[data-vet-vaccines-selected-label]");

  if (idInput) idInput.value = "";
  if (typeInput) typeInput.value = "";
  if (selectedLabel) selectedLabel.textContent = "";
  if (selectedBox) selectedBox.hidden = true;

  root.querySelectorAll("[data-vet-vaccine-card]").forEach((el) => {
    el.classList.remove("is-selected");
  });
}

    function hideVaccinePicker() {
      vaccinePickerRequestId += 1;

      const box = root.querySelector("[data-vet-linked-care-box]");
      const list = root.querySelector("[data-vet-vaccines-list]");
      const empty = root.querySelector("[data-vet-vaccines-empty]");
      const loading = root.querySelector("[data-vet-vaccines-loading]");

      if (box) box.hidden = true;
      if (list) list.innerHTML = "";
      if (empty) empty.hidden = true;
      if (loading) loading.hidden = true;

      state.imminentVaccinesLoaded = false;
      state.imminentVaccines = [];
      resetLinkedCare();
      hideVaccineCreateForm();
    }

function renderImminentVaccines(items) {
  const box = root.querySelector("[data-vet-linked-care-box]");
  const list = root.querySelector("[data-vet-vaccines-list]");
  const empty = root.querySelector("[data-vet-vaccines-empty]");
  const loading = root.querySelector("[data-vet-vaccines-loading]");

  if (!box || !list || !empty || !loading) return;

  if (!isVaccinationLinkContext()) {
    closeVaccinePickerOnly();
    return;
  }

  box.hidden = false;
  loading.hidden = true;
  list.innerHTML = "";
  empty.hidden = items.length > 0;

  if (!items.length) {
    resetLinkedCare();
    return;
  }

  list.innerHTML = items.map((item) => `
    <button type="button"
            class="ta-vet-vaccine-card"
            data-vet-vaccine-card
            data-care-id="${String(item.care_id || 0)}"
            data-care-type="vaccine"
            data-label="${escHtml(item.label || '')}">
      <span class="ta-vet-vaccine-card__icon">💉</span>
      <span class="ta-vet-vaccine-card__body">
        <strong class="ta-vet-vaccine-card__title">${escHtml(item.label || "Vaccin")}</strong>
        <span class="ta-vet-vaccine-card__meta">
          Prévu le ${escHtml(item.next_due_label || "—")}
          ${typeof item.days_remaining === "number" ? ` · dans ${item.days_remaining} jour(s)` : ""}
        </span>
      </span>
    </button>
  `).join("");
}

    function loadImminentVaccines() {
      const box = root.querySelector("[data-vet-linked-care-box]");
      const loading = root.querySelector("[data-vet-vaccines-loading]");
      const empty = root.querySelector("[data-vet-vaccines-empty]");
      const list = root.querySelector("[data-vet-vaccines-list]");
    
      if (!box || !loading || !empty || !list) return;
    
      if (!isVaccinationLinkContext()) {
        closeVaccinePickerOnly();
        return;
      }
    
      const requestId = ++vaccinePickerRequestId;
    
      box.hidden = false;
      loading.hidden = false;
      empty.hidden = true;
      list.innerHTML = "";
      resetLinkedCare();
    
      postAjax("ta_care_imminent_vaccines", {
        window_days: "30",
      }).then((data) => {
        if (requestId !== vaccinePickerRequestId) {
          return;
        }
    
        const items = Array.isArray(data.items) ? data.items : [];
        state.imminentVaccines = items;
        state.imminentVaccinesLoaded = true;

        if (!isVaccinationLinkContext()) {
          closeVaccinePickerOnly();
          return;
        }

        if (items.length === 0) {
          // Aucun vaccin existant → RDV simple, aller directement à la date
          closeVaccinePickerOnly();
          goTo("datetime");
          return;
        }

        renderImminentVaccines(items);
      }).catch((error) => {
        if (requestId !== vaccinePickerRequestId) {
          return;
        }

        console.error("[TA_RDV] erreur vaccins imminents", error);
        loading.hidden = true;
        closeVaccinePickerOnly();

        // En cas d'erreur, continuer avec un RDV simple
        if (isVaccinationLinkContext()) {
          goTo("datetime");
        }
      });
    }

    function maybeShowVaccinesForMotif() {
      if (!isVaccinationLinkContext()) {
        hideVaccinePicker();
        return;
      }

      // Tous contextes : sélecteur de vaccins existants
      // Si des vaccins sont déjà chargés, on les affiche (ou on passe si aucun)
      if (state.imminentVaccinesLoaded) {
        if (state.imminentVaccines.length > 0) {
          renderImminentVaccines(state.imminentVaccines);
        } else {
          // Aucun vaccin existant → RDV simple, aller directement à la date
          goTo("datetime");
        }
        return;
      }

      // Charger les vaccins depuis le serveur
      loadImminentVaccines();
    }

    function showVaccineCreateForm() {
      const box = root.querySelector("[data-vet-vaccine-create]");
      if (box) box.hidden = false;
    }

    function hideVaccineCreateForm() {
      const box = root.querySelector("[data-vet-vaccine-create]");
      if (box) box.hidden = true;
    }

    function initVaccineCreateForm() {
      if (rdvContext !== "health") return;

      // Suggestions chips
      root.addEventListener("click", (event) => {
        const chip = event.target.closest("[data-vet-vax-suggest]");
        if (!chip) return;
        const nameInput = root.querySelector("[data-vet-vaccine-name]");
        if (nameInput) {
          nameInput.value = chip.dataset.vetVaxSuggest || "";
          nameInput.dispatchEvent(new Event("input"));
        }
      });

      // Fréquence radios
      root.addEventListener("change", (event) => {
        const radio = event.target.closest("[data-vet-vaccine-freq]");
        if (!radio) return;
        state.vaccineCreate.months = parseInt(radio.value, 10) || 0;
      });

      // Bouton confirmer
      root.querySelector("[data-vet-vaccine-confirm]")?.addEventListener("click", () => {
        const nameInput = root.querySelector("[data-vet-vaccine-name]");
        const vaccineName = (nameInput?.value || "").trim();
        if (!vaccineName) {
          nameInput?.classList.add("has-error");
          nameInput?.focus();
          return;
        }
        nameInput?.classList.remove("has-error");
        const lotInput = root.querySelector("[data-vet-vaccine-lot]");
        const freqRadio = root.querySelector("[data-vet-vaccine-freq]:checked");
        state.vaccineCreate.name = vaccineName;
        state.vaccineCreate.lot = (lotInput?.value || "").trim();
        state.vaccineCreate.months = parseInt(freqRadio?.value || "12", 10);
        state.vaccineCreate.confirmed = true;
        goTo("datetime");
      });
    }

    function resetWizard() {
      Object.assign(state, {
        praticienType: "",
        praticienLabel: "",
        praticienIcon: "",
        proId: 0,
        proName: "",
        motif: "",
        motifLabel: "",
        motifMonths: 12,
        date: "",
        time: "",
        note: "",
        j0: true,
        avant: false,
        avantDays: 3,
        next: true,
        nextMonths: 12,
        pendingLinkedProId: 0,
        linkedCareId: 0,
        linkedCareType: "",
        linkedCareLabel: "",
        imminentVaccinesLoaded: false,
        imminentVaccines: [],
        vaccineCreate: { name: "", lot: "", months: 12, confirmed: false },
      });
      // Réinitialiser le sous-formulaire vaccin
      const vaccineNameInput = root.querySelector("[data-vet-vaccine-name]");
      const vaccineLotInput  = root.querySelector("[data-vet-vaccine-lot]");
      if (vaccineNameInput) vaccineNameInput.value = "";
      if (vaccineLotInput)  vaccineLotInput.value  = "";
      const freq12 = root.querySelector("[data-vet-vaccine-freq][value='12']");
      if (freq12) freq12.checked = true;
      applyTheme("");
	  hideVaccinePicker();
      resetInlinePicker();
      root.querySelectorAll(".ta-vet-pro-card.is-selected, .ta-vet-motif-btn.is-selected").forEach((el) => el.classList.remove("is-selected"));
      root.querySelectorAll("[data-motif-grid]").forEach((grid) => grid.classList.remove("is-active"));
      root.querySelector("[data-vet-type-badge]")?.setAttribute("hidden", "hidden");
      updateRecapStrip();
      showScreen("praticien");
      history.length = 0;
    }

    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-vet-back]")) {
        event.preventDefault();
        goBack();
      }
    });

    initPraticienScreen();
    initSoignantScreen();
    initMotifScreen();
    initDatetimeScreen();
    initRappelScreen();
    initSaveButton();
    initVaccineCreateForm();

    root.__taAppointmentApi = {
      applyPrefillAndOpen,
      resetWizard,
    };

    showScreen("praticien");
    console.log("[TA_RDV] wizard initialisé — contexte:", rdvContext);
  }

  function bootForRoot(rootEl) {
    if (rootEl && rootEl.dataset.vetWizardBooted !== "1") {
      boot(rootEl);
    }
  }
   async function maybeResolveEmailDeeplink() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("ta_deeplink");

    if (!token) return;

    const TA = window.TA_JOURNAL || window.TA_HEALTH || null;
    if (!TA || !TA.ajax_url || !TA.nonce || !TA.post_id) {
      console.warn("[TA_RDV] contexte AJAX introuvable pour deeplink");
      return;
    }

    const params = new URLSearchParams({
      action: "ta_deeplink_resolve",
      nonce: String(TA.nonce),
      post_id: String(TA.post_id),
      ta_deeplink: token,
    });

    try {
      const response = await fetch(String(TA.ajax_url), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: params.toString(),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json || !json.success || !json.data) {
        console.warn("[TA_RDV] deeplink invalide ou non résolu", json);
        return;
      }

      const payload = json.data || {};
      if (payload.action !== "appt_plan_open") {
        return;
      }

      const targetContext = String(payload.rdv_context || "journal");
      const formSelector = `[data-ta-appointment-root="${targetContext}"]`;

      let entryRoot = null;
      let trigger = null;

      if (targetContext === "health") {
        entryRoot = document.querySelector("[data-ta-entry-root]:not([data-ta-entry-root='journal'])");
        trigger = entryRoot?.querySelector("[data-entry-go='rdv']");
      } else {
        entryRoot = document.querySelector("[data-ta-entry-root='journal']");
        trigger = entryRoot?.querySelector("[data-entry-go='appointment']");
      }

      // Ouvrir le bon écran si un entry root existe
      trigger?.click();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const form = document.querySelector(formSelector);
      if (!form) {
        console.warn("[TA_RDV] formulaire cible introuvable pour deeplink", targetContext);
        return;
      }

      bootForRoot(form);

      if (form.__taAppointmentApi && typeof form.__taAppointmentApi.applyPrefillAndOpen === "function") {
        form.__taAppointmentApi.applyPrefillAndOpen(payload);
      }

      // Nettoyage URL pour éviter de rejouer le deeplink au refresh
      url.searchParams.delete("ta_deeplink");
      window.history.replaceState({}, document.title, url.toString());

    } catch (error) {
      console.error("[TA_RDV] erreur maybeResolveEmailDeeplink", error);
    }
  } 

  onReady(() => {
    // Boot contexte Journal : déclenché sur clic data-entry-go="appointment"
    const journalEntryRoot = document.querySelector(ENTRY_ROOT_SELECTOR_JOURNAL);
    if (journalEntryRoot) {
      journalEntryRoot.addEventListener("click", (event) => {
        if (event.target.closest("[data-entry-go='appointment']")) {
          requestAnimationFrame(() => {
            const form = document.querySelector('[data-ta-appointment-root="journal"]');
            if (form) bootForRoot(form);
          });
        }
      });
      if (journalEntryRoot.getAttribute("data-entry-state") === "appointment") {
        const form = document.querySelector('[data-ta-appointment-root="journal"]');
        if (form) bootForRoot(form);
      }
    }

    // Boot contexte Santé : déclenché sur clic data-entry-go="rdv"
    const healthEntryRoot = document.querySelector("[data-ta-entry-root]:not([data-ta-entry-root='journal'])");
    if (healthEntryRoot) {
      healthEntryRoot.addEventListener("click", (event) => {
        if (event.target.closest("[data-entry-go='rdv']")) {
          requestAnimationFrame(() => {
            const form = document.querySelector('[data-ta-appointment-root="health"]');
            if (form) bootForRoot(form);
          });
        }
      });
      if (healthEntryRoot.getAttribute("data-entry-state") === "rdv") {
        const form = document.querySelector('[data-ta-appointment-root="health"]');
        if (form) bootForRoot(form);
      }
    }

    if (!journalEntryRoot && !healthEntryRoot) {
      document.querySelectorAll(ROOT_SELECTOR).forEach((form) => bootForRoot(form));
    }

    maybeResolveEmailDeeplink();
  });
})();