(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // 1. On récupère tous les flags possibles
    const openTreatment = sessionStorage.getItem("ta_open_health_treatment") === "1";
    const openHistory   = sessionStorage.getItem("ta_open_health_history") === "1";
    const openReminders = sessionStorage.getItem("ta_open_health_reminders") === "1"; // Ajouté

    // Si aucune action n'est demandée, on sort proprement
    if (!openTreatment && !openHistory && !openReminders) return;

    // Nettoyage immédiat pour éviter les boucles au refresh
    sessionStorage.removeItem("ta_open_health_treatment");
    sessionStorage.removeItem("ta_open_health_history");
    sessionStorage.removeItem("ta_open_health_reminders");

    const openBtn = document.querySelector('[data-ta-open="health"]');
    if (!openBtn) return;

    // 2. Ouvrir l'onglet Santé
    openBtn.click();

    // 3. Attendre la fin de l'animation d'ouverture (ScreenRouter)
    setTimeout(function () {
      let targetBlock = null;

      if (openTreatment) targetBlock = document.querySelector(".ta-health-treatments");
      if (openHistory)   targetBlock = document.querySelector(".ta-health-history");
      if (openReminders) targetBlock = document.querySelector('[data-ta-health-block="reminders"]');

      // Scroll sécurisé
      if (targetBlock) {
        targetBlock.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // 4. Gestion du Highlight (surbrillance)
      const highlightId = sessionStorage.getItem("ta_highlight_care_id");
      if (highlightId) {
        sessionStorage.removeItem("ta_highlight_care_id");
        
        // On cherche l'élément (data-care-id ou data-id selon ton template)
        const el = document.querySelector(`[data-care-id="${highlightId}"], [data-id="${highlightId}"]`);
        
        if (el) {
          el.classList.add("ta-highlight");
          setTimeout(() => el.classList.remove("ta-highlight"), 4000);
        }
      }
    }, 700); // Délai légèrement augmenté pour être sûr que le DOM est prêt
  });
})();