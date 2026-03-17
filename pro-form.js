/* =======================================================
   TAGANIMAL — BLOC COMPORTEMENT (PREMIUM)
   Rôle :
   - Affichage & édition du comportement animal
   - Utilisé en fiche publique (owner / finder)
   - Lecture douce, non anxiogène, premium

   Scope STRICT :
   - .ta-fiche-public .block-behavior

   Ce fichier gère :
   - le bloc comportement (hors hero)
   - la vue owner (édition)
   - la vue publique (lecture)
======================================================= */


/* =======================================================
   1) CONTENEUR DU BLOC
   - Pas de layout global ici (géré par ta-block)
   - Ce niveau sert uniquement de scope
======================================================= */

/* (volontairement vide) */



/* =======================================================
   2) GROUPES DE COMPORTEMENT — STRUCTURE (OWNER)
   - Groupes sémantiques : positif / attention / vigilance
   - Lecture verticale, hiérarchie douce
======================================================= */

.ta-fiche-public .block-behavior .ta-behavior-groups{
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  border: 0;
}

/* Groupe individuel */
.ta-fiche-public .block-behavior .ta-behavior-group{
  position: relative;
  padding-left: 10px;
}

/* Repère vertical discret (importance visuelle) */
.ta-fiche-public .block-behavior .ta-behavior-group::before{
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;

  background:
    linear-gradient(
      180deg,
      transparent,
      color-mix(in srgb, var(--behavior-color) 35%, transparent),
      transparent
    );
}


/* =======================================================
   2.1) VARIANTES SÉMANTIQUES DES GROUPES
   - Couleurs sobres, jamais agressives
======================================================= */

.ta-fiche-public .block-behavior .ta-behavior-group--positif{
  --behavior-color: #3f7f5f;
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.95),
      rgba(240,250,245,.55)
    );
}

.ta-fiche-public .block-behavior .ta-behavior-group--attention{
  --behavior-color: #c57a2a;
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.95),
      rgba(255,245,225,.55)
    );
}

.ta-fiche-public .block-behavior .ta-behavior-group--vigilance{
  --behavior-color: #b04a4a;
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.95),
      rgba(255,240,240,.55)
    );
}


/* =======================================================
   2.2) TITRE DE GROUPE
======================================================= */

.ta-fiche-public .block-behavior .ta-behavior-head{
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  font-size: 0.95em;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ta-ink);
}

/* Pastille couleur (repère visuel) */
.ta-fiche-public .block-behavior .ta-behavior-head::before{
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--behavior-color);
  opacity: .75;
}


/* =======================================================
   3) OPTIONS — PILLS CHECKBOX (OWNER)
======================================================= */

.ta-fiche-public .block-behavior .ta-behavior-options{
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Option = pill premium */
.ta-fiche-public .block-behavior .ta-behavior-option{
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 7px 12px;
  border-radius: 999px;

  font-size: 0.88em;
  font-weight: 500;

  background: #fff;
  border: 1px solid var(--ta-border);
  color: var(--ta-ink);

  cursor: pointer;

  box-shadow:
    0 1px 0 rgba(255,255,255,.8) inset,
    0 2px 6px rgba(32,22,10,.04);

  transition:
    border-color .2s ease,
    background .2s ease,
    box-shadow .2s ease,
    transform .15s ease;
}

/* Hover doux */
.ta-fiche-public .block-behavior .ta-behavior-option:hover{
  border-color: color-mix(in srgb, var(--behavior-color) 45%, var(--ta-border));
  background: #fffdfa;
}

/* Checkbox native */
.ta-fiche-public .block-behavior .ta-behavior-option input{
  margin: 0;
  accent-color: var(--behavior-color);
}

/* Sélection = confiance */
.ta-fiche-public .block-behavior .ta-behavior-option input:checked + span{
  color: var(--behavior-color);
  font-weight: 650;
}


/* =======================================================
   4) VUE PUBLIQUE (FINDER)
   - Lecture seule
   - Pas de checkbox, pas d’interaction
   - Style texte simple, lisible
======================================================= */

.ta-fiche-public[data-ta-owner="0"] .block-behavior .ta-behavior-options{
  gap: 6px;
}

.ta-fiche-public[data-ta-owner="0"] .block-behavior .ta-behavior-option{
  cursor: default;
  box-shadow: none;
}

.ta-fiche-public[data-ta-owner="0"] .block-behavior .ta-behavior-option input{
  display: none;
}


/* =======================================================
   5) TEXTE OPTIONNEL — MESSAGE / DÉTAILS
======================================================= */

.ta-fiche-public .ta-behavior-extra{
  margin-top: 18px;
}

.ta-fiche-public .ta-behavior-extra summary{
  cursor: pointer;
  font-weight: 600;
  color: var(--ta-muted);
}

.ta-fiche-public .ta-behavior-extra summary:hover{
  color: var(--ta-ink);
}


/* =======================================================
   6) MODE MOBILE — CARTES TOGGLE (OWNER)
======================================================= */

@media (max-width: 720px){

  .ta-fiche-public .block-behavior .ta-behavior-options{
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .ta-fiche-public .block-behavior .ta-behavior-option{
    width: 100%;
    padding: 14px 16px;
    border-radius: 14px;

    justify-content: space-between;

    background:
      linear-gradient(
        180deg,
        #ffffff,
        #fffaf3
      );

    border: 1px solid var(--ta-border);

    box-shadow:
      0 2px 6px rgba(32,22,10,.05);
  }

  /* Checkbox masquée */
  .ta-fiche-public .block-behavior .ta-behavior-option input{
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  /* Texte sélectionné */
  .ta-fiche-public .block-behavior .ta-behavior-option input:checked + span{
    color: var(--behavior-color);
    font-weight: 700;
  }

  /* Carte sélectionnée */
  .ta-fiche-public .block-behavior .ta-behavior-option:has(input:checked){
    border-color: color-mix(in srgb, var(--behavior-color) 40%, var(--ta-border));
    background:
      linear-gradient(
        180deg,
        #ffffff,
        color-mix(in srgb, var(--behavior-color) 12%, #fffaf3)
      );
  }

  /* Check visuel */
  .ta-fiche-public .block-behavior .ta-behavior-option::after{
    content: "✓";
    font-size: 1em;
    font-weight: 700;
    color: var(--behavior-color);
    opacity: 0;
    transition: opacity .15s ease;
  }

  .ta-fiche-public .block-behavior .ta-behavior-option:has(input:checked)::after{
    opacity: 1;
  }
}


/* =======================================================
   7) TEXTAREA — MESSAGE COMPORTEMENT (OWNER)
======================================================= */

.ta-fiche-public .ta-behavior-extra textarea{
  width: 100%;
  min-height: 56px;
  resize: vertical;

  padding: 12px 14px;
  margin-top: 10px;

  border-radius: var(--ta-r-md);
  border: 1px solid var(--ta-border);

  background:
    linear-gradient(
      180deg,
      #ffffff,
      #fffaf3
    );

  font-family: var(--ta-font);
  font-size: 0.9em;
  line-height: 1.5;
  color: var(--ta-ink);

  box-shadow:
    0 1px 0 rgba(255,255,255,.9) inset,
    0 4px 12px rgba(32,22,10,.04);

  transition:
    border-color .2s ease,
    box-shadow .2s ease,
    background .2s ease;
}

/* Focus doux */
.ta-fiche-public .ta-behavior-extra textarea:focus{
  outline: none;
  border-color: var(--ta-accent);
  background: #ffffff;

  box-shadow:
    0 0 0 2px rgba(243,154,54,.25),
    0 6px 18px rgba(32,22,10,.08);
}

/* Placeholder */
.ta-fiche-public .ta-behavior-extra textarea::placeholder{
  color: var(--ta-muted);
  opacity: .75;
}
