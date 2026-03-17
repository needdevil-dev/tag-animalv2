/* ======================================================
   TAGANIMAL — View Switch (Owner)
   Correction hiérarchie visuelle
====================================================== */

.ta-view-switch{
  max-width: var(--ta-maxw);
  margin: 14px auto 22px;
  padding: 0 var(--ta-pad-x);

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  position: relative;
}


/* Boutons */

.ta-view-switch__btn{
  position: relative;
  padding: 10px 18px 12px;

  min-width: 170px;

  border-radius: 18px 18px 14px 14px;

  background:
    url("/wp-content/plugins/tag-animal/assets/img/paper-animal.png") center / 600px repeat,
    linear-gradient(180deg,#fffefb,#f2e6d3);

  border: 1px solid rgba(120,90,50,.25);

  box-shadow:
    0 6px 14px rgba(80,60,30,.22),
    inset 0 1px 0 rgba(255,255,255,.8);

  text-decoration: none;
  text-align: center;
  color: inherit;

  display: grid;
  gap: 4px;

  transition:
    transform .15s ease,
    box-shadow .15s ease,
    filter .15s ease;
}



/* Hover */
.ta-view-switch__btn:hover{
  background: rgba(255,255,255,.65);
}

/* Texte */

.ta-view-switch__label{
  font-size: .95em;
  font-weight: 800;
  color: var(--ta-ink);
}

.ta-view-switch__desc{
  font-size: .75em;
  color: var(--ta-muted);
}


/* Actif = seule vraie “carte” */

.ta-view-switch__btn.is-active{
  background:
    url("/wp-content/plugins/tag-animal/assets/img/paper-animal.png") center / 600px repeat,
    linear-gradient(180deg,#fffdf8,#f7ebd8);

  border-color: rgba(243,154,54,.55);

  box-shadow:
    0 12px 28px rgba(80,60,30,.35),
    inset 0 1px 0 rgba(255,255,255,.9);

  transform: translateY(0) scale(1);
  z-index: 3;
}


.ta-view-switch__label{
  font-size: .9em;
  font-weight: 800;
  letter-spacing: .02em;
  color: var(--ta-ink);
}

.ta-view-switch__desc{
  font-size: .7em;
  color: var(--ta-muted);
}


.ta-view-switch__btn:not(.is-active){
  transform: translateY(8px) scale(.97);
  filter: saturate(.8) brightness(.95);
  box-shadow:
    0 2px 6px rgba(80,60,30,.15);
}

.ta-view-switch__btn:not(.is-active):hover{
  transform: translateY(4px) scale(.99);
  filter: none;
}

