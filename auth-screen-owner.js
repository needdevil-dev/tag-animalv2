


/**
 * TagAnimal – activation.js (robuste)
 * - PRG serveur, pas de stockage.
 * - SPA light si 2 panneaux.
 * - Contact de secours : bloc éditable garanti (anti "disabled"/clic fantôme + anti-uncheck).
 * - Switch Privé/Public : TEXTE DANS LA BULLE via CSS (pas de badge JS).
 * - Récompense : montre/masque le montant.
 * - Photo : nom + aperçu.
 */
(() => {
  'use strict';


  const SEL = {
    form:      '#activation-form, form',
    step1:     '.step-panel-1',
    step2:     '.step-panel-2',
    to2:       '#to-step-2',
    back1:     '#back-to-1',
    final:     '#final-submit',
    mode:      '#ta_mode',

    // Contact de secours
    addCo:     '#ta_has_emergency',
    coBlk:     '#co-owner-block',
    reqStep1:  'input[required], select[required], textarea[required]',

    // Photo
    petPhoto:    '#ta_pet_photo',
    petPhotoOut: '#ta_pet_photo_name',
  };

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const STATE = { p1: null, p2: null, goStep: null };
  const SCREEN = { step: null, screens: [], setActive: null };
  const ROOT_V3 = document.querySelector('[data-ta-onboarding="v3"]');
  const IS_V3 = !!ROOT_V3;

  /* ========= Scroll helpers ========= */
  function getScrollContainer(el) {
    let node = el?.parentElement;
    while (node && node !== document.body) {
      const oy = getComputedStyle(node).overflowY;
      if (oy === 'auto' || oy === 'scroll') return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }
  
  function scrollToField(el) {
    if (!el) return;
    openStepFor(el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const scroller = getScrollContainer(el);
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.pageYOffset - 110;
          if (scroller === document.scrollingElement) window.scrollTo({ top, behavior: 'smooth' });
          else scroller.scrollTo({ top, behavior: 'smooth' });
        }
        setTimeout(() => {
          try { el.focus({ preventScroll: true }); } catch(e){ try{ el.focus(); }catch(_e){} }
          el.classList && el.classList.add('ta-missing');
          setTimeout(() => el.classList && el.classList.remove('ta-missing'), 900);
          el.reportValidity && el.reportValidity();
        }, 220);
      });
    });
  }
  
 function openStepFor(el){
    if (!el) return;
    if (STATE.p1 && STATE.p1.contains(el)) { STATE.goStep && STATE.goStep(1); }
    else if (STATE.p2 && STATE.p2.contains(el)) { STATE.goStep && STATE.goStep(2); }
  }

  /* ========= Écrans mobiles (9 panneaux) ========= */
  function initScreenWizard() {
    const form = document.querySelector('form[data-ta-step]');
    const step = form ? parseInt(form.dataset.taStep || '0', 10) : 0;
    const stepScreens = $(`[data-ta-screen][data-ta-step="${step}"]`) ? $$(`[data-ta-screen][data-ta-step="${step}"]`) : [];
    if (!step || stepScreens.length === 0) return;

    const screenOrder = stepScreens
      .map((screen) => ({ screen, id: parseInt(screen.dataset.taScreen || '0', 10) }))
      .filter((item) => Number.isFinite(item.id))
      .sort((a, b) => a.id - b.id);

    const setActive = (id) => {
      screenOrder.forEach(({ screen, id: screenId }) => {
        const isActive = screenId === id;
        screen.classList.toggle('is-active', isActive);
        screen.hidden = !isActive;
      });
    };

    const findScreenForField = (field) => {
      const screen = field?.closest('[data-ta-screen]');
      if (!screen) return null;
      const id = parseInt(screen.dataset.taScreen || '0', 10);
      return Number.isFinite(id) ? id : null;
    };

    const isFieldVisible = (field) => {
      if (!field) return false;
      if (field.disabled) return false;
      if (field.closest('[hidden]')) return false;
      if (field.offsetParent === null) return false;
      return true;
    };

    const getVisibleInvalidField = (screen) => {
      if (!screen) return null;
      const fields = $$('input, select, textarea', screen).filter(isFieldVisible);
      return fields.find((field) => !field.checkValidity());
    };

    const goToScreen = (nextId) => {
      setActive(nextId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getCurrentId = () => {
      const active = screenOrder.find(({ screen }) => screen.classList.contains('is-active'));
      return active ? active.id : screenOrder[0].id;
    };

    const getFinalId = () => screenOrder[screenOrder.length - 1].id;

    SCREEN.step = step;
    SCREEN.screens = screenOrder;
    SCREEN.setActive = setActive;

    const hasErrorParam = new URLSearchParams(window.location.search).has('ta_err');
    const firstContentId = (screenOrder.find((item) => item.id !== 0) || screenOrder[0]).id;
    if (step === 1 && screenOrder.some((item) => item.id === 0) && !hasErrorParam && !document.querySelector('.ta-errors')) {
      setActive(0);
    } else {
      setActive(firstContentId);
    }

    document.addEventListener('click', (event) => {
      const nextBtn = event.target.closest('[data-ta-next]');
      const prevBtn = event.target.closest('[data-ta-prev]');
      if (!nextBtn && !prevBtn) return;
      const currentId = getCurrentId();
      const currentIndex = screenOrder.findIndex((item) => item.id === currentId);
      if (currentIndex < 0) return;

      if (nextBtn) {
        const currentScreen = screenOrder[currentIndex].screen;
        const invalid = getVisibleInvalidField(currentScreen);
        if (invalid) {
          event.preventDefault();
          scrollToField(invalid);
          return;
        }
        const nextItem = screenOrder[currentIndex + 1];
        if (nextItem) {
          event.preventDefault();
          goToScreen(nextItem.id);
        }
      }

      if (prevBtn) {
        const prevItem = screenOrder[currentIndex - 1];
        if (prevItem) {
          event.preventDefault();
          goToScreen(prevItem.id);
        }
      }
    });

    if (form) {
      const showAllScreens = () => {
        screenOrder.forEach(({ screen }) => {
          screen.hidden = false;
        });
      };

      form.addEventListener('invalid', (event) => {
        const screenId = findScreenForField(event.target);
        if (screenId !== null) {
          setActive(screenId);
        }
      }, true);

      form.addEventListener('submit', (event) => {
        const currentId = getCurrentId();
        const finalId = getFinalId();
        if (currentId !== finalId) {
          event.preventDefault();
          goToScreen(finalId);
          return;
        }

        form.classList.add('ta-show-required');
        showAllScreens();
        if (!form.checkValidity()) {
          event.preventDefault();
          form.classList.remove('ta-show-required');
          const allFields = $$('input, select, textarea', form);
          const firstInvalid = allFields.find((field) => !field.checkValidity());
          if (firstInvalid) {
            const screenId = findScreenForField(firstInvalid);
            if (screenId !== null) setActive(screenId);
            scrollToField(firstInvalid);
          }
        }
      });
    }
  }


  /* ========= Contact de secours ========= */
  function ensureEditable(block){
    if (!block) return;
    block.removeAttribute('inert');
    block.style.pointerEvents = 'auto';
    block.querySelectorAll('input,select,textarea,button').forEach(el => {
      if (el.disabled) el.disabled = false;
      if (el.readOnly) el.readOnly = false;
      if (el.getAttribute('aria-disabled') === 'true') el.setAttribute('aria-disabled','false');
      if (el.tabIndex === -1) el.tabIndex = 0;
      el.style.pointerEvents = 'auto';
    });
  }

  function initCoOwnerToggle() {
    const cb    = $(SEL.addCo) || document.getElementById('ta_has_emergency');
    const block = $(SEL.coBlk) || document.getElementById('co-owner-block');
    if (!cb || !block) return;
    const inputs = $$('input, select, textarea', block);

    const show = () => {
      block.hidden = false;
      block.style.maxHeight = block.scrollHeight + 'px';
      block.style.opacity   = '1';
      cb.setAttribute('aria-expanded','true');
      block.setAttribute('aria-hidden','false');
      inputs.forEach(el => el.disabled = false);
    };
    
    const hide = () => {
      block.hidden = true;
      block.style.maxHeight = '0px';
      block.style.opacity   = '0';
      cb.setAttribute('aria-expanded','false');
      block.setAttribute('aria-hidden','true');
      inputs.forEach(el => el.disabled = true);
    };
    
    const sync = () => (cb.checked ? show() : hide());

    // Focus + scroll doux quand on ouvre
    const focusFirst = () => {
      const first = block.querySelector('input[type="text"], input[type="tel"], textarea, select');
      if (!first) return;
      try { first.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(e) {}
      setTimeout(() => { try { first.focus({ preventScroll:true }); } catch(e){} }, 200);
    };

    const label = document.querySelector('label[for="ta_has_emergency"]');
    if (label) {
      label.addEventListener('click', () => {
        setTimeout(() => { if (cb.checked) focusFirst(); }, 0);
      }, { passive:true });
    }

    cb.addEventListener('change', () => {
      sync();
      if (cb.checked) focusFirst();
    });

    // Si on interagit DANS le bloc alors qu'il est fermé → on ouvre
    block.addEventListener('focusin', () => { if (!cb.checked) { cb.checked = true; sync(); } });
    block.addEventListener('click',    () => { if (!cb.checked) { cb.checked = true; sync(); } });

    sync();
  }

  /* ========= SPA light ========= */
  function enableClientNavIfBothPanels() {
    const p1 = $(SEL.step1);
    const p2 = $(SEL.step2);
    if (!p1 || !p2) return;

    STATE.p1 = p1; STATE.p2 = p2;

    const go = (n) => {
      p1.classList.toggle('active', n === 1);
      p2.classList.toggle('active', n === 2);
      const s1 = document.querySelector('.ta-steps .step-1, .steps .step-1');
      const s2 = document.querySelector('.ta-steps .step-2, .steps .step-2');
      if (s1) { s1.classList.toggle('is-active', n === 1); s1.setAttribute('aria-current', n === 1 ? 'step' : 'false'); }
      if (s2) { s2.classList.toggle('is-active', n === 2); s2.setAttribute('aria-current', n === 2 ? 'step' : 'false'); }
    };
    STATE.goStep = go;

    $(SEL.to2)?.addEventListener('click', (e) => {
      const firstInvalid = $$(SEL.reqStep1, p1).find(el => !el.checkValidity());
      if (firstInvalid) {
        e.preventDefault();
        scrollToField(firstInvalid);
        return;
      }
      e.preventDefault();
      go(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $(SEL.back1)?.addEventListener('click', (e) => {
      e.preventDefault();
      go(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    if (p2.classList.contains('active')) go(2); else go(1);
  }

  /* ========= Bouton final ========= */
  function initFinalButton() {
    const finalBtn = $(SEL.final);
    const mode     = $(SEL.mode);
    finalBtn?.addEventListener('click', () => { if (mode) mode.value = 'final'; }, { passive: true });
  }

  /* ========= Password UI ========= */
  function initPasswordIndicators() {
    const pwd     = document.getElementById('ta_password');
    const confirm = document.getElementById('ta_password_confirm');
    const bar     = document.querySelector('.ta-password-strength');
    const span    = bar ? bar.querySelector('span') : null;
    const match   = document.querySelector('.ta-password-match');
    if (!pwd || !confirm || !bar || !span || !match) return;

    const strength = (v) => {
      if (!v) { bar.className = 'ta-password-strength'; span.style.width = '0%'; return; }
      let score = 0;
      if (v.length >= 6) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      if (score <= 1) { bar.className = 'ta-password-strength weak';   span.style.width = '33%'; }
      else if (score === 2){ bar.className = 'ta-password-strength medium'; span.style.width = '66%'; }
      else { bar.className = 'ta-password-strength strong'; span.style.width = '100%'; }
    };

    const checkMatch = () => {
      if (!pwd.value && !confirm.value) { match.textContent=''; match.className='ta-password-match'; return; }
      if (pwd.value === confirm.value) { 
        match.textContent = '✔︎ ' + (window.ta_i18n?.pwd_match_ok || 'Les mots de passe correspondent'); 
        match.className='ta-password-match ok'; 
      } else { 
        match.textContent = '✘ ' + (window.ta_i18n?.pwd_match_fail || 'Les mots de passe ne correspondent pas'); 
        match.className='ta-password-match fail'; 
      }
    };

    pwd.addEventListener('input', () => { strength(pwd.value); checkMatch(); });
    confirm.addEventListener('input', checkMatch);
    strength(pwd.value);
    checkMatch();
  }

  /* ========= Contact modes : min 1 ========= */
  function initContactPrefsMin() {
    const fs  = document.getElementById('ta_contact_modes') 
             || document.querySelector('[data-role="contact-modes"]');
    const errs = document.querySelectorAll('#ta_contact_error');
    const err  = errs.length ? errs[errs.length - 1] : null;
    if (!fs) return;

    const min = parseInt(fs.dataset.min || '1', 10);
    const boxes = fs.querySelectorAll('input[type="checkbox"]');
    const proxy = boxes[0];

    const update = () => {
      const count = fs.querySelectorAll('input[type="checkbox"]:checked').length;
      const show  = count < min;
      fs.classList.toggle('is-error', show);
      fs.setAttribute('aria-invalid', show ? 'true' : 'false');
      if (err) err.classList.toggle('ta-hide', !show);
      if (proxy) proxy.setCustomValidity(show ? (window.ta_i18n?.contact_min || 'Choisis au moins un moyen de contact.') : '');
    };

    fs.addEventListener('change', update, true);
    fs.addEventListener('input',  update, true);
      update();
  }

  function updateContactPrefsValidity() {
    const fs  = document.getElementById('ta_contact_modes')
             || document.querySelector('[data-role="contact-modes"]');
    if (!fs) return;
    const min = parseInt(fs.dataset.min || '1', 10);
    const count = fs.querySelectorAll('input[type="checkbox"]:checked').length;
    const proxy = fs.querySelector('input[type="checkbox"]');
    if (proxy) {
      proxy.setCustomValidity(count >= min ? '' : (window.ta_i18n?.contact_min || 'Choisis au moins un moyen de contact.'));
    }
    fs.classList.toggle('is-error', count < min);
    fs.setAttribute('aria-invalid', count < min ? 'true' : 'false');
  }

  /* ========= Onboarding v3 ========= */
  function initOnboardingV3() {
    if (!IS_V3) return;
    const root = ROOT_V3;
    const form = root.querySelector('form');
    const ajaxUrl = root.dataset.taAjaxUrl || '';
    const nonce = root.dataset.taNonce || '';
    const errorBox = root.querySelector('[data-ta-errors]');
    const successLink = root.querySelector('[data-ta-success-link]');

    const screens = $$('[data-ta-screen]', root)
      .map((screen) => ({ screen, id: parseInt(screen.dataset.taScreen || '0', 10) }))
      .filter((item) => Number.isFinite(item.id))
      .sort((a, b) => a.id - b.id);

    const shell = root.querySelector('[data-ta-shell]');
    const rgpdInput = root.querySelector('#ta_rgpd_ok');
    const activateBtn = root.querySelector('#ta_activate_btn');
    const syncConsentButton = () => {
      if (!activateBtn || !rgpdInput) return;
      const allowed = !!rgpdInput.checked;
      activateBtn.disabled = !allowed;
      activateBtn.setAttribute('aria-disabled', allowed ? 'false' : 'true');
    };
    const setActive = (id) => {
      screens.forEach(({ screen, id: screenId }) => {
        const isActive = screenId === id;
        screen.classList.toggle('is-active', isActive);
        screen.hidden = !isActive;
      });
      if (shell) {
        shell.hidden = id === 0;
      }
    };

    const getCurrentId = () => {
      const active = screens.find(({ screen }) => screen.classList.contains('is-active'));
      return active ? active.id : (screens[0]?.id ?? 0);
    };

    const getCurrentScreen = () => {
      const currentId = getCurrentId();
      return screens.find(({ id }) => id === currentId)?.screen || null;
    };

    const getScreenIndex = (id) => screens.findIndex((item) => item.id === id);

    const isFieldVisible = (field) => {
      if (!field) return false;
      if (field.disabled) return false;
      if (field.closest('[hidden]')) return false;
      if (field.offsetParent === null) return false;
      return true;
    };

    const getVisibleInvalidField = (screen) => {
      if (!screen) return null;
      const fields = $$('input, select, textarea', screen).filter(isFieldVisible);
      return fields.find((field) => !field.checkValidity());
    };

    const showError = (message) => {
      if (!errorBox) {
        if (message) alert(message);
        return;
      }
      if (!message) {
        errorBox.hidden = true;
        errorBox.textContent = '';
        return;
      }
      errorBox.hidden = false;
      errorBox.textContent = message;
    };

    const collectScreenFormData = (screen) => {
      const data = new FormData();
      let hasPayload = false;
      const fields = $$('input, select, textarea', screen);
      const hiddenNames = new Set(
        fields
          .filter((field) => field.type === 'hidden' && field.name)
          .map((field) => field.name),
      );
      const checkboxGroups = new Map();

      fields.forEach((field) => {
        if (!field.name || field.disabled) return;
        if (field.type === 'file') {
          const files = field.files ? Array.from(field.files) : [];
          if (files.length) {
            files.forEach((file) => data.append(field.name, file));
            hasPayload = true;
          }
          return;
        }
        if (field.type === 'checkbox') {
          const group = checkboxGroups.get(field.name) || {
            checked: false,
            isArray: field.name.endsWith('[]'),
          };
          if (field.checked) {
            data.append(field.name, field.value ?? 'on');
            group.checked = true;
            hasPayload = true;
          }
          checkboxGroups.set(field.name, group);
          return;
        }
        if (field.type === 'radio') {
          if (field.checked) {
            data.append(field.name, field.value ?? 'on');
            hasPayload = true;
          }
          return;
        }
        if (field instanceof HTMLSelectElement && field.multiple) {
          Array.from(field.selectedOptions).forEach((option) => {
            data.append(field.name, option.value);
          });
          if (field.selectedOptions.length) hasPayload = true;
          return;
        }
        data.append(field.name, field.value ?? '');
        hasPayload = true;
      });

      checkboxGroups.forEach((group, name) => {
        if (group.checked) return;
        if (group.isArray) {
          data.append(name, '');
          hasPayload = true;
          return;
        }
        if (!hiddenNames.has(name)) {
          data.append(name, '0');
          hasPayload = true;
        }
      });

      const slugInput = form?.querySelector('input[name="ta_slug"]');
      if (slugInput && slugInput.value) {
        data.append('ta_slug', slugInput.value);
      }
      return { data, hasPayload };
    };

    let isSaving = false;
    const setSaving = (saving, screen) => {
      isSaving = saving;
      if (!screen) return;
      const buttons = screen.querySelectorAll('button, input[type="submit"]');
      buttons.forEach((btn) => {
        if (saving) {
          if (!btn.dataset.taWasDisabled) {
            btn.dataset.taWasDisabled = btn.disabled ? '1' : '0';
          }
          btn.disabled = true;
        } else if (btn.dataset.taWasDisabled) {
          if (btn.dataset.taWasDisabled === '0') {
            btn.disabled = false;
          }
          delete btn.dataset.taWasDisabled;
        }
        btn.classList.toggle('is-saving', saving);
      });
    };

    const canUseAjax = () => !!(form && ajaxUrl && nonce && window.fetch);

    const saveStep = async (screen) => {
      if (!canUseAjax()) return true;
      const { data, hasPayload } = collectScreenFormData(screen);
      if (!hasPayload) return true;

      data.append('action', 'ta_onboarding_save_step');
      data.append('nonce', nonce);
      data.append('screen', screen?.dataset?.taScreen || '');

      try {
        setSaving(true, screen);
        showError('');
        const response = await fetch(ajaxUrl, {
          method: 'POST',
          body: data,
          credentials: 'same-origin',
        });
        const json = await response.json();
        if (!response.ok || !json?.success) {
          const message = json?.data?.message || 'Erreur de sauvegarde.';
          showError(message);
          return false;
        }
        return true;
      } catch (err) {
        showError('Erreur réseau, veuillez réessayer.');
        return false;
      } finally {
        setSaving(false, screen);
      }
    };



    const finalize = async (screen) => {
      if (!form || !ajaxUrl || !nonce) return false;
      const data = new FormData(form);
const slugInput = form.querySelector('input[name="ta_slug"]');
if (slugInput && slugInput.value) {
  data.set('ta_slug', slugInput.value);
}


      data.append('action', 'ta_onboarding_finalize');
      data.append('nonce', nonce);
      try {
        setSaving(true, screen);
        showError('');
        const response = await fetch(ajaxUrl, {
          method: 'POST',
          body: data,
          credentials: 'same-origin',
        });
        const json = await response.json();
        if (!response.ok || !json?.success) {
          const message = json?.data?.message || 'Erreur lors de la validation.';
          showError(message);
          return false;
        }
        const publicUrl = json?.data?.public_url;
        if (publicUrl && successLink) {
          successLink.href = publicUrl;
        }
        const finalId = screens[screens.length - 1]?.id ?? 0;
        setActive(finalId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      } catch (err) {
        showError('Erreur réseau, veuillez réessayer.');
        return false;
      } finally {
        setSaving(false, screen);
      }
    };

    const goTo = (id) => {
      setActive(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    setActive(0);
    syncConsentButton();
    rgpdInput?.addEventListener('change', syncConsentButton, { passive: true });
    
    root.addEventListener('click', async (event) => {
      const startBtn = event.target.closest('[data-ta-start]');
      const nextBtn = event.target.closest('[data-ta-next]');
      const prevBtn = event.target.closest('[data-ta-prev]');

      if (startBtn) {
        event.preventDefault();
        goTo(1);
        return;
      }

      if (prevBtn) {
        event.preventDefault();
        const currentId = getCurrentId();
        const currentIndex = getScreenIndex(currentId);
        const prevItem = screens[currentIndex - 1];
        if (prevItem) {
          goTo(prevItem.id);
        }
        return;
      }

      if (nextBtn) {
        event.preventDefault();
        if (isSaving) return;
        const currentId = getCurrentId();
        const currentIndex = getScreenIndex(currentId);
        const currentScreen = getCurrentScreen();
        if (!currentScreen) return;

        updateContactPrefsValidity();
        const invalid = getVisibleInvalidField(currentScreen);
        if (invalid) {
          scrollToField(invalid);
          return;
        }

        const saved = await saveStep(currentScreen);
        if (!saved) return;

        const nextItem = screens[currentIndex + 1];
        if (nextItem) {
          goTo(nextItem.id);
        }
      }
    });

    form?.addEventListener('submit', async (event) => {
      if (isSaving) {
        event.preventDefault();
        return;
      }
      const currentScreen = getCurrentScreen();
      updateContactPrefsValidity();
      const invalid = getVisibleInvalidField(currentScreen);
      if (invalid) {
        event.preventDefault();
        scrollToField(invalid);
        return;
      }
      event.preventDefault();
      await finalize(currentScreen);
    });
  }

  /* ========= Submit : scroll invalid ========= */
  function initSubmitScrollToInvalid(){
    const form = $(SEL.form);
    if (!form) return;

    form.addEventListener('invalid', (ev) => {
      const el = ev.target;
      if (el && !el.disabled && el.offsetParent !== null) {
        scrollToField(el);
      }
    }, true);

    form.addEventListener('submit', (e) => {
      const group = document.getElementById('ta_contact_modes') 
                 || document.querySelector('[data-role="contact-modes"]');
      if (group) {
        const proxy = group.querySelector('input[type="checkbox"]');
        if (proxy) {
          const count = group.querySelectorAll('input[type="checkbox"]:checked').length;
          proxy.setCustomValidity(count >= (parseInt(group.dataset.min||'1',10)) ? '' : (window.ta_i18n?.contact_min || 'Choisis au moins un moyen de contact.'));
        }
      }
      if (!form.checkValidity()){
        e.preventDefault();
        const firstInvalid = form.querySelector(':invalid') || $$('input,select,textarea', form).find(el => !el.checkValidity?.());
        if (firstInvalid) scrollToField(firstInvalid);
      }
    });
  }

  /* ========= Switch Privé/Public (CSS only text) ========= */
  function initPrivacyToggles() {
    const wraps = document.querySelectorAll('.ta-ios-toggle-wrap, .ta-privacy');

    wraps.forEach((wrap) => {
      // Nettoyage défensif (si vieux markup)
      wrap.querySelectorAll('.ta-ios-toggle-status, .lbl, .knob').forEach(el => el.remove());

      const label = wrap.querySelector('.ta-ios-toggle');
      const input = label ? label.querySelector('input[type="checkbox"][name^="vis["]') : null;
      if (!label || !input) return;

      const sync = () => {
        label.setAttribute('role', 'switch');
        label.setAttribute('aria-checked', input.checked ? 'true' : 'false');
        label.classList.toggle('is-public',  input.checked);
        label.classList.toggle('is-private', !input.checked);
      };

      input.addEventListener('change', sync, { passive: true });
      sync();
 });
  }

  /* ========= Welcome screen ========= */
  function initWelcomeScreen() {
    const screen = document.querySelector('[data-ta-screen="0"]');
    const startBtn = document.querySelector('[data-ta-start]');
    const wizard = document.querySelector('[data-ta-wizard]');
    if (!screen || !wizard) return;

    const revealWizard = () => {
      screen.hidden = true;
      wizard.hidden = false;
      const firstField = wizard.querySelector('input, select, textarea');
      if (firstField) {
        try { firstField.focus({ preventScroll: true }); } catch (e) { firstField.focus(); }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (screen.hidden) {
      wizard.hidden = false;
      return;
    }

    startBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      revealWizard();
    });
  }


  
  /* ==========================================================
   Récompense – toggle simple
   ========================================================== */
(() => {
  const rewardToggle = document.querySelector('[data-ta-toggle="reward"]');
  const rewardAmount = document.querySelector('[data-ta-reward-amount]');

  if (!rewardToggle || !rewardAmount) return;

  const syncReward = () => {
    rewardAmount.hidden = !rewardToggle.checked;
  };

  rewardToggle.addEventListener('change', syncReward);
  syncReward(); // état initial (rechargement / retour arrière)
})();


  /* ========= Init ========= */
function init() {


  initCoOwnerToggle();
  initPasswordIndicators();
  initContactPrefsMin();
  initPrivacyToggles();


  if (IS_V3) {
    initOnboardingV3();
    return;
  }

  enableClientNavIfBothPanels();
  initFinalButton();
  initSubmitScrollToInvalid();
  initWelcomeScreen();
  initScreenWizard();
}


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();