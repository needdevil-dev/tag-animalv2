/* global TA_EDIT_PHOTO, jQuery */
(function ($) {
  if (typeof TA_EDIT_PHOTO === 'undefined') return;

  const AUTO = !!TA_EDIT_PHOTO.auto; // <<< NOUVEAU : pilotage du mode
  const IS_ACTIVATION = !!TA_EDIT_PHOTO.is_activation;

  const $wraps = $('[data-ta-photo-field]').length ? $('[data-ta-photo-field]') : $('.ta-photo-field');
  if (!$wraps.length) return;

  const PLACEHOLDER = TA_EDIT_PHOTO.placehold || '';
  const MAX_MB = TA_EDIT_PHOTO.max_mb || 10;

  const initWrapper = ($wrap) => {
    if ($wrap.data('taPhotoReady')) return;
    $wrap.data('taPhotoReady', true);

    const $img = $wrap.find('[data-ta-photo-preview]').first().length
      ? $wrap.find('[data-ta-photo-preview]').first()
      : $wrap.find('img').first();
    const $file = $wrap.find('[data-ta-photo-input]').first();
    const $btnDel = $wrap.find('[data-ta-photo-delete]').first();
    const $btnTrigger = $wrap.find('[data-ta-photo-trigger]').first();
    const $hidId = $wrap.find('[data-ta-photo-id]').first();
    const $hidUrl = $wrap.find('[data-ta-photo-url]').first();
    const $delFlag = $wrap.find('[data-ta-photo-delete-flag]').first();
    const $controls = $wrap.find('.ta-photo-controls').length ? $wrap.find('.ta-photo-controls') : $wrap;
    const wrapNode = $wrap.get(0);
    const imgNode = $img.length ? $img.get(0) : null;
    const previewNode = imgNode ? imgNode.closest('.ta-photo-preview') : null;
    const loaderNode = previewNode ? previewNode.querySelector('.ta-photo-loader') : null;

    if (!$file.length || !$btnDel.length || !$img.length) {
      return;
    }

    const dispatch = (type, detail = {}) => {
      if (!wrapNode || typeof window === 'undefined' || typeof window.CustomEvent !== 'function') return;
      wrapNode.dispatchEvent(new CustomEvent(type, { detail }));
    };

    const showLoader = () => {
      if (previewNode) previewNode.classList.add('is-loading');
      if (loaderNode) loaderNode.hidden = false;
    };
    const hideLoader = () => {
      if (previewNode) previewNode.classList.remove('is-loading');
      if (loaderNode) loaderNode.hidden = true;
    };

    if (wrapNode) {
      wrapNode.addEventListener('taganimal:photo-loading', showLoader);
      wrapNode.addEventListener('taganimal:photo-loaded', hideLoader);
      wrapNode.addEventListener('taganimal:photo-error', hideLoader);
    }

    if (imgNode) {
      const currentSrc = () => imgNode.currentSrc || imgNode.src || '';
      const handleLoad = () => dispatch('taganimal:photo-loaded', { src: currentSrc() });
      const handleError = () => dispatch('taganimal:photo-error', { src: currentSrc() });
      imgNode.addEventListener('load', handleLoad);
      imgNode.addEventListener('error', handleError);
      if (imgNode.complete && imgNode.naturalWidth > 0) {
        handleLoad();
      } else {
        showLoader();
      }
    }

    const syncDeleteFlag = (state) => {
      if (!$delFlag.length) return;
      const on = !!state;
      if ($delFlag.is('[type="checkbox"]')) {
        $delFlag.prop('checked', on);
      }
      $delFlag.val(on ? '1' : '0');
    };

    // Barre de progression (utilisée seulement en AUTO)
    let $prog = $controls.find('.ta-photo-progress');
    if (!$prog.length) {
      $prog = $(
        '<div class="ta-photo-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden aria-hidden="true">' +
          '<div class="bar" aria-hidden="true"></div>' +
          '<span class="pct" aria-hidden="true">0%</span>' +
        '</div>'
      );
      $controls.append($prog);
    }

    const $progBar = $prog.find('.bar');
    const $progPct = $prog.find('.pct');
    let hasDispatchedProcessing = false;

    const showProgress = () => {
      if (!AUTO) return;
      $prog.removeAttr('hidden').attr('aria-hidden', 'false').show();
    };

    const hideProgress = () => {
      if (!AUTO) return;
      $prog.attr('aria-hidden', 'true').attr('hidden', 'hidden').hide();
    };

    function setProgress(pct) {
      if (!AUTO) return;
      showProgress();
      $prog.removeClass('is-indeterminate').addClass('is-active');
      const v = Math.max(0, Math.min(100, Math.round(pct)));
      $prog.attr('aria-valuenow', v);
      if ($progPct.length) $progPct.text(v + '%');
      if ($progBar.length) $progBar.css({ width: v + '%' });
      hasDispatchedProcessing = false;
    }
    function setProcessing(label) {
      if (!AUTO) return;
      showProgress();
      $prog.addClass('is-active is-indeterminate');
      const txt = label || (TA_EDIT_PHOTO.strings && TA_EDIT_PHOTO.strings.processing) || 'Traitement…';
      if ($progPct.length) $progPct.text(txt);
      if ($progBar.length) $progBar.css({ width: '40%' });
      if (!hasDispatchedProcessing) {
        dispatch('taganimal:photo-processing', { reason: 'processing' });
        hasDispatchedProcessing = true;
      }
    }
    function endProgress() {
      if (!AUTO) return;
      $prog.removeClass('is-active is-indeterminate');
      hideProgress();
      if ($progPct.length) $progPct.text('0%');
      if ($progBar.length) $progBar.css({ width: '0%' });
      $prog.attr('aria-valuenow', 0);
      hasDispatchedProcessing = false;
    }

    if ($btnTrigger.length) {
      $btnTrigger.on('click', function (event) {
        event.preventDefault();
        $file.trigger('click');
      });
    }

    // ---- Sélection de fichier
    $file.on('change', function () {
      const f = this.files && this.files[0];
      if (!f) return;

      // Taille max
      if (f.size > MAX_MB * 1024 * 1024) {
        alert((TA_EDIT_PHOTO.strings && TA_EDIT_PHOTO.strings.tooBig) || 'Fichier trop volumineux');
        this.value = '';
        return;
      }

      if (!AUTO) {
        syncDeleteFlag(false);
        if ($img.length) {
          const url = URL.createObjectURL(f);
          dispatch('taganimal:photo-loading', { reason: 'local-select', url });
          $img.attr('src', url);
        }
        // Ne pas toucher aux champs cachés ici : le serveur prendra $_FILES à la sauvegarde
        return;
      }

      // --- Mode AUTO : upload AJAX immédiat
      syncDeleteFlag(false);
const fd = new FormData();
fd.append('action', 'ta_set_photo');
fd.append('nonce', TA_EDIT_PHOTO.nonce || '');
fd.append('is_activation', IS_ACTIVATION ? 1 : 0);
if (TA_EDIT_PHOTO.post_id) fd.append('post_id', TA_EDIT_PHOTO.post_id);
if (TA_EDIT_PHOTO.slug) fd.append('slug', TA_EDIT_PHOTO.slug);
fd.append('pet_photo_file', f);

      $file.prop('disabled', true);
      $btnDel.prop('disabled', true).addClass('is-disabled');
      dispatch('taganimal:photo-loading', { reason: 'upload' });
      setProgress(1);

      $.ajax({
        url: TA_EDIT_PHOTO.ajax_url,
        type: 'POST',
        data: fd,
        processData: false,
        contentType: false,
        xhr: function () {
          const xhr = $.ajaxSettings.xhr();
          if (xhr && xhr.upload) {
            xhr.upload.addEventListener('progress', function (e) {
              if (e.lengthComputable) {
                const pct = (e.loaded / e.total) * 100;
                if (pct >= 98) setProcessing();
                else setProgress(pct);
              } else {
                setProcessing();
              }
            }, false);
          }
          return xhr;
        },
        success: function (resp, status, jq) {
          const ct = (jq && jq.getResponseHeader && jq.getResponseHeader('Content-Type')) || '';
          if (ct.indexOf('application/json') === -1 || !resp || !resp.success || !resp.data) {
            dispatch('taganimal:photo-error', { reason: 'invalid-response' });
            alert((TA_EDIT_PHOTO.strings && TA_EDIT_PHOTO.strings.error) || 'Erreur');
            return;
          }
          $hidId.val(resp.data.id || '');
          $hidUrl.val('');
          syncDeleteFlag(false);
          if (resp.data.url && $img.length) {
            const bust = (resp.data.url.indexOf('?') > -1 ? '&' : '?') + 'v=' + Date.now();
            $img.attr('src', resp.data.url + bust);
          }
        },
        error: function () {
          dispatch('taganimal:photo-error', { reason: 'upload-failed' });
          alert((TA_EDIT_PHOTO.strings && TA_EDIT_PHOTO.strings.error) || 'Erreur');
        },
        complete: function () {
          endProgress();
          $file.prop('disabled', false);
          $btnDel.prop('disabled', false).removeClass('is-disabled');
        }
      });
    });

    // ---- Suppression
    $btnDel.on('click', function (e) {
      e.preventDefault();

      // Mode MANUEL : on marque à supprimer, on met le placeholder, et on attend la sauvegarde
      if (!AUTO) {
        syncDeleteFlag(true);
        if ($hidId.length) $hidId.val('');
        if ($hidUrl.length) $hidUrl.val('');
        if ($file.length) $file.val('');
        if (PLACEHOLDER && $img.length) {
          dispatch('taganimal:photo-loading', { reason: 'manual-reset', url: PLACEHOLDER });
          $img.attr('src', PLACEHOLDER);
          dispatch('taganimal:photo-loaded', { reason: 'manual-reset', src: PLACEHOLDER });
        } else {
          dispatch('taganimal:photo-loaded', { reason: 'manual-reset' });
        }
        return;
      }

      // Mode AUTO : suppression AJAX
      $file.prop('disabled', true);
      $btnDel.prop('disabled', true).addClass('is-disabled');
      dispatch('taganimal:photo-loading', { reason: 'delete' });
      setProcessing((TA_EDIT_PHOTO.strings && TA_EDIT_PHOTO.strings.deleting) || 'Suppression…');

const data = {
  action: 'ta_delete_photo',
  nonce: TA_EDIT_PHOTO.nonce || '',
  is_activation: IS_ACTIVATION ? 1 : 0
};


      if (TA_EDIT_PHOTO.post_id) data.post_id = TA_EDIT_PHOTO.post_id;
      if (TA_EDIT_PHOTO.slug) data.slug = TA_EDIT_PHOTO.slug;

      $.post(TA_EDIT_PHOTO.ajax_url, data)
        .done(function (resp, status, jq) {
          const ct = (jq && jq.getResponseHeader && jq.getResponseHeader('Content-Type')) || '';
          if (ct.indexOf('application/json') === -1 || !resp || !resp.success || !resp.data) {
            dispatch('taganimal:photo-error', { reason: 'delete-invalid' });
            alert((TA_EDIT_PHOTO.strings && TA_EDIT_PHOTO.strings.error) || 'Erreur');
            return;
          }
          $hidId.val('');
          $hidUrl.val('');
          if ($file.length) $file.val('');
          let placeholderUrl = PLACEHOLDER;
          if (resp.data.placeholder && $img.length) {
            placeholderUrl = resp.data.placeholder;
            $img.attr('src', placeholderUrl);
          } else if (PLACEHOLDER && $img.length) {
            $img.attr('src', PLACEHOLDER);
          }
          syncDeleteFlag(false);
          dispatch('taganimal:photo-loaded', { reason: 'delete-success', src: placeholderUrl });
        })
        .fail(function () {
          dispatch('taganimal:photo-error', { reason: 'delete-failed' });
          alert((TA_EDIT_PHOTO.strings && TA_EDIT_PHOTO.strings.error) || 'Erreur');
        })
        .always(function () {
          endProgress();
          $file.prop('disabled', false);
          $btnDel.prop('disabled', false).removeClass('is-disabled');
          syncDeleteFlag(false);
          dispatch('taganimal:photo-loaded', { reason: 'delete-complete', src: PLACEHOLDER });
        });
    });
  };

  $wraps.each(function () {
    initWrapper($(this));
  });
})(jQuery);