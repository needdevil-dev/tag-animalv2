/* =======================================================
   TAGANIMAL — Treatment Card (Carnet Style)
   Portée :
   - Affichage des traitements ACTIFS
   - Style carnet / suivi médical
   - Aucune logique métier
   - Aucune dépendance JS
   Scope strict : .ta-fiche-public
======================================================= */

/* =======================================================
   1) CARTE RACINE — STYLE CARNET
======================================================= */

.ta-fiche-public .ta-treatment-card{
  /* Fond papier clair (effet carnet) */
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.92),
      rgba(255,255,255,.85)
    ),
    var(--ta-surface);

  /* Cadre discret */
  border: 1px solid var(--ta-border);
  border-radius: 14px;

  /* Respiration interne */
  padding: 14px 16px;

  /* Légère profondeur (papier posé) */
  box-shadow:
    0 1px 2px rgba(0,0,0,.06),
    inset 0 1px 0 rgba(255,255,255,.6);
}


/* =======================================================
   2) HEADER — TITRE + STATUT
======================================================= */

.ta-fiche-public .ta-treatment-header{
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;

  margin-bottom: 6px;
}

/* Groupe icône + titre */

.ta-fiche-public .ta-treatment-heading{
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Icône traitement (actif uniquement) */

.ta-fiche-public .ta-treatment-icon{
  font-size: 1.1em;
  line-height: 1;
  opacity: .9;
}

/* Nom du traitement */

.ta-fiche-public .ta-treatment-title{
  font-size: 1.05em;
  font-weight: 600;
  color: var(--ta-ink);
}

/* =======================================================
   3) STAT CLÉ — JOURS RESTANTS
======================================================= */

.ta-fiche-public .ta-treatment-days{
  font-size: .85em;
  font-weight: 500;
  color: var(--ta-accent);

  /* Évite le retour à la ligne */
  white-space: nowrap;
}


/* =======================================================
   4) DATES — INFORMATION SECONDAIRE
======================================================= */

.ta-fiche-public .ta-treatment-dates{
  font-size: .82em;
  color: var(--ta-muted);

  margin-bottom: 10px;
}


/* =======================================================
   5) PROGRESSION — ZONE DE SUIVI
======================================================= */

.ta-fiche-public .ta-treatment-progress{
  /* Séparation visuelle façon carnet */
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0,0,0,.08);

  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Barre de progression (conteneur) */

.ta-fiche-public .ta-progress-bar{
  position: relative;
  width: 100%;
  height: 10px;

  background: rgba(0,0,0,.08);
  border-radius: 999px;
  overflow: hidden;

  box-shadow:
    inset 0 1px 2px rgba(0,0,0,.15);
}

/* Barre remplie */

.ta-fiche-public .ta-progress-bar span{
  display: block;
  height: 100%;
  width: 0%;

  /* Couleur chaude = traitement en cours */
  background: linear-gradient(90deg,#f7a94b,#f39a36);

  border-radius: inherit;
  transition: width .4s ease;
}

/* Texte de progression */

.ta-fiche-public .ta-treatment-progress small{
  font-size: .8em;
  color: var(--ta-muted);
}
