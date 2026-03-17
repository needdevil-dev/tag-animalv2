/**
 * TAGANIMAL — Behavior Editor (OWNER)
 *
 * Rôle :
 * - Gérer les règles métier des checkboxes
 * - Construire l’aperçu public (si présent)
 * - Activer le bouton Enregistrer dès modification
 *
 * Aucun mode view / edit
 * Édition directe uniquement
 */

(function () {
  "use strict";

  /* =====================================================
   * UTILITAIRES
   * ===================================================== */

  function uniq(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
  }

  function qs(root, selector) {
    return root.querySelector(selector);
  }

  function qsa(root, selector) {
    return Array.from(root.querySelectorAll(selector));
  }

  /* =====================================================
   * LOGIQUE OK / PAS OK (métier conservé)
   * ===================================================== */

  function enforceExclusive(root, changedInput) {
    if (!changedInput || !changedInput.value) return;

    var slug = changedInput.value;

    if (slug.startsWith("ok_")) {
      var key = slug.slice(3);
      var nok = qs(root, 'input[value="pas_ok_' + key + '"]');
      if (nok && nok.checked) nok.checked = false;
    }

    if (slug.startsWith("pas_ok_")) {
      var key2 = slug.slice(7);
      var ok = qs(root, 'input[value="ok_' + key2 + '"]');
      if (ok && ok.checked) ok.checked = false;
    }
  }

  function normalizeConflicts(root) {
    ["enfants", "chiens", "chats", "inconnus"].forEach(function (key) {
      var ok  = qs(root, 'input[value="ok_' + key + '"]');
      var nok = qs(root, 'input[value="pas_ok_' + key + '"]');
      if (ok && nok && ok.checked && nok.checked) {
        ok.checked = false;
      }
    });
  }

  /* =====================================================
   * PREVIEW PUBLIC (si présent dans le DOM)
   * ===================================================== */

  function buildPreview(root) {
    var preview = qs(root, ".ta-behavior-preview-content");
    if (!preview) return;

    var checks = qsa(root, 'input[type="checkbox"][data-level]:checked');

    var groups = {
      vigilance: [],
      attention: [],
      positif: []
    };

    var relationKeys = ["enfants", "chiens", "chats", "inconnus"];

    checks.forEach(function (cb) {
      var level = cb.getAttribute("data-level");
      var label = cb.getAttribute("data-label");
      if (!groups[level] || !label) return;

      if (cb.value.startsWith("pas_ok_")) {
        var k = cb.value.slice(7);
        if (relationKeys.includes(k)) return;
      }

      groups[level].push(label);
    });

    Object.keys(groups).forEach(function (k) {
      groups[k] = uniq(groups[k]);
    });

    preview.innerHTML = "";

    if (!groups.vigilance.length && !groups.attention.length && !groups.positif.length) {
      preview.innerHTML =
        '<p class="ta-muted">Aucune information de comportement renseignée.</p>';
      return;
    }

    var titles = {
      vigilance: "Points importants",
      attention: "À surveiller",
      positif: "Comportement général"
    };

    ["vigilance", "attention", "positif"].forEach(function (level) {
      if (!groups[level].length) return;

      var group = document.createElement("div");
      group.className = "ta-behavior-pill-group ta-behavior-pill-group--" + level;

      var head = document.createElement("div");
      head.className = "ta-behavior-pill-head";

      var dot = document.createElement("span");
      dot.className = "ta-behavior-dot";

      var title = document.createElement("span");
      title.textContent = titles[level];

      head.append(dot, title);

      var chips = document.createElement("div");
      chips.className = "ta-chips";

      groups[level].forEach(function (label) {
        var chip = document.createElement("span");
        chip.className = "ta-chip ta-behavior-chip--" + level;
        chip.textContent = label;
        chips.appendChild(chip);
      });

      group.append(head, chips);
      preview.appendChild(group);
    });
  }

  /* =====================================================
   * DIRTY STATE (activation Enregistrer)
   * ===================================================== */

  function initDirtyState(root) {
    var form = qs(root, ".ta-behavior-form");
    if (!form) return;

    var saveBtn = qs(form, "[data-ta-save]");
    if (!saveBtn) return;

    var fields = qsa(
      form,
      'input[name="behavior_tags[]"], textarea[name="behavior_summary"]'
    );

    function markDirty() {
      saveBtn.disabled = false;
    }

    fields.forEach(function (el) {
      el.addEventListener("change", markDirty);
      el.addEventListener("input", markDirty);
    });
  }

  /* =====================================================
   * INIT
   * ===================================================== */

  function init(root) {
    if (!root) return;

    normalizeConflicts(root);
    buildPreview(root);
    initDirtyState(root);

    root.addEventListener("change", function (e) {
      var target = e.target;
      if (!target || target.type !== "checkbox") return;

      enforceExclusive(root, target);
      normalizeConflicts(root);
      buildPreview(root);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    init(document.getElementById("ta-behavior-owner"));
  });

})();
