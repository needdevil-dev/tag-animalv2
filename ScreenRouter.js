(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────
   * vaccine-add.js
   *
   * Responsabilités :
   *  1. Navigation wizard (étapes 1→2→3)
   *  2. Barre de progression
   *  3. Raccourcis date / suggestions nom
   *  4. Badge "date passée"
   *  5. Aperçu intelligent (rappel ou historique) — règle miroir PHP
   *  6. Validation UX
   *  7. Soumission AJAX → ta_care_save
   *  8. Toast feedback
   *
   * Zéro style inline. Tout passe par des classes CSS.
   * La décision finale de rappel reste côté PHP (CareAjaxController).
   * ───────────────────────────────────────────────────────────── */

  const LOG = "[TA_VAX]";
  const log  = (...a) => console.log(LOG, ...a);

  /* ── CONTEXTE WORDPRESS ──────────────────────────────────── */

  const TA = window.TA_HEALTH || null;
  if ( ! TA || ! TA.ajax_url || ! TA.nonce || ! TA.post_id ) {
    console.error( LOG, "TA_HEALTH manquant", TA );
    return;
  }

  const ajaxUrl = String( TA.ajax_url );
  const nonce   = String( TA.nonce );
  const postId  = String( TA.post_id );

  /* ── UTILS DATE ──────────────────────────────────────────── */

  /** @returns {string} YYYY-MM-DD */
  function todayISO() {
    return new Date().toISOString().slice( 0, 10 );
  }

  /** @returns {string} YYYY-MM-DD */
  function yesterdayISO() {
    const d = new Date();
    d.setDate( d.getDate() - 1 );
    return d.toISOString().slice( 0, 10 );
  }

  /** YYYY-MM-DD → JJ/MM/AAAA */
  function fmtFR( iso ) {
    if ( ! iso || !/^\d{4}-\d{2}-\d{2}$/.test( iso ) ) return "—";
    const [ y, m, d ] = iso.split( "-" );
    return `${ d }/${ m }/${ y }`;
  }

  /**
   * Ajoute N mois à une date ISO sans débordement de fin de mois.
   * Ex : 31/01 + 1 mois → 28/02 (ou 29 en année bissextile)
   *
   * @param  {string} iso   YYYY-MM-DD
   * @param  {number} n     Nombre de mois
   * @returns {string|null} YYYY-MM-DD ou null
   */
  function addMonths( iso, n ) {
    if ( ! iso || n <= 0 ) return null;
    const [ y, m, d ] = iso.split( "-" ).map( Number );
    const total  = m - 1 + n;
    const newY   = y + Math.floor( total / 12 );
    const newM   = ( ( total % 12 ) + 12 ) % 12;
    const maxD   = new Date( newY, newM + 1, 0 ).getDate();
    const finalD = Math.min( d, maxD );
    const pad    = v => String( v ).padStart( 2, "0" );
    return `${ newY }-${ pad( newM + 1 ) }-${ pad( finalD ) }`;
  }
  
      /** @returns {boolean} True si la date iso est > 1 an */
    function isDateOverOneYear(iso) {
      if (!iso) return false;
      const inputDate = new Date(iso);
      const limitDate = new Date();
      limitDate.setFullYear(limitDate.getFullYear() - 1);
      limitDate.setHours(0, 0, 0, 0);
      return inputDate < limitDate;
    }

  /* ── RÈGLE MÉTIER RAPPEL ─────────────────────────────────── */
  /**
   * Miroir JS de CareAjaxController::applyVaccineReminderLogic().
   *
   * Règle :
   *  delay = 0                        → historique
   *  calculatedNextDue ≤ aujourd'hui  → historique (rappel déjà dépassé)
   *  calculatedNextDue > aujourd'hui  → rappel actif
   *
   * @param  {string} executedAt  YYYY-MM-DD
   * @param  {number} months
   * @returns {{ active:boolean, nextDueISO:string|null, reason:string }}
   */
  function computeReminder( executedAt, months ) {
    const today = todayISO();

    if ( months <= 0 ) {
      return { active: false, nextDueISO: null, reason: "Aucun rappel sélectionné." };
    }

    if ( ! executedAt || !/^\d{4}-\d{2}-\d{2}$/.test( executedAt ) ) {
      return { active: false, nextDueISO: null, reason: "Date d'injection manquante." };
    }

    const nextDueISO = addMonths( executedAt, months );
    if ( ! nextDueISO ) {
      return { active: false, nextDueISO: null, reason: "Calcul de la date impossible." };
    }

    if ( nextDueISO <= today ) {
      return {
        active: false,
        nextDueISO,
        reason: `Le prochain rappel (${ fmtFR( nextDueISO ) }) est déjà dépassé.`,
      };
    }

    return { active: true, nextDueISO, reason: null };
  }

  /* ── SÉLECTEURS ──────────────────────────────────────────── */

  const $  = ( sel, ctx = document ) => ctx.querySelector( sel );
  const $$ = ( sel, ctx = document ) => Array.from( ctx.querySelectorAll( sel ) );

  const getRoot  = ()  => $( "[data-ta-entry-root]" );
  const getForm  = (r) => $( '[data-ta-health-form="vaccine"]', r );
  const getSteps = (f) => $$( "[data-ta-vax-step]", f );

  function getActiveN( form ) {
    const active = getSteps( form ).find( el => ! el.hidden );
    return parseInt( active?.dataset.taVaxStep ?? "1", 10 );
  }

  function getMonths( form ) {
    const el = $( '[name="vaccine_reminder_months"]:checked', form );
    return el ? parseInt( el.value, 10 ) : 12;
  }

  function getFieldVal( form, name ) {
    return ( $( `[name="${ name }"]`, form )?.value ?? "" ).trim();
  }

  /* ── BARRE DE PROGRESSION ────────────────────────────────── */

  function updateProgress( form, current ) {
    const scope = form.closest( "[data-ta-entry-root]" ) ?? document;

    $$( "[data-prog]", scope ).forEach( el => {
      const n = parseInt( el.dataset.prog, 10 );
      el.classList.toggle( "is-active", n === current );
      el.classList.toggle( "is-done",   n < current );
    });

    $$( ".vax-progress__line", scope ).forEach( ( line, i ) => {
      line.classList.toggle( "is-done", i < current - 1 );
    });
  }

  /* ── NAVIGATION ──────────────────────────────────────────── */

  function showStep( form, n ) {
    const steps  = getSteps( form );
    const target = Math.max( 1, Math.min( n, steps.length ) );

    steps.forEach( el => {
      el.hidden = String( el.dataset.taVaxStep ) !== String( target );
    });

    updateProgress( form, target );

    if ( target === 3 ) refreshPreview( form );

    log( "→ étape", target );
  }
  
  

  /* ── APERÇU INTELLIGENT ──────────────────────────────────── */

  function refreshPreview( form ) {
    const preview = $( "#ta-vax-preview", form );
    if ( ! preview ) return;

    const executedAt = getFieldVal( form, "executed_at" );
    const months     = getMonths( form );
    const result     = computeReminder( executedAt, months );

    // data-state pilote l'affichage via CSS (aucun style inline)
    preview.dataset.state = result.active ? "reminder" : "history";

    if ( result.active ) {
      const el = $( "#ta-preview-date", form );
      if ( el ) el.textContent = fmtFR( result.nextDueISO );
    } else {
      const el = $( "#ta-preview-reason", form );
      if ( el ) el.textContent = result.reason;
    }

    log( "Aperçu →", result.active
      ? `rappel actif — ${ result.nextDueISO }`
      : `historique — ${ result.reason }` );
  }

    /* ── BADGE DATE PASSÉE ───────────────────────────────────── */
    /**
     * Gestion de l'affichage du badge d'alerte de date
     * Affiche le message UNIQUEMENT si l'injection date de plus de 12 mois.
     */
    function refreshDateBadge(form, iso) {
      const badge = $("#ta-vax-past-badge", form);
      const span = badge ? badge.querySelector("span") : null;
      const nextBtn = form.querySelector("[data-ta-vax-next]"); // On récupère le bouton
      
      if (!badge || !span || !nextBtn) return;
    
      if (!iso) {
        badge.hidden = true;
        return;
      }
    
      const isTooOld = isDateOverOneYear(iso); // On utilise notre nouvelle fonction
      
      if (isTooOld) {
        span.textContent = "Cette injection date de plus d'un an. Elle sera enregistrée sans rappel actif.";
        badge.hidden = false;
        
        // On change le label du bouton pour être transparent avec l'utilisateur
        nextBtn.innerHTML = `Enregistrer l'historique <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      } else {
        badge.hidden = true;
        // On remet le label standard si l'utilisateur change la date pour une plus récente
        nextBtn.innerHTML = `Continuer <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      }
    }

  /* ── VALIDATION UX ───────────────────────────────────────── */

  function validateStep( form, n ) {
    if ( n === 1 ) {
      const el = $( '[name="vaccine_name"]', form );
      if ( ! ( el?.value ?? "" ).trim() ) {
        markError( el );
        showToast( "Le nom du vaccin est requis.", "error" );
        return false;
      }
    }
    if ( n === 2 ) {
      const el = $( '[name="executed_at"]', form );
      if ( !/^\d{4}-\d{2}-\d{2}$/.test( ( el?.value ?? "" ).trim() ) ) {
        markError( el );
        showToast( "Veuillez sélectionner une date.", "error" );
        return false;
      }
    }
    return true;
  }

  /** Ajoute la classe CSS has-error, retire dès la prochaine saisie */
  function markError( el ) {
    if ( ! el ) return;
    el.classList.add( "has-error" );
    el.focus();
    el.addEventListener(
      "input",
      () => el.classList.remove( "has-error" ),
      { once: true }
    );
  }

  /* ── TOAST ───────────────────────────────────────────────── */

  function showToast( msg, type = "info" ) {
    let t = $( "#vax-toast" );

    // Crée le toast s'il n'existe pas encore dans le DOM
    if ( ! t ) {
      t = document.createElement( "div" );
      t.id = "vax-toast";
      document.body.appendChild( t );
    }

    t.className   = `vax-toast vax-toast--${ type }`;
    t.textContent = msg;
    t.hidden      = false;

    clearTimeout( t._tid );
    requestAnimationFrame( () => t.classList.add( "is-visible" ) );

    t._tid = setTimeout( () => {
      t.classList.remove( "is-visible" );
      setTimeout( () => { t.hidden = true; }, 200 );
    }, 2800 );
  }

  /* ── LIAISON ÉVÉNEMENTS ──────────────────────────────────── */

  function bindEvents( root, form ) {

    root.addEventListener( "click", e => {

      /* Suggestion de nom */
      const chip = e.target.closest( "[data-ta-vax-suggest]" );
      if ( chip && form.contains( chip ) ) {
        const inp = $( '[name="vaccine_name"]', form );
        if ( inp ) {
          inp.value = chip.dataset.taVaxSuggest;
          inp.classList.remove( "has-error" );
        }
        return;
      }

      /* Raccourci date */
      const sc = e.target.closest( "[data-ta-vax-date]" );
      if ( sc && form.contains( sc ) ) {
        const inp = $( '[name="executed_at"]', form );
        if ( inp ) {
          inp.value = sc.dataset.taVaxDate === "yesterday"
            ? yesterdayISO()
            : todayISO();
          refreshDateBadge( form, inp.value );
          refreshPreview( form );
        }
        return;
      }

      /* Navigation wizard */
      const btn = e.target.closest(
        "[data-ta-vax-next],[data-ta-vax-prev],[data-ta-vax-submit]"
      );
      if ( ! btn || ! form.contains( btn ) ) return;
      e.preventDefault();

      const n = getActiveN( form );

      if ( btn.hasAttribute( "data-ta-vax-submit" ) ) {
        if ( validateStep( form, 1 ) && validateStep( form, 2 ) ) doSubmit( form );
        return;
      }
    if ( btn.hasAttribute( "data-ta-vax-next" ) ) {
      if ( validateStep( form, n ) ) {
        // Si on est à l'étape 2 et que le vaccin est vieux (> 1 an)
        if ( n === 2 && isDateOverOneYear( getFieldVal( form, "executed_at" ) ) ) {
          log( "Vaccin > 1 an : Enregistrement direct (skip étape 3)" );
          doSubmit( form ); // On soumet direct !
          return;
        }
        showStep( form, n + 1 );
      }
      return;
    }
      if ( btn.hasAttribute( "data-ta-vax-prev" ) ) {
        showStep( form, n - 1 );
      }
    });

    /* Mise à jour badge + aperçu sur changement de date */
    const dateInp = $( '[name="executed_at"]', form );
    if ( dateInp ) {
      dateInp.addEventListener( "change", () => {
        refreshDateBadge( form, dateInp.value );
        refreshPreview( form );
      });
    }

    /* Mise à jour aperçu sur changement de fréquence */
    $$( '[name="vaccine_reminder_months"]', form ).forEach( r => {
      r.addEventListener( "change", () => refreshPreview( form ) );
    });
  }

  /* ── SOUMISSION AJAX ─────────────────────────────────────── */

  async function doSubmit( form ) {
    const submitBtn = $( "[data-ta-vax-submit]", form );
    const name      = getFieldVal( form, "vaccine_name" );
    const date      = getFieldVal( form, "executed_at" );
    const months    = getMonths( form );
    const reminder  = computeReminder( date, months );

    const payload = new URLSearchParams({
      action:                 "ta_care_save",
      nonce,
      post_id:                postId,
      type:                   "vaccine",
      label:                  name,
      executed_at:            date,
      reminder_delay_months:  String( months ),
      // Indication au PHP — la décision finale lui appartient
      reminder_enabled:       reminder.active ? "1" : "0",
    });

    log( "SUBMIT →", { name, date, months, active: reminder.active, nextDue: reminder.nextDueISO });

    /* État loading : classe CSS only, zéro style inline */
    if ( submitBtn ) {
      submitBtn.classList.add( "is-loading" );
      submitBtn.disabled = true;
    }

    try {
      const res  = await fetch( ajaxUrl, {
        method:      "POST",
        credentials: "same-origin",
        headers:     { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body:        payload.toString(),
      });

      const json = await res.json();
      if ( ! json?.success ) throw new Error( json?.data?.message || "Erreur serveur" );
      const isActive = json.data?.reminder_active ?? reminder.active;

        // On prépare le terrain pour après le rechargement
        sessionStorage.setItem("ta_open_health_reminders", "1"); // Nouveau flag
        if (json.data && json.data.care_id) {
            sessionStorage.setItem("ta_highlight_care_id", json.data.care_id); // Déjà géré par health-card.js
        }
        
        showToast(
          isActive
            ? `🔔 Rappel programmé le ${ fmtFR( reminder.nextDueISO ) }`
            : "📋 Enregistré dans l'historique",
          "success"
        );
        
        setTimeout( () => {
            // Si c'est un rappel actif, on s'assure d'ajouter le hash pour le Router
            if (isActive) {
                window.location.hash = "#ta-screen-health"; 
            }
            window.location.reload();
        }, 1000 );


      showToast(
        isActive
          ? `🔔 Rappel programmé le ${ fmtFR( reminder.nextDueISO ) }`
          : "📋 Enregistré dans l'historique",
        "success"
      );

      // Court délai pour laisser le toast s'afficher avant le rechargement
      setTimeout( () => window.location.reload(), 1000 );

    } catch ( err ) {
      console.error( LOG, err );
      showToast( err.message || "Erreur réseau", "error" );

      if ( submitBtn ) {
        submitBtn.classList.remove( "is-loading" );
        submitBtn.disabled = false;
      }
    }
  }

  /* ── INIT ────────────────────────────────────────────────── */

  function init() {
    const root = getRoot();
    const form = getForm( root );

    if ( ! form ) {
      log( "formulaire introuvable — abandon" );
      return;
    }

    /* Pré-remplir la date avec aujourd'hui */
    const dateInp = $('[name="executed_at"]', form);
    if (dateInp && !dateInp.value) {
      dateInp.value = todayISO();
      // On appelle la fonction pour s'assurer que le badge est masqué au départ
      refreshDateBadge(form, dateInp.value); 
    }

    showStep( form, 1 );
    bindEvents( root, form );

    log( "READY" );
  }

  if ( document.readyState === "loading" ) {
    document.addEventListener( "DOMContentLoaded", init, { once: true } );
  } else {
    init();
  }

})();