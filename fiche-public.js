/* =======================================================
   TAGANIMAL — PRO SCREEN (Mon Équipe)
   Fichier : pro-screen.css

   RÔLE : shell macro du bloc Mon Équipe
   ─ cadre du bloc .block-pros (position, overflow)
   ─ variables d'animation du module
   ─ palette couleur par type de professionnel
   ─ header / body du bloc avec décorateur

   NE CONTIENT PAS :
   ─ wizard / étapes / formulaire d'ajout → pro-form.css
   ─ cartes individuelles .ta-pros-item   → pro-card-views-card.css
   ─ groupes / liste / contacts / badges  → pro-card-views-card.css
   ─ boutons / champs / inputs / labels   → pro-form.css

   CHARGEMENT :
   ─ Chargé EN PREMIER dans la chaîne du module Pro.
   ─ Ses variables --pros-* sont consommées par
     pro-card-views-card.css (avec fallbacks autonomes).
======================================================= */


/* -------------------------------------------------------
   1. VARIABLES MODULE
   Animation + palette couleur par type de professionnel.
   Disponibles dans toute la sous-arbre .block-pros.
   ------------------------------------------------------- */

.block-pros {
  --pros-ease:               cubic-bezier(.22, .68, 0, 1.2);
  --pros-ease-s:             cubic-bezier(.40,  0,  .2, 1);

  --pros-veterinaire:        #0d9488;
  --pros-toiletteur:         #7c3aed;
  --pros-educateur:          #2563eb;
  --pros-comportementaliste: #4f46e5;
  --pros-pension:            #d97706;
  --pros-urgences:           #dc2626;
  --pros-pharmacie:          #16a34a;
  --pros-autre:              #64748b;
}


/* -------------------------------------------------------
   2. CADRE BLOC
   ------------------------------------------------------- */

.block-pros {
  position: relative;
  overflow: hidden;
}


/* -------------------------------------------------------
   3. HEADER BLOC
   ------------------------------------------------------- */

.block-pros .ta-block-hd {
  text-align: center;
  padding-bottom: 4px;
}


/* -------------------------------------------------------
   4. BODY BLOC + DÉCORATEUR
   Position relative requise pour le ::before absolu.
   ------------------------------------------------------- */

.block-pros .ta-block-bd {
  position: relative;
}

/* Trait dégradé en tête de la zone de contenu */
.block-pros .ta-block-bd::before {
  content: '';
  position: absolute;
  top:  0;
  left: 50%;
  transform: translateX(-50%);
  width:  56px;
  height:  3px;
  background: linear-gradient(
    90deg,
    var(--ta-pro-accent, #c87410),
    #f9c06d
  );
  border-radius: 2px;
  opacity: .45;
  pointer-events: none;
  z-index: 1;
}