/**
 * TAGANIMAL — Pros Module (Mon Équipe)
 * UX 3 étapes : type → search → manual
 *
 * SEARCH UX améliorée :
 *  - Recherche par nom ET cabinet
 *  - 0 résultat  → bloc "Ajouter manuellement"
 *  - 1 résultat  → carte de confirmation "C'est bien lui ?"
 *  - N résultats → liste de cartes avec bouton "Choisir"
 *                  + lien "Pas dans la liste" en bas
 *  - Indicateur de chargement pendant la requête AJAX
 *
 * FIX : cabinet mappé correctement dans fillManual (item.cabinet)
 */

(function () {
"use strict";

/* =========================================================
 * Utilitaires
 * ======================================================= */
function onReady(fn){
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", fn, {once:true});
  } else fn();
}

function debounce(fn, wait){
  var t = null;
  return function(){
    var ctx = this, args = arguments;
    clearTimeout(t);
    t = setTimeout(function(){ fn.apply(ctx, args); }, wait);
  };
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/** Entoure les occurrences du terme de recherche avec <mark> */
function highlightTerm(str, q){
  if(!q || !str) return escapeHtml(str);
  var safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var re   = new RegExp('(' + safe + ')', 'gi');
  return escapeHtml(str).replace(re, '<mark class="ta-hl">$1</mark>');
}

/* =========================================================
 * INIT
 * ======================================================= */
onReady(function(){

  var root = document.querySelector("[data-ta-pros-block]");
  if(!root) return;

  var ajaxUrl = root.dataset.taProsAjaxUrl || "";
  var nonce   = root.dataset.taProsNonce   || "";
  var postId  = root.dataset.taProsPostId  || "0";

  var form       = root.querySelector("[data-ta-pros-form]");
  var saveBtn    = root.querySelector("[data-ta-pros-save]");
  var msgEl      = root.querySelector(".ta-pros-message");
  var formTitle  = root.querySelector("[data-ta-pros-form-title]");

  var stepType   = root.querySelector("[data-ta-pros-step='type']");
  var stepSearch = root.querySelector("[data-ta-pros-step='search']");
  var stepManual = root.querySelector("[data-ta-pros-step='manual']");

  var typeBtns   = root.querySelectorAll(".ta-pro-type-btn");

  var searchInput   = root.querySelector("[data-ta-pros-search]");
  var resultsBox    = root.querySelector("[data-ta-pros-search-results]");
  var emptyBox      = root.querySelector("[data-ta-pros-search-empty]");
  var searchHint    = root.querySelector("[data-ta-pros-search-hint]");

  // Bibliothèque (facultatif)
  var libSelect = root.querySelector("[data-ta-pros-library-select]");
  var linkBtn   = root.querySelector("[data-ta-pros-link-existing]");

  if(!form){
    console.warn("[TA_PROS] form introuvable");
    return;
  }

  /* =========================================================
   * État interne
   * ======================================================= */
  var _formMode        = "add";   // "add" | "edit"
  var _searchPending   = false;

  /* =========================================================
   * Helpers UI
   * ======================================================= */
  function showMessage(text, isError){
    if(!msgEl) return;
    msgEl.textContent = text;
    msgEl.className   = "ta-pros-message " + (isError ? "is-error" : "is-success");
    setTimeout(function(){
      msgEl.textContent = "";
      msgEl.className   = "ta-pros-message";
    }, 3500);
  }

  function setSaveEnabled(enabled){
    if(saveBtn) saveBtn.disabled = !enabled;
  }

  function getField(key){
    return form.querySelector("[data-ta-pros-field='" + key + "']");
  }

  function setType(type){
    var f = getField("pro_type");
    if(f) f.value = type || "";
  }

  function currentType(){
    var f = getField("pro_type");
    return f ? String(f.value || "") : "";
  }

  function resetManualForm(keepType){
    var t = keepType ? currentType() : "";
    form.reset();
    var idField = getField("pro_id");
    if(idField) idField.value = "";
    if(keepType) setType(t);
    setSaveEnabled(false);
    setFormMode("add");
  }

  function showStep(which){
    if(stepType)   stepType.hidden   = (which !== "type");
    if(stepSearch) stepSearch.hidden = (which !== "search");
    if(stepManual) stepManual.hidden = (which !== "manual");
  }

  function scrollToEl(el){
    if(!el) return;
    setTimeout(function(){
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }

  function setFormMode(mode){
    _formMode = mode;
    if(!formTitle) return;
    if(mode === "edit"){
      formTitle.textContent = "✏️  Modifier le professionnel";
      if(saveBtn) saveBtn.textContent = "Mettre à jour";
    } else {
      formTitle.textContent = "Étape 3 — Ajouter manuellement";
      if(saveBtn) saveBtn.textContent = "Enregistrer";
    }
  }

  /* =========================================================
   * SEARCH — état de chargement
   * ======================================================= */
  function setSearchLoading(on){
    _searchPending = on;
    if(!resultsBox) return;
    if(on){
      resultsBox.innerHTML = '<p class="ta-pros-searching" aria-live="polite">'
        + '<span class="ta-spinner" aria-hidden="true"></span> Recherche en cours…</p>';
      resultsBox.hidden = false;
      if(emptyBox) emptyBox.hidden = true;
    }
  }

  /* =========================================================
   * SEARCH — nettoyage de la zone résultats
   * ======================================================= */
  function clearSearchUI(){
    if(resultsBox){
      resultsBox.innerHTML = "";
      resultsBox.hidden = true;
    }
    if(emptyBox) emptyBox.hidden = true;
  }

  /* =========================================================
   * SEARCH — rendu des résultats
   *
   * 0 item  → bloc "Ajouter manuellement"
   * 1 item  → carte de confirmation "C'est bien lui ?"
   * N items → liste de cartes + "Pas dans la liste"
   * ======================================================= */
  function renderResults(items, q){
    if(!resultsBox) return;

    /* 0 résultat → emptyBox */
    if(!items || !items.length){
      resultsBox.innerHTML = "";
      resultsBox.hidden = true;
      if(emptyBox) emptyBox.hidden = false;
      return;
    }

    if(emptyBox) emptyBox.hidden = true;

    /* ---------- HELPER : HTML d'une carte résultat ---------- */
    function cardHTML(it, q, showPickBtn){
      var lines = [];
      if(it.city)  lines.push("📍 " + escapeHtml(it.city));
      if(it.phone) lines.push("📞 " + escapeHtml(it.phone));

      var cabinetLine = it.cabinet
        ? '<span class="ta-pros-result__cabinet">'
            + highlightTerm(it.cabinet, q)
          + '</span>'
        : '';

      var nameLine = it.name
        ? '<span class="ta-pros-result__name">'
            + highlightTerm(it.name, q)
          + '</span>'
        : '';

      var subLine = lines.length
        ? '<span class="ta-pros-result__sub">' + lines.join(' &nbsp;·&nbsp; ') + '</span>'
        : '';

      var btn = showPickBtn
        ? '<button type="button" class="ta-btn ta-btn--primary ta-btn--sm" '
            + 'data-ta-pros-pick="' + String(it.id) + '">'
            + 'Choisir'
          + '</button>'
        : '';

      return '<div class="ta-pros-result-card" data-result-id="' + String(it.id) + '">'
           +   '<div class="ta-pros-result-card__info">'
           +     cabinetLine
           +     nameLine
           +     subLine
           +   '</div>'
           +   '<div class="ta-pros-result-card__action">' + btn + '</div>'
           + '</div>';
    }

    var html = '';

    /* ---------- 1 résultat : confirmation ---------- */
    if(items.length === 1){
      var it = items[0];
      var lines = [];
      if(it.city)  lines.push("📍 " + escapeHtml(it.city));
      if(it.phone) lines.push("📞 " + escapeHtml(it.phone));

      html  = '<div class="ta-pros-confirm-card">';
      html +=   '<p class="ta-pros-confirm-card__label">1 résultat trouvé</p>';
      html +=   '<div class="ta-pros-result-card ta-pros-result-card--featured">';
      html +=     '<div class="ta-pros-result-card__info">';
      if(it.cabinet){
        html += '<span class="ta-pros-result__cabinet">' + highlightTerm(it.cabinet, q) + '</span>';
      }
      if(it.name){
        html += '<span class="ta-pros-result__name">' + highlightTerm(it.name, q) + '</span>';
      }
      if(lines.length){
        html += '<span class="ta-pros-result__sub">' + lines.join(' &nbsp;·&nbsp; ') + '</span>';
      }
      html +=     '</div>';
      html +=   '</div>';
      html +=   '<div class="ta-pros-confirm-card__actions">';
      html +=     '<button type="button" class="ta-btn ta-btn--primary" '
               +    'data-ta-pros-pick="' + String(it.id) + '">'
               +    '✓ Oui, c\'est lui'
               + '</button>';
      html +=     '<button type="button" class="ta-btn ta-btn--ghost" '
               +    'data-ta-pros-not-found>'
               +    'Non, ce n\'est pas lui'
               + '</button>';
      html +=   '</div>';
      html += '</div>';

    } else {
      /* ---------- N résultats : liste ---------- */
      html = '<p class="ta-pros-results-count">'
           +   items.length + ' résultats trouvés'
           + '</p>';

      html += '<div class="ta-pros-results-list">';
      items.forEach(function(it){
        html += cardHTML(it, q, true);
      });
      html += '</div>';

      /* Lien "Pas dans la liste" */
      html += '<div class="ta-pros-results-notfound">'
            +   '<span>Vous ne trouvez pas le bon professionnel ?</span>'
            +   '<button type="button" class="ta-btn ta-btn--ghost ta-btn--sm" '
            +     'data-ta-pros-not-found>Ajouter manuellement</button>'
            + '</div>';
    }

    resultsBox.innerHTML = html;
    resultsBox.hidden    = false;
  }

  /* =========================================================
   * SEARCH — requête AJAX (debounce 280ms)
   * ======================================================= */
  var doSearch = debounce(function(){
    if(!searchInput) return;

    var q = String(searchInput.value || "").trim();

    if(q.length < 2){
      clearSearchUI();
      return;
    }

    setSearchLoading(true);

    doAjax("ta_pros_search", { q: q, type: currentType() }, function(res){
      var items = (res && res.data && res.data.items) ? res.data.items : [];
      renderResults(items, q);
    });

  }, 280);

  if(searchInput){
    searchInput.addEventListener("input", doSearch);
  }

  /* =========================================================
   * SEARCH — clic sur "Choisir" ou "Oui c'est lui"
   * Délégation sur document (éléments créés dynamiquement)
   * ======================================================= */
  document.addEventListener("click", function(e){

    /* Bouton "Pas dans la liste / Non ce n'est pas lui" */
    if(e.target.closest("[data-ta-pros-not-found]")){
      e.preventDefault();
      if(emptyBox) emptyBox.hidden = false;
      if(resultsBox){
        resultsBox.innerHTML = "";
        resultsBox.hidden    = true;
      }
      return;
    }

    /* Sélection d'un résultat */
    var pick = e.target.closest("[data-ta-pros-pick]");
    if(!pick) return;
    e.preventDefault();

    var pid = pick.getAttribute("data-ta-pros-pick");
    if(!pid) return;

    /* Feedback visuel sur la carte pendant le chargement */
    var card = pick.closest(".ta-pros-result-card, .ta-pros-confirm-card");
    if(card) card.classList.add("is-loading");
    pick.disabled = true;

    doAjax("ta_pros_get", { pro_id: pid }, function(res){
      var item = res && res.data && res.data.item ? res.data.item : null;
      if(!item){
        showMessage("Impossible de charger ce professionnel.", true);
        if(card) card.classList.remove("is-loading");
        if(pick) pick.disabled = false;
        return;
      }
      fillManual(item, "add");
    });
  });

  /* =========================================================
   * Pré-remplissage formulaire (étape 3)
   * FIX : item.cabinet (clé retournée par le serveur)
   * ======================================================= */
  function fillManual(item, mode){
    mode = mode || "add";

    var f;
    f = getField("pro_id");      if(f) f.value = String(item.id || "");

    if(!currentType() && item.type) setType(item.type);

    f = getField("pro_name");    if(f) f.value = item.name    || "";
    f = getField("pro_phone");   if(f) f.value = item.phone   || "";
    f = getField("pro_email");   if(f) f.value = item.email   || "";
    f = getField("pro_address"); if(f) f.value = item.address || "";
    f = getField("pro_city");    if(f) f.value = item.city    || "";
    f = getField("pro_notes");   if(f) f.value = item.notes   || "";
    /* FIX : le serveur renvoie "cabinet", le champ form s'appelle "pro_clinic" */
    f = getField("pro_clinic");  if(f) f.value = item.cabinet || item.clinic || "";

    var ok = (currentType() !== "") && checkIdentityValid();
    setSaveEnabled(ok);
    updateIdentityUI();

    setFormMode(mode);
    showStep("manual");
    scrollToEl(stepManual);

    var nameField = getField("pro_name");
    if(nameField) setTimeout(function(){ nameField.focus(); }, 150);
  }

  /* =========================================================
   * STEP 1 — choix du type
   * ======================================================= */
  typeBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      var type = btn.dataset.proType || "";
      setType(type);
      showStep("search");
      clearSearchUI();
      if(searchInput){
        searchInput.value = "";
        setTimeout(function(){ searchInput.focus(); }, 120);
      }
    });
  });

  /* =========================================================
   * Navigation inter-étapes
   * ======================================================= */
  document.addEventListener("click", function(e){

    if(e.target.closest("[data-ta-pros-open-manual]")){
      e.preventDefault();
      resetManualForm(true);
      showStep("manual");
      scrollToEl(stepManual);
      var nf = getField("pro_name");
      if(nf) setTimeout(function(){ nf.focus(); }, 120);
      return;
    }

    if(e.target.closest("[data-ta-pros-back-type]")){
      e.preventDefault();
      removeEditingClass();
      setFormMode("add");
      showStep("type");
      clearSearchUI();
      return;
    }

    if(e.target.closest("[data-ta-pros-back-search]")){
      e.preventDefault();
      showStep("search");
      clearSearchUI();
      if(searchInput) setTimeout(function(){ searchInput.focus(); }, 120);
      return;
    }

    if(e.target.closest("[data-ta-pros-cancel]")){
      e.preventDefault();
      removeEditingClass();
      resetManualForm(true);
      showStep("type");
      clearSearchUI();
      return;
    }
  });

  function removeEditingClass(){
    root.querySelectorAll(".ta-pros-item--editing").forEach(function(el){
      el.classList.remove("ta-pros-item--editing");
    });
  }

  /* =========================================================
   * AJAX helper
   * ======================================================= */
  function doAjax(action, extraData, onSuccess){
    var body = new FormData();
    body.append("action",  action);
    body.append("nonce",   nonce);
    body.append("post_id", postId);

    if(extraData){
      Object.keys(extraData).forEach(function(k){
        body.append(k, extraData[k]);
      });
    }

    fetch(ajaxUrl, { method: "POST", body: body })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if(!res || !res.success){
          showMessage((res && res.data && res.data.message) || "Erreur.", true);
          setSaveEnabled(true);
          return;
        }
        if(onSuccess) onSuccess(res);
      })
      .catch(function(){
        showMessage("Erreur réseau, veuillez réessayer.", true);
        setSaveEnabled(true);
      });
  }

  /* =========================================================
   * EDIT — bouton ✏️ dans la liste
   * ======================================================= */
  document.addEventListener("click", function(e){
    var editBtn = e.target.closest("[data-ta-pros-edit]");
    if(!editBtn) return;
    e.preventDefault();

    var pid = editBtn.getAttribute("data-ta-pros-edit");
    if(!pid) return;

    var itemCard = editBtn.closest("[data-pro-type]");
    var type     = itemCard ? (itemCard.getAttribute("data-pro-type") || "") : "";

    if(type) setType(type);

    removeEditingClass();
    if(itemCard) itemCard.classList.add("ta-pros-item--editing");

    doAjax("ta_pros_get", { pro_id: pid }, function(res){
      var item = res && res.data && res.data.item ? res.data.item : null;
      if(!item){
        showMessage("Impossible de charger ce professionnel.", true);
        if(itemCard) itemCard.classList.remove("ta-pros-item--editing");
        return;
      }
      if(type) item.type = type;
      fillManual(item, "edit");
    });
  });

  /* =========================================================
   * Bibliothèque → formulaire pré-rempli
   * ======================================================= */
  if(libSelect && linkBtn){
    libSelect.addEventListener("change", function(){
      linkBtn.disabled = (libSelect.value === "");
    });

    linkBtn.addEventListener("click", function(e){
      e.preventDefault();
      if(!libSelect.value) return;

      doAjax("ta_pros_get", { pro_id: libSelect.value }, function(res){
        var item = res && res.data && res.data.item ? res.data.item : null;
        if(!item){
          showMessage("Impossible de charger ce professionnel.", true);
          return;
        }
        fillManual(item, "add");
        libSelect.value  = "";
        linkBtn.disabled = true;
      });
    });
  }

  /* =========================================================
   * STEP 3 — Enregistrer (create/update + link)
   * ======================================================= */
  form.addEventListener("submit", function(e){
    e.preventDefault();
    setSaveEnabled(false);

    var keys = [
      "pro_id","pro_type","pro_name","pro_clinic",
      "pro_phone","pro_email","pro_address","pro_city","pro_notes"
    ];
    var data   = {};
    var isEdit = false;

    keys.forEach(function(key){
      var el = getField(key);
      data[key] = el ? el.value.trim() : "";
    });

    isEdit = data["pro_id"] !== "";

    doAjax("ta_pros_save", data, function(){
      showMessage(isEdit ? "Professionnel mis à jour !" : "Professionnel ajouté !", false);
      window.location.reload();
    });
  });

  /* =========================================================
   * Validation either/or : établissement OU nom obligatoire
   * ======================================================= */
  var identityHint   = root.querySelector("[data-ta-pros-identity-hint]");
  var identityGroup  = root.querySelector("[data-ta-pros-identity-group]");

  function checkIdentityValid(){
    var clinicEl = getField("pro_clinic");
    var nameEl2  = getField("pro_name");
    var clinic   = clinicEl ? clinicEl.value.trim() : "";
    var name2    = nameEl2  ? nameEl2.value.trim()  : "";
    return (clinic !== "" || name2 !== "");
  }

  function updateIdentityUI(){
    var valid  = checkIdentityValid();
    var filled = (function(){
      var c = getField("pro_clinic"); var n = getField("pro_name");
      return (c && c.value.trim() !== "") || (n && n.value.trim() !== "");
    })();

    if(identityGroup){
      identityGroup.classList.toggle("has-error",  filled && !valid);
      identityGroup.classList.toggle("has-success", valid);
    }
    if(identityHint){
      if(filled && !valid){
        identityHint.textContent = "⚠️ Remplissez au moins l'un des deux champs.";
        identityHint.className   = "ta-field-pair__hint is-error";
      } else if(valid){
        identityHint.textContent = "ℹ️ Au moins l'un des deux champs est obligatoire.";
        identityHint.className   = "ta-field-pair__hint";
      } else {
        identityHint.textContent = "ℹ️ Au moins l'un des deux champs est obligatoire.";
        identityHint.className   = "ta-field-pair__hint";
      }
    }
  }

  form.addEventListener("input", function(){
    var typeEl = getField("pro_type");
    var typeOk = typeEl && typeEl.value !== "";
    var idOk   = checkIdentityValid();
    setSaveEnabled(typeOk && idOk);
    updateIdentityUI();
  });

  /* =========================================================
   * SET DEFAULT — bouton ⭐ dans la liste
   * ======================================================= */
  document.addEventListener("click", function(e){
    var defaultBtn = e.target.closest("[data-ta-pros-set-default]");
    if(!defaultBtn) return;
    e.preventDefault();

    var pid = defaultBtn.getAttribute("data-ta-pros-set-default");
    if(!pid) return;

    var itemCard = defaultBtn.closest("[data-pro-id]");
    var groupEl  = defaultBtn.closest(".ta-pros-group");
    if(!itemCard || !groupEl) return;

    defaultBtn.disabled     = true;
    defaultBtn.style.opacity = "0.5";

    doAjax("ta_pros_set_default", { pro_id: pid }, function(){

      groupEl.querySelectorAll("[data-pro-id]").forEach(function(card){
        card.classList.remove("ta-pros-item--default");
        card.setAttribute("data-pro-default", "0");

        var badge = card.querySelector(".ta-pros-badge--default");
        if(badge) badge.remove();

        var nameEl2 = card.querySelector(".ta-pros-item__name");
        if(nameEl2) nameEl2.textContent = nameEl2.textContent.replace(/\s*✏️$/, "");

        var actions = card.querySelector(".ta-pros-item__actions");
        if(actions && !actions.querySelector("[data-ta-pros-set-default]")){
          var existingEdit = actions.querySelector("[data-ta-pros-edit]");
          var starBtn = document.createElement("button");
          starBtn.type      = "button";
          starBtn.className = "ta-btn ta-btn--ghost ta-btn--icon";
          starBtn.setAttribute("data-ta-pros-set-default", card.getAttribute("data-pro-id"));
          starBtn.setAttribute("aria-label", "Définir comme contact par défaut");
          starBtn.setAttribute("title",      "Définir comme contact par défaut");
          starBtn.textContent = "⭐";
          actions.insertBefore(starBtn, existingEdit);
        }
      });

      itemCard.classList.add("ta-pros-item--default");
      itemCard.setAttribute("data-pro-default", "1");

      var nameWrap = itemCard.querySelector(".ta-pros-item__name-wrap");
      if(nameWrap && !nameWrap.querySelector(".ta-pros-badge--default")){
        var badge2 = document.createElement("span");
        badge2.className = "ta-pros-badge ta-pros-badge--default";
        badge2.innerHTML  = "⭐ Par défaut";
        nameWrap.appendChild(badge2);
      }

      defaultBtn.remove();

      var firstItem = groupEl.querySelector("[data-pro-id]");
      if(firstItem && firstItem !== itemCard){
        groupEl.insertBefore(itemCard, firstItem);
      }

      showMessage("Contact par défaut mis à jour ✓", false);
    });
  });

  /* =========================================================
   * UNLINK
   * ======================================================= */
  document.addEventListener("click", function(e){
    var unlinkBtn = e.target.closest("[data-ta-pros-unlink]");
    if(!unlinkBtn) return;
    e.preventDefault();

    if(!window.confirm("Retirer ce professionnel de la fiche de votre animal ?")) return;

    doAjax("ta_pros_unlink", { pro_id: unlinkBtn.dataset.taProsUnlink }, function(){
      window.location.reload();
    });
  });

  /* =========================================================
   * INIT
   * ======================================================= */
  showStep("type");
  clearSearchUI();
  setSaveEnabled(false);

  console.log("[TA_PROS] Module initialisé v2", { postId: postId });

});

})();