/* =======================================================
   TAGANIMAL — FICHE PUBLIQUE (ANIMAL)
   Module Animal — identité & photo

   Rôle :
   - Carte photo de l’animal
   - Identité visuelle
   - Privacy du nom (Owner)
   - Aucune logique Finder / Contact
======================================================= */


/* =======================================================
   1) PRIVACY — NOM DE L’ANIMAL (OWNER)
   Masquage / visibilité du nom public
======================================================= */

.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy{
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

/* Badge d’état (visible / caché) */
.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy__status{
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--ta-r-sm);
  font-size: 0.9em;
  font-weight: 600;
  background: #fff;
  border: 1px solid var(--ta-border);
}

/* Nom visible */
.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy[data-hidden="0"] .ta-animal-privacy__status{
  background: rgba(76,175,80,.10);
  border-color: rgba(76,175,80,.35);
  color: #2e7d32;
}

/* Nom caché */
.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy[data-hidden="1"] .ta-animal-privacy__status{
  background: rgba(214,69,69,.10);
  border-color: rgba(214,69,69,.35);
  color: #8b1e1e;
}

/* Bouton de bascule */
.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy__btn{
  width: 100%;
}

/* Textes conditionnels */
.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy .is-visible,
.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy .is-hidden{
  display: none;
}

.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy[data-hidden="0"] .is-visible{
  display: inline-flex;
}

.ta-fiche-public[data-ta-owner="1"] .ta-animal-privacy[data-hidden="1"] .is-hidden{
  display: inline-flex;
}


/* =======================================================
   2) CARTE PHOTO DE L’ANIMAL
   Bloc premium — identité visuelle
======================================================= */

/* Carte photo */
.ta-fiche-public .block-animal .b2-photo{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #fff6eb;
  border: 1px solid rgba(243,154,54,.25);
}

/* Micro-header (titre + description) */
.ta-fiche-public .block-animal .b2-photo-hd{
  width: 100%;
  text-align: center;
}

/* Titre */
.ta-fiche-public .block-animal .b2-photo-title{
  margin: 0;
  font-size: 0.85em;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--ta-accent);
}

/* Description */
.ta-fiche-public .block-animal .b2-photo-desc{
  margin: 4px 0 0;
  font-size: 0.8em;
  color: var(--ta-muted);
}

/* Image */
.ta-fiche-public .block-animal .b2-img{
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 14px;
  background: #f6f2ee;
  object-fit: contain;
}

/* Zone actions (changer photo, etc.) */
.ta-fiche-public .block-animal .b2-photo-actions{
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Bouton aligné avec le design system */
.ta-fiche-public .block-animal .b2-photo-actions .ta-btn{
  margin: 0;
}

/* Mobile — centrage de la carte */
@media (max-width: 720px){
  .ta-fiche-public .block-animal .b2-photo{
    margin-left: auto;
    margin-right: auto;
  }
}

/* Espacement entre la carte photo et les champs suivants */
.ta-fiche-public .block-animal .b2-content{
  margin-top: var(--ta-gap);
}

@media (max-width: 720px){
  .ta-fiche-public .block-animal .b2-photo-actions{
    flex-direction: column;     /* empile les boutons */
    align-items: stretch;       /* largeur pleine */
    gap: 10px;                  /* espace vertical propre */
  }

  .ta-fiche-public .block-animal .b2-photo-actions .ta-btn{
    width: 100%;                /* boutons pleine largeur */
  }
}
/* =======================================================
   FIN — MODULE ANIMAL
======================================================= */
.ta-fiche-public .block-animal .ta-animal-summary{
  width: 100%;
}
/* =======================================================
   ANIMAL SUMMARY — Amélioration typographique
======================================================= */
/* Quand on édite l’animal, on cache la carte résumé */
.block-animal[data-mode="edit"] [data-ta-animal-summary]{
  display: none !important;
}

/* L’éditeur est plein */
.block-animal[data-mode="edit"] .ta-animal-editor{
  display: block;
}

/* Par défaut */
.block-animal[data-mode="view"] .ta-animal-editor{
  display: none;
}

