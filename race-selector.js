/* =========================================================
   TAGANIMAL — AUTH BLOCK (standard ta-block)
   Cible le HTML actuel : .block-auth .ta-auth-card .ta-auth-form
========================================================= */


/* Titres internes déjà gérés par .ta-card-title/.ta-card-subtitle
   => on ajoute juste un peu de rythme */
.ta-fiche-public .block-auth .ta-card-title{
  margin: 0 0 6px;
}

.ta-fiche-public .block-auth .ta-card-subtitle{
  margin: 0 0 14px;
}

/* Bouton d’intention “Accéder à ma fiche” */
.ta-fiche-public .block-auth [data-auth-action="edit"]{
  width: 100%;
  justify-content: center;
  margin: 8px 0 14px;
}

/* Formulaires */
.ta-fiche-public .block-auth .ta-auth-form{
  margin-top: 10px;
}

/* Masquage piloté par JS */
.ta-fiche-public .block-auth .ta-is-hidden{
  display: none !important;
}

/* Champs (inputs dans la field-card interne) */
.ta-fiche-public .block-auth .ta-auth-form .ta-field-card{
  padding: 14px;
  border-radius: 16px;
}

.ta-fiche-public .block-auth .ta-auth-form input[type="email"],
.ta-fiche-public .block-auth .ta-auth-form input[type="password"]{
  width: 100%;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.14);
  font-size: 15px;
  background: #fff;
  transition: border-color .15s ease, box-shadow .15s ease;
  margin: 6px 0 12px;
}

.ta-fiche-public .block-auth .ta-auth-form input:focus{
  outline: none;
  border-color: var(--ta-accent, #ff8a00);
  box-shadow: 0 0 0 3px rgba(255,138,0,.14);
}

/* Actions (boutons) */
.ta-fiche-public .block-auth .ta-form-actions{
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.ta-fiche-public .block-auth .ta-form-actions .ta-btn{
  width: 100%;
  justify-content: center;
}

/* Messages */
.ta-fiche-public .block-auth .ta-error{
  color: #b91c1c;
}

.ta-fiche-public .block-auth .ta-success{
  color: #15803d;
}

/* Responsive léger */
@media (min-width: 520px){
  .ta-fiche-public .block-auth .ta-auth-card{
    padding: 18px;
  }
}
