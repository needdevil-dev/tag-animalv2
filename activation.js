/* =======================================================
   TAGANIMAL — JOURNAL & HEALTH HISTORY
   Fichier : journal.css
   Chargé par : journal-book.php

   RÔLE :
   Styles de l'historique journal et santé partagés.
   Navigation années, toolbar, stats, cartes, modal.

   NE CONTIENT PAS :
   - Le wizard d'ajout (home/note/forms)  → entry-journal.css
   - Les patterns génériques du wizard    → entry-global.css

   ORGANISATION :
   1.  Variables
   2.  Navigation années
   3.  Toolbar
   4.  Stats strip
   5.  Séparateurs année
   6.  Cartes — base commune
   7.  Cartes journal
   8.  Cartes santé
   9.  Vue liste
   10. État vide
   11. Modal détail
   12. Responsive
======================================================= */


/* =======================================================
   1. VARIABLES
======================================================= */

:root {
  /* Types journal */
  --ta-journal-obs:   #4A7C59;
  --ta-journal-rdv:   #3A6EA8;
  --ta-journal-event: #C47820;
  --ta-journal-note:  #C05465;

  /* Types santé */
  --ta-health-vaccine:      #3A6EA8;
  --ta-health-treatment:    #C47820;
  --ta-health-vermifuge:    #2E7D6B;
  --ta-health-antiparasite: #6B46C1;
  --ta-health-care:         #2E7D6B;

  /* Niveaux d'observation */
  --ta-level-1: #6BAE6B;
  --ta-level-2: #A8C45A;
  --ta-level-3: #F0B429;
  --ta-level-4: #E07B39;
  --ta-level-5: #C0392B;

  /* Communs */
  --ta-journal-muted:  #9B8878;
  --ta-journal-amber:  #F39A36;

  /* Formes */
  --ta-journal-radius-sm: 10px;
  --ta-journal-radius:    16px;

  /* Ombres */
  --ta-journal-shadow:       0 2px 12px rgba(61,43,31,.09);
  --ta-journal-shadow-hover: 0 8px 28px rgba(61,43,31,.14);

  /* Transitions */
  --ta-journal-transition: .2s ease;
}


/* =======================================================
   2. NAVIGATION ANNÉES
======================================================= */

.ta-journal-year-nav {
  display:       flex;
  align-items:   stretch;
  gap:           2px;
  overflow-x:    auto;
  scrollbar-width: none;
  padding:       0 2px 12px;
  margin-bottom: 4px;
  border-bottom: 2px solid var(--ta-field-border, #EFE8DC);
}

.ta-journal-year-nav::-webkit-scrollbar { display: none; }

.ta-journal-year-btn {
  display:     inline-flex;
  align-items: center;
  gap:         6px;
  border:      none;
  background:  none;
  cursor:      pointer;
  padding:     8px 14px;
  font-family: inherit;
  font-size:   .85rem;
  font-weight: 500;
  color:       var(--ta-journal-muted);
  border-radius: var(--ta-journal-radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    background var(--ta-journal-transition),
    color      var(--ta-journal-transition);
}

.ta-journal-year-btn:hover {
  background: rgba(61,43,31,.06);
  color:      var(--ta-earth, #3D2B1F);
}

.ta-journal-year-btn.is-active {
  background: var(--ta-journal-amber);
  color:      #fff;
  font-weight:700;
}

.ta-journal-year-count {
  font-size:    .68rem;
  font-weight:  700;
  background:   rgba(255,255,255,.3);
  border-radius:8px;
  padding:      1px 6px;
  line-height:  1.4;
}

.ta-journal-year-btn:not(.is-active) .ta-journal-year-count {
  background: rgba(61,43,31,.08);
  color:      var(--ta-journal-muted);
}


/* =======================================================
   3. TOOLBAR
======================================================= */

.ta-journal-toolbar {
  display:       flex;
  align-items:   center;
  flex-wrap:     wrap;
  gap:           8px;
  padding:       12px 0;
  margin-bottom: 4px;
}

/* Filtres pills */
.ta-journal-filters {
  display:  flex;
  flex-wrap:wrap;
  gap:      6px;
}

.ta-journal-filter-pill {
  border:        2px solid var(--ta-field-border, #EFE8DC);
  background:    transparent;
  border-radius: 20px;
  padding:       6px 14px;
  font-family:   inherit;
  font-size:     .8rem;
  font-weight:   500;
  color:         var(--ta-journal-muted);
  cursor:        pointer;
  display:       flex;
  align-items:   center;
  gap:           5px;
  white-space:   nowrap;
  transition:    all var(--ta-journal-transition);
}

.ta-journal-filter-pill:hover {
  border-color: var(--ta-journal-amber);
  color:        var(--ta-earth, #3D2B1F);
}

.ta-journal-filter-pill.is-active {
  border-color: var(--ta-journal-amber);
  background:   var(--ta-journal-amber);
  color:        #fff;
}

/* Filtres actifs — types journal */
.ta-journal-filter--observation.is-active { background: var(--ta-journal-obs);   border-color: var(--ta-journal-obs);   }
.ta-journal-filter--appointment.is-active { background: var(--ta-journal-rdv);   border-color: var(--ta-journal-rdv);   }
.ta-journal-filter--event.is-active       { background: var(--ta-journal-event); border-color: var(--ta-journal-event); }
.ta-journal-filter--note.is-active        { background: var(--ta-journal-note);  border-color: var(--ta-journal-note);  }

/* Filtres actifs — types santé */
.ta-journal-filter--vaccine.is-active      { background: var(--ta-health-vaccine);      border-color: var(--ta-health-vaccine);      }
.ta-journal-filter--vermifuge.is-active    { background: var(--ta-health-vermifuge);    border-color: var(--ta-health-vermifuge);    }
.ta-journal-filter--antiparasite.is-active { background: var(--ta-health-antiparasite); border-color: var(--ta-health-antiparasite); }
.ta-journal-filter--treatment.is-active    { background: var(--ta-health-treatment);    border-color: var(--ta-health-treatment);    }

/* Recherche */
.ta-journal-search-wrap {
  position:  relative;
  flex:      1;
  min-width: 180px;
  max-width: 300px;
}

.ta-journal-search-ico {
  position:       absolute;
  left:           12px;
  top:            50%;
  transform:      translateY(-50%);
  color:          var(--ta-journal-muted);
  pointer-events: none;
  display:        flex;
}

.ta-journal-search-input {
  width:         100%;
  border:        2px solid var(--ta-field-border, #EFE8DC);
  border-radius: var(--ta-journal-radius-sm);
  padding:       8px 32px 8px 36px;
  font-family:   inherit;
  font-size:     .85rem;
  background:    #fff;
  color:         var(--ta-earth, #3D2B1F);
  outline:       none;
  transition:    border-color var(--ta-journal-transition);
}

.ta-journal-search-input:focus       { border-color: var(--ta-journal-amber); }
.ta-journal-search-input::placeholder { color: var(--ta-journal-muted); }
.ta-journal-search-input::-webkit-search-cancel-button { display: none; }

.ta-journal-search-clear {
  position:      absolute;
  right:         8px;
  top:           50%;
  transform:     translateY(-50%);
  border:        none;
  background:    rgba(61,43,31,.08);
  border-radius: 50%;
  width:         20px;
  height:        20px;
  cursor:        pointer;
  font-size:     10px;
  color:         var(--ta-journal-muted);
  display:       flex;
  align-items:   center;
  justify-content:center;
  transition:    background var(--ta-journal-transition);
}

.ta-journal-search-clear:hover { background: rgba(61,43,31,.15); }

/* Vue toggle */
.ta-journal-view-toggle {
  display:       flex;
  gap:           2px;
  background:    var(--ta-field-border, #EFE8DC);
  border-radius: var(--ta-journal-radius-sm);
  padding:       3px;
}

.ta-journal-view-btn {
  border:          none;
  background:      none;
  border-radius:   7px;
  padding:         6px 10px;
  cursor:          pointer;
  color:           var(--ta-journal-muted);
  display:         flex;
  align-items:     center;
  justify-content: center;
  transition:      all var(--ta-journal-transition);
}

.ta-journal-view-btn.is-active {
  background: #fff;
  color:      var(--ta-earth, #3D2B1F);
  box-shadow: 0 1px 4px rgba(61,43,31,.1);
}

/* Compteur résultats */
.ta-journal-results-count {
  font-size:   .78rem;
  font-weight: 600;
  color:       var(--ta-journal-muted);
  margin-left: auto;
  white-space: nowrap;
}


/* =======================================================
   4. STATS STRIP
======================================================= */

.ta-journal-stats-strip {
  display:       flex;
  border:        1px solid var(--ta-field-border, #EFE8DC);
  border-radius: var(--ta-journal-radius-sm);
  overflow:      hidden;
  margin-bottom: 20px;
  background:    #fff;
}

.ta-journal-stat {
  flex:            1;
  min-width:       70px;
  padding:         10px 8px;
  text-align:      center;
  border-right:    1px solid var(--ta-field-border, #EFE8DC);
  display:         flex;
  flex-direction:  column;
  align-items:     center;
  gap:             2px;
}

.ta-journal-stat:last-child { border-right: none; }

.ta-journal-stat-value {
  font-size:   1.25rem;
  font-weight: 700;
  line-height: 1;
  color:       var(--ta-earth, #3D2B1F);
}

.ta-journal-stat-label {
  font-size:      .65rem;
  text-transform: uppercase;
  letter-spacing: .5px;
  font-weight:    600;
  color:          var(--ta-journal-muted);
}

/* Couleurs stats journal */
.ta-journal-stat--obs   .ta-journal-stat-value { color: var(--ta-journal-obs);   }
.ta-journal-stat--rdv   .ta-journal-stat-value { color: var(--ta-journal-rdv);   }
.ta-journal-stat--event .ta-journal-stat-value { color: var(--ta-journal-event); }
.ta-journal-stat--note  .ta-journal-stat-value { color: var(--ta-journal-note);  }

/* Couleurs stats santé */
.ta-journal-stat--vaccine      .ta-journal-stat-value { color: var(--ta-health-vaccine);      }
.ta-journal-stat--vermifuge    .ta-journal-stat-value { color: var(--ta-health-vermifuge);    }
.ta-journal-stat--antiparasite .ta-journal-stat-value { color: var(--ta-health-antiparasite); }
.ta-journal-stat--treatment    .ta-journal-stat-value { color: var(--ta-health-treatment);    }


/* =======================================================
   5. SÉPARATEURS ANNÉE
======================================================= */

.ta-journal-year-section { margin-bottom: 8px; }

.ta-journal-year-divider {
  display:     flex;
  align-items: center;
  gap:         10px;
  padding:     16px 0 8px;
}

.ta-journal-year-divider-line {
  flex:       1;
  height:     1px;
  background: var(--ta-field-border, #EFE8DC);
}

.ta-journal-year-divider-label {
  font-size:   1rem;
  font-weight: 700;
  color:       var(--ta-earth, #3D2B1F);
  white-space: nowrap;
}

.ta-badge--muted {
  background:    rgba(61,43,31,.07);
  color:         var(--ta-journal-muted);
  font-size:     .68rem;
  font-weight:   600;
  padding:       3px 9px;
  border-radius: 10px;
  white-space:   nowrap;
}


/* =======================================================
   6. CARTES — BASE COMMUNE
   Bande colorée gauche et hover partagés
   entre journal-history-item et health-history-item.
======================================================= */

/* Bande colorée gauche — types journal */
.ta-history--observation { border-left: 4px solid var(--ta-journal-obs)   !important; }
.ta-history--appointment { border-left: 4px solid var(--ta-journal-rdv)   !important; }
.ta-history--event       { border-left: 4px solid var(--ta-journal-event) !important; }
.ta-history--note        { border-left: 4px solid var(--ta-journal-note)  !important; }

/* Bande colorée gauche + fond teinté — types santé */
.ta-history--vaccine {
  border-left: 4px solid var(--ta-health-vaccine) !important;
  background:  rgba(58,110,168,.06)               !important;
}
.ta-history--vermifuge {
  border-left: 4px solid var(--ta-health-vermifuge) !important;
  background:  rgba(46,125,107,.06)                 !important;
}
.ta-history--antiparasite {
  border-left: 4px solid var(--ta-health-antiparasite) !important;
  background:  rgba(107,70,193,.06)                    !important;
}
.ta-history--treatment {
  border-left: 4px solid var(--ta-health-treatment) !important;
  background:  rgba(196,120,32,.06)                  !important;
}

/* Hover commun */
.ta-journal-history-item,
.ta-health-history-item {
  cursor: pointer;
  transition:
    transform  var(--ta-journal-transition),
    box-shadow var(--ta-journal-transition);
  animation: ta-journal-fadein .3s both;
}

.ta-journal-history-item:hover,
.ta-health-history-item:hover {
  transform:  translateY(-2px);
  box-shadow: var(--ta-journal-shadow-hover);
}

.ta-journal-history-item:focus-visible,
.ta-health-history-item:focus-visible {
  outline:        2px solid var(--ta-journal-amber);
  outline-offset: 2px;
}

/* Animation entrée */
@keyframes ta-journal-fadein {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
}

/* Highlight post-save — référencé dans entry-journal.css aussi */
@keyframes ta-journal-highlight-pulse {
  0%   { box-shadow: 0 0 0 0   rgba(243,154,54,.5); }
  60%  { box-shadow: 0 0 0 10px rgba(243,154,54,0); }
  100% { box-shadow: 0 0 0 0   rgba(243,154,54,0); }
}

.ta-journal-highlight { animation: ta-journal-highlight-pulse 1.4s ease 2; }


/* =======================================================
   7. CARTES JOURNAL (journal-history)
======================================================= */

.ta-journal-history-head {
  display:       flex;
  align-items:   center;
  gap:           8px;
  margin-bottom: 10px;
}

.ta-journal-ico {
  font-size:  1.15rem;
  line-height:1;
  flex-shrink:0;
}

.ta-journal-type {
  font-size:      .72rem;
  font-weight:    700;
  letter-spacing: .5px;
  text-transform: uppercase;
  color:          var(--ta-journal-muted);
}

.ta-journal-card-date {
  margin-left: auto;
  font-size:   .72rem;
  font-weight: 600;
  color:       var(--ta-journal-muted);
  white-space: nowrap;
}

.ta-journal-history-body { display: flex; flex-direction: column; gap: 6px; }

.ta-journal-name {
  font-size:   .95rem;
  font-weight: 700;
  color:       var(--ta-earth, #3D2B1F);
  line-height: 1.3;
}

.ta-journal-note {
  font-size:            .82rem;
  color:                #6B4C38;
  line-height:          1.55;
  display:              -webkit-box;
  -webkit-line-clamp:   3;
  -webkit-box-orient:   vertical;
  overflow:             hidden;
}

.ta-journal-history-date {
  font-size:   .75rem;
  color:       var(--ta-journal-muted);
  font-weight: 500;
}

.ta-journal-tags {
  display:  flex;
  flex-wrap:wrap;
  gap:      5px;
  margin-top:2px;
}

.ta-journal-tag {
  font-size:     .7rem;
  font-weight:   600;
  padding:       3px 9px;
  border-radius: 8px;
  background:    rgba(61,43,31,.07);
  color:         var(--ta-journal-muted);
}


/* =======================================================
   8. CARTES SANTÉ (health-history)
======================================================= */

.ta-health-delete-btn {
  margin-left:  6px;
  flex-shrink:  0;
  border:       none;
  background:   rgba(61,43,31,.07);
  border-radius:50%;
  width:        22px;
  height:       22px;
  cursor:       pointer;
  display:      flex;
  align-items:  center;
  justify-content:center;
  color:        var(--ta-journal-muted);
  opacity:      0;
  pointer-events:none;
  transition:
    background var(--ta-journal-transition),
    color      var(--ta-journal-transition),
    opacity    var(--ta-journal-transition);
}

.ta-journal-history-item:hover .ta-health-delete-btn,
.ta-journal-history-item:focus-within .ta-health-delete-btn {
  opacity:       1;
  pointer-events:auto;
}

.ta-health-delete-btn:hover {
  background: rgba(192,57,43,.12);
  color:      #C0392B;
}

.ta-health-history-head {
  display:       flex;
  align-items:   center;
  gap:           8px;
  margin-bottom: 10px;
}

.ta-health-ico {
  font-size:  1.15rem;
  line-height:1;
  flex-shrink:0;
}

.ta-health-type {
  font-size:      .72rem;
  font-weight:    700;
  letter-spacing: .5px;
  text-transform: uppercase;
  color:          var(--ta-journal-muted);
}

.ta-health-history-body { display: flex; flex-direction: column; gap: 6px; }

.ta-health-name {
  font-size:   .95rem;
  font-weight: 700;
  color:       var(--ta-earth, #3D2B1F);
  line-height: 1.3;
}

.ta-health-observation-note {
  font-size:          .82rem;
  color:              #6B4C38;
  line-height:        1.55;
  display:            -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow:           hidden;
}

.ta-health-history-date {
  font-size:   .75rem;
  color:       var(--ta-journal-muted);
  font-weight: 500;
}

.ta-health-history-duration {
  font-size:   .78rem;
  color:       var(--ta-health-treatment);
  font-weight: 600;
}

.ta-health-observation-level {
  font-size:     .72rem;
  font-weight:   700;
  padding:       2px 9px;
  border-radius: 8px;
  background:    rgba(61,43,31,.07);
  color:         var(--ta-journal-muted);
}

.ta-level-1 { background: rgba(107,174,107,.15); color: var(--ta-level-1); }
.ta-level-2 { background: rgba(168,196, 90,.15); color: var(--ta-level-2); }
.ta-level-3 { background: rgba(240,180, 41,.15); color: var(--ta-level-3); }
.ta-level-4 { background: rgba(224,123, 57,.15); color: var(--ta-level-4); }
.ta-level-5 { background: rgba(192, 57, 43,.15); color: var(--ta-level-5); }


/* =======================================================
   9. VUE LISTE
======================================================= */

.ta-journal--list-view .ta-journal-year-grid {
  grid-template-columns: 1fr !important;
  gap:                   6px !important;
}

.ta-journal--list-view .ta-journal-history-item {
  padding: 12px 16px !important;
}

.ta-journal--list-view .ta-journal-history-body .ta-journal-note,
.ta-journal--list-view .ta-journal-history-body .ta-journal-history-date,
.ta-journal--list-view .ta-journal-history-body .ta-journal-tags {
  display: none;
}

.ta-journal--list-view .ta-journal-history-body .ta-journal-name {
  font-size: .9rem;
}


/* =======================================================
   10. ÉTAT VIDE
======================================================= */

.ta-journal-empty {
  padding:    48px 20px;
  text-align: center;
  grid-column:1 / -1;
}

.ta-journal-empty-ico {
  display:       block;
  font-size:     40px;
  margin-bottom: 12px;
}

.ta-journal-empty-title {
  font-size:     1rem;
  font-weight:   600;
  color:         var(--ta-earth, #3D2B1F);
  margin-bottom: 6px;
}

.ta-journal-empty-sub {
  font-size: .85rem;
  color:     var(--ta-journal-muted);
}


/* =======================================================
   11. MODAL DÉTAIL
======================================================= */

.ta-journal-modal-overlay {
  position:        fixed;
  inset:           0;
  background:      rgba(28,20,16,.55);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index:         9990;
  display:         flex;
  align-items:     flex-end;
  justify-content: center;
  opacity:         0;
  transition:      opacity .25s ease;
}

.ta-journal-modal-overlay.is-open { opacity: 1; }
.ta-journal-modal-overlay[hidden] { display: none; }
.ta-journal-modal-overlay:not([hidden]) { display: flex; }

.ta-journal-modal {
  background:    #fff;
  border-radius: 20px 20px 0 0;
  width:         100%;
  max-width:     580px;
  max-height:    80vh;
  overflow-y:    auto;
  transform:     translateY(40px);
  transition:    transform .35s cubic-bezier(.22,1,.36,1);
}

.ta-journal-modal-overlay.is-open .ta-journal-modal { transform: translateY(0); }

.ta-journal-modal-handle {
  width:         40px;
  height:        4px;
  background:    #EFE8DC;
  border-radius: 2px;
  margin:        12px auto 0;
}

.ta-journal-modal-head {
  display:       flex;
  align-items:   flex-start;
  gap:           14px;
  padding:       18px 20px;
  border-bottom: 1px solid #EFE8DC;
}

.ta-journal-modal-ico {
  width:           50px;
  height:          50px;
  border-radius:   14px;
  display:         flex;
  align-items:     center;
  justify-content: center;
  font-size:       22px;
  flex-shrink:     0;
}

.ta-journal-modal-info { flex: 1; min-width: 0; }

.ta-journal-modal-type {
  display:        block;
  font-size:      .72rem;
  font-weight:    700;
  letter-spacing: .6px;
  text-transform: uppercase;
  margin-bottom:  3px;
}

.ta-journal-modal-title {
  font-size:   1.1rem;
  font-weight: 700;
  color:       var(--ta-earth, #3D2B1F);
  margin:      0 0 4px;
  line-height: 1.25;
}

.ta-journal-modal-date {
  font-size: .78rem;
  color:     var(--ta-journal-muted);
  margin:    0;
}

.ta-journal-modal-close {
  border:          none;
  background:      #EFE8DC;
  border-radius:   50%;
  width:           30px;
  height:          30px;
  cursor:          pointer;
  display:         flex;
  align-items:     center;
  justify-content: center;
  font-size:       13px;
  color:           var(--ta-journal-muted);
  flex-shrink:     0;
  transition:      background var(--ta-journal-transition);
}

.ta-journal-modal-close:hover { background: #e0d5c8; }

.ta-journal-modal-body { padding: 20px; }

.ta-journal-modal-section-label {
  font-size:      .7rem;
  font-weight:    700;
  letter-spacing: .6px;
  text-transform: uppercase;
  color:          var(--ta-journal-muted);
  margin-bottom:  6px;
  margin-top:     16px;
}

.ta-journal-modal-section-label:first-child { margin-top: 0; }

.ta-journal-modal-text {
  font-size:   .9rem;
  color:       #6B4C38;
  line-height: 1.65;
}

.ta-journal-modal-chips {
  display:  flex;
  flex-wrap:wrap;
  gap:      6px;
}

.ta-journal-chip {
  padding:       5px 12px;
  border-radius: 16px;
  font-size:     .8rem;
  font-weight:   600;
  background:    rgba(61,43,31,.07);
  color:         #6B4C38;
}


/* =======================================================
   12. RESPONSIVE
======================================================= */

@media (max-width: 600px) {
  .ta-journal-toolbar       { gap: 6px; }
  .ta-journal-search-wrap   { max-width: 100%; flex: 1 0 100%; order: -1; }
  .ta-journal-results-count { margin-left: 0; }
  .ta-journal-stats-strip   { overflow-x: auto; }
  .ta-journal-stat          { min-width: 60px; padding: 8px 6px; }
  .ta-journal-stat-value    { font-size: 1rem; }
}


/* =======================================================
   FIN — journal.css
   Module Journal de vie — TagAnimal v1
   Historique + toolbar + stats + modal uniquement
   Wizard d'ajout → entry-journal.css
======================================================= */