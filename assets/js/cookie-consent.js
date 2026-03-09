(function () {
  const STORAGE_KEY = 'verbena_cookie_consent_v1';
  const CONSENT_VERSION = 1;
  const DEFAULT_CONSENT = {
    version: CONSENT_VERSION,
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    consentGiven: false,
    updatedAt: null
  };

  function loadConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONSENT };
      const parsed = JSON.parse(raw);

      if (!parsed || parsed.version !== CONSENT_VERSION) {
        return { ...DEFAULT_CONSENT };
      }

      return {
        ...DEFAULT_CONSENT,
        ...parsed,
        necessary: true
      };
    } catch {
      return { ...DEFAULT_CONSENT };
    }
  }

  function saveConsent(consent) {
    const normalized = {
      ...DEFAULT_CONSENT,
      ...consent,
      necessary: true,
      version: CONSENT_VERSION,
      consentGiven: true,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: normalized }));
    activateDeferredScripts(normalized);
    return normalized;
  }

  function hasConsent(category) {
    const consent = loadConsent();
    return !!consent[category];
  }

  function runIfConsented(category, callback) {
    if (hasConsent(category)) {
      callback();
      return;
    }

    const handler = function (event) {
      if (event.detail && event.detail[category]) {
        window.removeEventListener('cookie-consent-updated', handler);
        callback();
      }
    };

    window.addEventListener('cookie-consent-updated', handler);
  }

  function activateDeferredScripts(consent) {
    const scripts = document.querySelectorAll('script[type="text/plain"][data-cookie-category]');

    scripts.forEach((script) => {
      const category = script.dataset.cookieCategory;
      if (!consent[category] || script.dataset.cookieLoaded === 'true') return;

      const executable = document.createElement('script');
      executable.type = 'text/javascript';
      if (script.src) {
        executable.src = script.src;
      } else {
        executable.textContent = script.textContent;
      }

      Array.from(script.attributes).forEach((attr) => {
        if (attr.name !== 'type' && attr.name !== 'data-cookie-category' && attr.name !== 'data-cookie-loaded') {
          executable.setAttribute(attr.name, attr.value);
        }
      });

      script.dataset.cookieLoaded = 'true';
      script.parentNode.insertBefore(executable, script.nextSibling);
    });
  }

  function createBanner() {
    const wrapper = document.createElement('div');
    wrapper.id = 'cookieConsentBanner';
    wrapper.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:1100;max-width:980px;margin:0 auto;';
    wrapper.innerHTML = `
      <div class="card shadow border-0">
        <div class="card-body p-3 p-md-4">
          <h2 class="h5 mb-2">Ustawienia plików cookie</h2>
          <p class="mb-3 text-muted">Używamy niezbędnych plików cookie do działania serwisu. Opcjonalne pliki cookie (analityczne, marketingowe, preferencyjne) uruchamiamy wyłącznie po Twojej zgodzie.</p>
          <div class="d-flex flex-column flex-md-row gap-2 justify-content-end">
            <button type="button" class="btn btn-outline-secondary" id="cookieReject">Odrzuć opcjonalne</button>
            <button type="button" class="btn btn-outline-primary" id="cookieSettings">Ustawienia</button>
            <button type="button" class="btn btn-primary" id="cookieAcceptAll">Akceptuję wszystkie</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);
    return wrapper;
  }

  function createSettingsPanel(initialConsent) {
    const panel = document.createElement('div');
    panel.id = 'cookieSettingsPanel';
    panel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:1200;padding:16px;';
    panel.innerHTML = `
      <div class="card border-0 shadow" style="max-width:760px;margin:4vh auto;max-height:92vh;overflow:auto;">
        <div class="card-body p-4">
          <h2 class="h4 mb-3">Preferencje plików cookie</h2>
          <p class="text-muted">Możesz zmienić zgodę w każdej chwili przyciskiem „Zarządzaj cookies” na dole strony.</p>

          <div class="border rounded p-3 mb-3 bg-light">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="cookieNecessary" checked disabled>
              <label class="form-check-label" for="cookieNecessary"><strong>Niezbędne</strong> – zawsze aktywne (logika formularzy i bezpieczeństwo).</label>
            </div>
          </div>

          <div class="border rounded p-3 mb-3">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="cookiePreferences">
              <label class="form-check-label" for="cookiePreferences"><strong>Preferencyjne</strong> – zapamiętywanie ustawień użytkownika.</label>
            </div>
          </div>

          <div class="border rounded p-3 mb-3">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="cookieAnalytics">
              <label class="form-check-label" for="cookieAnalytics"><strong>Analityczne</strong> – statystyki korzystania ze strony.</label>
            </div>
          </div>

          <div class="border rounded p-3 mb-4">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="cookieMarketing">
              <label class="form-check-label" for="cookieMarketing"><strong>Marketingowe</strong> – personalizacja działań reklamowych.</label>
            </div>
          </div>

          <div class="d-flex flex-column flex-md-row justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" id="cookieClose">Anuluj</button>
            <button type="button" class="btn btn-outline-primary" id="cookieSaveSelection">Zapisz wybór</button>
            <button type="button" class="btn btn-primary" id="cookieSaveAll">Akceptuję wszystkie</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector('#cookiePreferences').checked = !!initialConsent.preferences;
    panel.querySelector('#cookieAnalytics').checked = !!initialConsent.analytics;
    panel.querySelector('#cookieMarketing').checked = !!initialConsent.marketing;

    return panel;
  }

  function createManageButton() {
    const button = document.createElement('button');
    button.id = 'cookieManageBtn';
    button.type = 'button';
    button.className = 'btn btn-sm btn-outline-secondary';
    button.textContent = 'Zarządzaj cookies';
    button.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:1000;';
    document.body.appendChild(button);
    return button;
  }

  function openSettings(panel) {
    panel.style.display = 'block';
  }

  function closeSettings(panel) {
    panel.style.display = 'none';
  }

  function init() {
    const currentConsent = loadConsent();
    activateDeferredScripts(currentConsent);

    const manageButton = createManageButton();
    const settingsPanel = createSettingsPanel(currentConsent);

    let banner = null;
    if (!currentConsent.consentGiven) {
      banner = createBanner();
      manageButton.style.bottom = '130px';
    }

    function hideBannerIfVisible() {
      if (banner) {
        banner.remove();
        banner = null;
      }
      manageButton.style.bottom = '16px';
    }

    function applyConsent(consent) {
      const saved = saveConsent(consent);
      settingsPanel.querySelector('#cookiePreferences').checked = !!saved.preferences;
      settingsPanel.querySelector('#cookieAnalytics').checked = !!saved.analytics;
      settingsPanel.querySelector('#cookieMarketing').checked = !!saved.marketing;
      hideBannerIfVisible();
      closeSettings(settingsPanel);
    }

    manageButton.addEventListener('click', function () {
      const latest = loadConsent();
      settingsPanel.querySelector('#cookiePreferences').checked = !!latest.preferences;
      settingsPanel.querySelector('#cookieAnalytics').checked = !!latest.analytics;
      settingsPanel.querySelector('#cookieMarketing').checked = !!latest.marketing;
      openSettings(settingsPanel);
    });

    settingsPanel.querySelector('#cookieClose').addEventListener('click', function () {
      closeSettings(settingsPanel);
    });

    settingsPanel.querySelector('#cookieSaveSelection').addEventListener('click', function () {
      applyConsent({
        preferences: settingsPanel.querySelector('#cookiePreferences').checked,
        analytics: settingsPanel.querySelector('#cookieAnalytics').checked,
        marketing: settingsPanel.querySelector('#cookieMarketing').checked
      });
    });

    settingsPanel.querySelector('#cookieSaveAll').addEventListener('click', function () {
      applyConsent({ preferences: true, analytics: true, marketing: true });
    });

    settingsPanel.addEventListener('click', function (event) {
      if (event.target === settingsPanel) {
        closeSettings(settingsPanel);
      }
    });

    if (banner) {
      banner.querySelector('#cookieReject').addEventListener('click', function () {
        applyConsent({ preferences: false, analytics: false, marketing: false });
      });

      banner.querySelector('#cookieSettings').addEventListener('click', function () {
        openSettings(settingsPanel);
      });

      banner.querySelector('#cookieAcceptAll').addEventListener('click', function () {
        applyConsent({ preferences: true, analytics: true, marketing: true });
      });
    }
  }

  window.CookieConsent = {
    getConsent: loadConsent,
    hasConsent: hasConsent,
    openSettings: function () {
      const btn = document.getElementById('cookieManageBtn');
      if (btn) btn.click();
    },
    resetConsent: function () {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    },
    runIfConsented: runIfConsented
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
