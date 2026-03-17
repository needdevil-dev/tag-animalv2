/* =======================================================
   2.2) BLOC CONTACTS
======================================================= */

.ta-fiche-public .block-contact .bc-cards{
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 780px){
  .ta-fiche-public .block-contact .bc-cards{
    grid-template-columns: 1fr 1fr;
  }
}

.ta-fiche-public .block-contact .bc-card{
  padding: 16px;
  border-radius: var(--ta-r-lg);
  background: radial-gradient(120% 80% at top left, #fff 0%, #fffaf3 70%);
  border: 1px solid var(--ta-border);
  box-shadow: 0 6px 16px rgba(32,22,10,.06);
}

.ta-fiche-public .bc-card{
  position: relative;
}


/* =====================================================
   CONTACT CONSENT – TagAnimal Premium
===================================================== */

.ta-contact-consent-card{
  text-align: center;
}

/* Grille */
.ta-contact-buttons{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 16px;
}

/* Bouton */
.ta-contact-btn{
  all: unset;
  cursor: pointer;

  width: 100%;
  min-height: 92px;
  border-radius: 18px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  font-weight: 700;
  font-size: 14px;
  text-align: center;

  background: #ffffff;
  border: 2px solid var(--ta-border);
  box-shadow: var(--ta-shadow-sm);

  position: relative; /* 🔧 AJOUTÉ : Nécessaire pour le checkmark */

  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
}

/* Hover */
.ta-contact-btn:hover{
  transform: translateY(-2px);
  box-shadow: var(--ta-shadow-md);
}

/* Icône */
.ta-contact-btn-icon{
  font-size: 26px;
  line-height: 1;
  transition: transform .18s ease, opacity .18s ease;
}

/* Label */
.ta-contact-btn-label{
  font-weight: 800;
  font-size: 0.9em;
  color: var(--ta-ink);
}

/* ===============================
   OFF (désactivé)
================================ */

.ta-contact-btn[aria-pressed="false"]{
  background:
    linear-gradient(180deg,#ffffff,#fff6f6);
  border-color: #f2caca;
  color: #a13b3b;
}

.ta-contact-btn[aria-pressed="false"] .ta-contact-btn-icon{
  opacity: .5;
}

/* ===============================
   ON (activé)
================================ */

.ta-contact-btn[aria-pressed="true"],
.ta-contact-btn.is-active { /* 🔧 AJOUTÉ : Support de la classe .is-active */
  background:
    linear-gradient(180deg,#fff9f1,#ffedd5);
  border-color: var(--ta-accent);
  color: var(--ta-accent);
  box-shadow: 0 10px 22px rgba(243,154,54,.25);
}

.ta-contact-btn[aria-pressed="true"] .ta-contact-btn-icon,
.ta-contact-btn.is-active .ta-contact-btn-icon { /* 🔧 AJOUTÉ */
  transform: scale(1.15);
  opacity: 1; /* 🔧 AJOUTÉ : Force l'opacité à 1 */
}

/* ===============================
   🔧 NOUVEAUX ÉTATS (pour JavaScript)
================================ */

/* État de chargement (pendant la sauvegarde AJAX) */
.ta-contact-consent-card.is-saving .ta-contact-btn {
  opacity: 0.6;
  pointer-events: none;
  cursor: wait;
}

/* Désactivé (pendant le chargement) */
.ta-contact-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Checkmark (indicateur visuel de sélection) */
.ta-contact-btn.is-active::after,
.ta-contact-btn[aria-pressed="true"]::after {
  content: "✓";
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: var(--ta-accent, #F39A36);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(243, 154, 54, 0.4);
  animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ===============================
   🔧 MESSAGES DE FEEDBACK
================================ */

.ta-animal-message {
  display: none;
  padding: 10px 16px;
  margin-top: 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  animation: fadeInMessage 0.3s ease;
}

@keyframes fadeInMessage {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ta-animal-message.is-success {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  color: #2E7D32;
  border: 2px solid #4CAF50;
}

.ta-animal-message.is-error {
  background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
  color: #C62828;
  border: 2px solid #F44336;
}

/* ===============================
   Mobile
================================ */

@media (max-width: 600px){
  .ta-contact-buttons{
    grid-template-columns: 1fr;
  }
}
