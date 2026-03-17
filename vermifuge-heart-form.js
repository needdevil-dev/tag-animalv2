/* =====================================================
   TAGANIMAL – SCÈNE CARNET
   Ciel + Bannière flottante
===================================================== */


/* =====================================================
   1) Fond global (papier)
===================================================== */

html, body{
  margin: 0 !important;
  padding: 0 !important;
  min-height: 100vh;
}
.ta-app,
.ta-stage{
  position: relative;
  min-height: 100%;
}

#page,
#primary,
#content,
.site,
.site-content,
.site-main{
}


/* ===============================
   BANNIÈRE
================================ */

.ta-scene-banner{
  position: absolute;
  left: 0;
  right: 0;
  top: 1px;            /* ← ajuste ici (ex: 18–40) */
  display: flex;
  justify-content: center;
  z-index: 5;
  pointer-events: none;
}


.ta-scene-banner-inner{
  pointer-events: auto;

  /* Le parchemin doit presque toucher les bords du carnet */
  width: min(100vw, 1100px);

  /* Ratio exact de l'image */
  aspect-ratio: 5 / 1;

  background:
    url("/wp-content/plugins/tag-animal/assets/img/ban2.png")
    center / 100% 100% no-repeat;

  display: grid;
  place-items: center;

  position: relative;
  transform: translateY(0);
}

/* ===============================
   SVG TEXTE COURBÉ
================================ */

.ta-banner-svg{
  width: 100%;
  height: 100%;
}

.ta-banner-text{
  fill: #5b3b17;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 49px;
  font-weight: 900;
  letter-spacing: 0.06em;

  paint-order: stroke;
  stroke: rgba(255,255,255,.7);
  stroke-width: 2px;

  filter: drop-shadow(0 4px 6px rgba(0,0,0,.25));
}

.ta-scene-title{
  position: absolute;
  left: 10%;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);

  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  pointer-events: none;
}


@media (max-width: 520px){

  /* La bannière reste large mais respirable */
  .ta-scene-banner-inner{
    width: calc(110vw - 14px);
    max-width: none;
  }

  /* Le texte est recalibré + tracé plus fin */
  .ta-banner-text{
    font-size: 48px;
    letter-spacing: .04em;
    stroke-width: 1.2px;
    filter: drop-shadow(0 2px 3px rgba(0,0,0,.25));
  }
}

/* =============================
   TOP
============================= */
.ta-bg-top{
  height: 140px; /* ajuste selon ton bg-top.png */
  background:
    url("/wp-content/plugins/tag-animal/assets/img/bg-top.png")
    top center no-repeat;
  background-size: 100% auto;
  flex-shrink: 0;
}

/* =============================
   MIDDLE (répété)
============================= */
.ta-bg-middle{
  flex: 1;
  background:
    url("/wp-content/plugins/tag-animal/assets/img/bg-middle.png")
    center top repeat-y;
  background-size: 100% auto;
}

/* =============================
   BOTTOM
============================= */
.ta-bg-bottom{
  height: 220px; /* ajuste selon bg-bottom.png */
  background:
    url("/wp-content/plugins/tag-animal/assets/img/bg-bottom.png")
    bottom center no-repeat;
  background-size: 100% auto;
  flex-shrink: 0;
}

