/* =========================================================
 * TAGANIMAL — race-selector.js
 * ---------------------------------------------------------
 * Rôle :
 * - Gérer la mise à jour de la liste des races
 * - Réagir uniquement dans le formulaire animal
 * - Recharger les options quand le type change
 *
 * Contrat :
 * - Ne s'initialise QUE si un [data-ta-animal-form] existe
 * - Utilise la localisation globale window.TA_BREEDS
 * - Conserve la valeur actuelle si elle existe encore
 * - Réinitialise la race si le type change vers une liste
 *   où la race courante n'existe plus
 *
 * Debug :
 * - Log de démarrage
 * - Logs de skip / erreurs de contexte
 * ========================================================= */
(function (window, document) {
  'use strict';

  var LOG_PREFIX = '[TA RaceSelector]';

  var SELECTORS = {
    form: '[data-ta-animal-form]',
    type: '[data-ta-pet-type]',
    breed: '[data-ta-breed-select]'
  };

  function log() {
    console.info.apply(console, [LOG_PREFIX].concat([].slice.call(arguments)));
  }

  function warn() {
    console.warn.apply(console, [LOG_PREFIX].concat([].slice.call(arguments)));
  }

  function getBreedsRegistry() {
    if (typeof window.TA_BREEDS === 'undefined' || !window.TA_BREEDS) {
      warn('TA_BREEDS introuvable. Vérifie wp_localize_script sur le bon handle.');
      return null;
    }
    return window.TA_BREEDS;
  }

  function normalizeEntry(entry) {
    if (typeof entry === 'string') {
      return {
        value: entry,
        label: entry
      };
    }

    if (entry && typeof entry === 'object') {
      return {
        value: entry.value || entry.label || '',
        label: entry.label || entry.value || ''
      };
    }

    return {
      value: '',
      label: ''
    };
  }

  function getPlaceholderLabel(select) {
    var firstOption = select.querySelector('option[value=""]');
    if (firstOption) {
      return firstOption.textContent || '— Sélectionner —';
    }
    return '— Sélectionner —';
  }

  function buildEntries(type, registry) {
    var raw = registry[type] || [];
    return raw
      .map(normalizeEntry)
      .filter(function (item) {
        return item.value !== '' || item.label !== '';
      });
  }

  function rebuildBreedOptions(form, resetOnMissing) {
    var registry = getBreedsRegistry();
    if (!registry) {
      return;
    }

    var typeSelect = form.querySelector(SELECTORS.type);
    var breedSelect = form.querySelector(SELECTORS.breed);

    if (!typeSelect || !breedSelect) {
      warn('Type ou select race introuvable dans le formulaire animal.');
      return;
    }

    var selectedType = typeSelect.value || '';
    var entries = buildEntries(selectedType, registry);

    var currentValue = breedSelect.value || '';
    var currentOption = breedSelect.querySelector('option[value="' + CSS.escape(currentValue) + '"]');
    var currentLabel = currentOption ? currentOption.textContent : currentValue;

    var placeholderLabel = getPlaceholderLabel(breedSelect);

    var hasMatch = entries.some(function (entry) {
      return entry.value === currentValue || entry.label === currentValue;
    });

    if (resetOnMissing && currentValue && !hasMatch) {
      currentValue = '';
      currentLabel = '';
    }

    breedSelect.innerHTML = '';

    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = placeholderLabel;
    breedSelect.appendChild(placeholder);

    if (currentValue && !hasMatch) {
      var customOption = document.createElement('option');
      customOption.value = currentValue;
      customOption.textContent = currentLabel || currentValue;
      customOption.selected = true;
      breedSelect.appendChild(customOption);
    }

    entries.forEach(function (entry) {
      var option = document.createElement('option');
      option.value = entry.value || entry.label;
      option.textContent = entry.label || entry.value;

      if (currentValue && (entry.value === currentValue || entry.label === currentValue)) {
        option.selected = true;
      }

      breedSelect.appendChild(option);
    });

    log('liste races reconstruite', {
      type: selectedType,
      total: entries.length,
      currentValue: currentValue || ''
    });
  }

  function bindAnimalForm(form, index) {
    if (!form || form.dataset.taRaceSelectorReady === '1') {
      return;
    }

    var typeSelect = form.querySelector(SELECTORS.type);
    var breedSelect = form.querySelector(SELECTORS.breed);

    if (!typeSelect || !breedSelect) {
      log('formulaire ignoré : champs race/type absents');
      return;
    }

    form.dataset.taRaceSelectorReady = '1';

    log('initialisation formulaire animal #' + (index + 1));

    typeSelect.addEventListener('change', function () {
      log('changement type détecté ->', typeSelect.value);
      rebuildBreedOptions(form, true);
    });

    rebuildBreedOptions(form, false);
  }

  function boot() {
    log('démarrage');

    var registry = getBreedsRegistry();
    if (!registry) {
      return;
    }

    var forms = document.querySelectorAll(SELECTORS.form);

    if (!forms.length) {
      log('aucun formulaire animal détecté, arrêt');
      return;
    }

    forms.forEach(bindAnimalForm);

    log('initialisation terminée, formulaires trouvés : ' + forms.length);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window, document);