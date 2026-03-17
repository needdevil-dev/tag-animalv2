/* ===============================================================
   TAGANIMAL — AUTH-CARD.CSS
   Carte accès à la fiche (connexion / déconnexion)

   ORGANISATION :
   1. Card wrapper
   2. État connecté
   3. État non connecté (CTA accès)
   4. Responsive

   DÉPENDANCE :
   Requiert global-card.css (.ta-preview-action déjà défini)

   SCOPE : .ta-fiche-public .block-auth
=============================================================== */


/* ===============================================================
   1. CARD WRAPPER
=============================================================== */

/* Le .ta-block et .ta-block-bd gèrent le cadre (global.css).
   Ici on ajoute uniquement la logique d'affichage spécifique. */

.ta-fiche-public .block-auth .ta-block-hd {
  margin-bottom: 0;
}

.ta-fiche-public .block-auth .ta-block-title {
  /* Hérité de global.css — aucun override requis */
}


/* ===============================================================
   2. ÉTAT CONNECTÉ
=============================================================== */

/* Encart "Vous êtes connecté" */
.ta-fiche-public .block-auth .ta-field-card {
  /* gradient léger vert pour l'état connecté */
}

.ta-fiche-public .block-auth .ta-card-title {
  /* Hérité de global.css */
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Icône checkmark avant le titre de connexion */
.ta-fiche-public .block-auth .ta-card-title::before {
  content: '✅';
  font-size: 1em;
  flex: 0 0 auto;
}

/* Message de succès (reset password, etc.) */
.ta-fiche-public .block-auth .ta-success {
  color: #15803d;
  font-weight: 600;
  font-size: 0.88em;
  background: rgba(22,163,74,.08);
  border: 1px solid rgba(22,163,74,.20);
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 8px;
}


/* ===============================================================
   3. ÉTAT NON CONNECTÉ — CTA ACCÈS
=============================================================== */

/* Encart informatif avant le CTA */
.ta-fiche-public .block-auth .b2-content .ta-field-card {
  text-align: center;
  padding: 20px 18px;
}

/* Icône de cadenas au-dessus du texte */
.ta-fiche-public .block-auth .b2-content .ta-field-card::before {
  content: '🔐';
  display: block;
  font-size: 2rem;
  margin-bottom: 10px;
  line-height: 1;
  opacity: .85;
}

.ta-fiche-public .block-auth .b2-content .ta-card-title {
  font-size: 1em;
  font-weight: 900;
  color: var(--ta-ink);
  text-align: center;
}

.ta-fiche-public .block-auth .b2-content .ta-card-subtitle {
  text-align: center;
  font-size: 0.84em;
  line-height: 1.55;
  margin-top: 6px;
}

/* Le bouton .ta-btn--action (orange) hérité de global.css */
/* On lui ajoute une largeur 100% via .ta-preview-action (global-card.css) */
.ta-fiche-public .block-auth .ta-btn--action {
  width: 100%;
  justify-content: center;
}


/* ===============================================================
   4. RESPONSIVE
=============================================================== */

@media (max-width: 393px) {

  .ta-fiche-public .block-auth .b2-content .ta-field-card {
    padding: 16px 14px;
  }

  .ta-fiche-public .block-auth .b2-content .ta-field-card::before {
    font-size: 1.7rem;
  }
}


/* ===============================================================
   FIN — auth-card.css
   TagAnimal — Carnet de santé premium — Mars 2026
=============================================================== */