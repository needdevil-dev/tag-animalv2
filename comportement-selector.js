/* =========================================================
   TAGANIMAL — CONTACTS PUBLIC SCREEN
   =========================================================
   Rôle :
   - Styles complets de l'écran public finder
   - Section hero  : accueil émotionnel (photo, titre, message)
   - Section contacts : cartes propriétaire + secondaire
   - Comportement public : badge visuel + liste comportements

   Scope STRICT :
   - .ta-fiche-public .block-hero
   - .block-behavior-hero .ta-hero-health
   - .ta-fiche-public .block-contacts

   Dépendance :
   - taganimal-fiche-public (variables CSS, reset, layout)

   Remplace :
   - hero.css
   - behavior-hero.css
========================================================= */


/* =========================================================
   ██████  HERO — SECTION ACCUEIL FINDER
========================================================= */


/* ---------------------------------------------------------
   1.1) CONTENEUR HERO
--------------------------------------------------------- */

.ta-fiche-public .block-hero {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;

    padding: 18px 16px;

    background: var(--ta-surface);
    border: 1px solid var(--ta-border);
    border-radius: var(--ta-r-lg);

    box-shadow: 0 8px 22px rgba(0, 0, 0, .05);
}


/* ---------------------------------------------------------
   1.2) TITRE PRINCIPAL H1
--------------------------------------------------------- */

.ta-fiche-public .block-hero .b1-title {
    margin: 6px 0 10px;
    padding: 10px 12px;

    text-align: center;
    line-height: 1.25;

    font-size: 1.6em;
    font-weight: 900;
    letter-spacing: -0.02em;

    color: var(--ta-ink);

    background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.65),
        rgba(255, 255, 255, 0.35)
    );

    border-radius: 14px;
    box-shadow: 0 6px 14px rgba(120, 80, 40, .18);
}

.ta-fiche-public .block-hero .b1-title span {
    color: var(--ta-accent);
}


/* ---------------------------------------------------------
   1.3) PHOTO ANIMAL
--------------------------------------------------------- */

.ta-fiche-public .block-hero .b1-photo {
    display: flex;
    justify-content: center;
    align-items: center;

    margin: 2px 0 4px;
}

.ta-fiche-public .block-hero .b1-img {
    display: block;
    width: min(220px, 100%);
    max-width: 100%;

    border-radius: 20px;
    opacity: 0.92;

    box-shadow: 0 10px 26px rgba(40, 30, 20, .22);

    filter:
        saturate(0.95)
        contrast(0.95)
        brightness(1.02);

    /* Fondu naturel dans la page */
    mask-image: radial-gradient(
        ellipse at center,
        rgba(0, 0, 0, 1)   60%,
        rgba(0, 0, 0, .85) 72%,
        rgba(0, 0, 0, .4)  88%,
        rgba(0, 0, 0, 0)   100%
    );
}


/* ---------------------------------------------------------
   1.4) MESSAGE FINDER
--------------------------------------------------------- */

.ta-fiche-public .block-hero .b1-lead {
    margin: 12px 0 18px;
    padding: 0 10px;

    text-align: center;
    line-height: 1.55;

    font-size: 1.05em;
    font-weight: 500;

    color: var(--ta-muted);
}

.ta-fiche-public .block-hero .b1-lead::before {
    content: "—";
    display: block;
    margin-bottom: 6px;
    color: var(--ta-border);
}


/* =========================================================
   ██████  BEHAVIOR — RÉSUMÉ COMPORTEMENT FINDER
========================================================= */


/* ---------------------------------------------------------
   2.1) DESKTOP LAYOUT
--------------------------------------------------------- */

@media (min-width: 860px) {
    .block-behavior-hero .ta-hero-health {
        grid-template-columns: 150px 1fr;
        align-items: flex-start;
        padding: 22px;
        gap: 22px;
    }
}


/* ---------------------------------------------------------
   2.2) SIGNAL — CONTENEUR BADGE
--------------------------------------------------------- */

.block-behavior-hero .ta-hero-health__signal {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}


/* ---------------------------------------------------------
   2.3) CERCLE — BADGE VISUEL
--------------------------------------------------------- */

.block-behavior-hero .ta-hero-health__circle {
    position: relative;

    width: 150px;
    height: 150px;
    border-radius: 999px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;

    color: #2a1f14;
    text-shadow: 0 1px 0 rgba(255, 255, 255, .9);

    will-change: transform;
}

/* Texte interne — label */
.block-behavior-hero .ta-hero-health__circle-label {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.02em;
    line-height: 1.05;
    margin: 0;
}

/* Texte interne — sous-label */
.block-behavior-hero .ta-hero-health__circle-sub {
    margin-top: 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    opacity: .85;
}


/* ---------------------------------------------------------
   2.4) IMAGES PAR STATUT (ok / watch / alert)
--------------------------------------------------------- */

.block-behavior-hero
.ta-hero-health[data-status="ok"]
.ta-hero-health__circle {
    background-image: url("/wp-content/plugins/tag-animal/assets/img/behavior/behavior-circle-ok.png");
}

.block-behavior-hero
.ta-hero-health[data-status="watch"]
.ta-hero-health__circle {
    background-image: url("/wp-content/plugins/tag-animal/assets/img/behavior/behavior-circle-watch.png");
}

.block-behavior-hero
.ta-hero-health[data-status="alert"]
.ta-hero-health__circle {
    background-image: url("/wp-content/plugins/tag-animal/assets/img/behavior/behavior-circle-alert.png");
}


/* ---------------------------------------------------------
   2.5) CONTENU TEXTE
--------------------------------------------------------- */

.block-behavior-hero .ta-hero-health__content {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.block-behavior-hero .ta-hero-health__title {
    font-size: 17px;
    font-weight: 600;
    line-height: 1.6;
    color: #2b2b2b;
    letter-spacing: -0.01em;
    margin: 2px 0 4px 0;
}

/* Message propriétaire */
.block-behavior-hero .ta-hero-health__why {
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(0, 0, 0, .04);
    font-size: 13px;
    line-height: 1.45;
    color: var(--ink-muted);
}

/* Kicker */
.block-behavior-hero .ta-hero-health__kicker {
    margin-bottom: 10px;
    margin-top: 4px;
    text-align: center;
}

.block-behavior-hero .ta-hero-health__block {
    padding: 10px 0;
}


/* ---------------------------------------------------------
   2.6) LISTE COMPORTEMENTS CLÉS
--------------------------------------------------------- */

.block-behavior-hero .ta-hero-health__list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.block-behavior-hero .ta-hero-health__item {
    width: 100%;
    max-width: 320px;
    padding: 12px 16px;
    border-radius: 14px;
    text-align: center;
}

/* Niveaux — couleurs sémantiques */
.block-behavior-hero .ta-hero-health__item[data-level="positif"] {
    background: rgba(31, 138, 91, .12);
    border-left: 3px solid #1f8a5b;
}

.block-behavior-hero .ta-hero-health__item[data-level="attention"] {
    background: rgba(201, 119, 0, .12);
    border-left: 3px solid #c97700;
}

.block-behavior-hero .ta-hero-health__item[data-level="vigilance"] {
    background: rgba(179, 38, 30, .12);
    border-left: 3px solid #b3261e;
}


/* ---------------------------------------------------------
   2.7) Desktop — alignement signal
--------------------------------------------------------- */

@media (min-width: 860px) {
    .block-behavior-hero .ta-hero-health__signal {
        justify-content: center;
    }

    .block-behavior-hero .ta-hero-health__circle {
        margin-left: auto;
        margin-right: auto;
    }
}


/* ---------------------------------------------------------
   2.8) Accessibilité — reset listes
--------------------------------------------------------- */

.block-behavior-hero ul,
.block-behavior-hero li {
    list-style: none !important;
    list-style-type: none !important;
    padding-left: 0 !important;
    margin-left: 0 !important;
}