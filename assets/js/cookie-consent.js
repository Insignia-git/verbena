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

  function injectResponsiveStyles() {
    if (document.getElementById('cookieConsentResponsiveStyles')) return;

    const style = document.createElement('style');
    style.id = 'cookieConsentResponsiveStyles';
    style.textContent = [
      '#cookieSettingsPanel .cc-settings-shell { padding: 28px 30px; }',
      '#cookieSettingsPanel .cc-settings-table-wrap { overflow: auto; -webkit-overflow-scrolling: touch; }',
      '#cookieSettingsPanel .cc-settings-table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.4; table-layout: fixed; }',
      '#cookieSettingsPanel .cc-settings-table th:nth-child(1), #cookieSettingsPanel .cc-settings-table td:nth-child(1) { width: 25%; }',
      '#cookieSettingsPanel .cc-settings-table th:nth-child(2), #cookieSettingsPanel .cc-settings-table td:nth-child(2) { width: 57%; }',
      '#cookieSettingsPanel .cc-settings-table th:nth-child(3), #cookieSettingsPanel .cc-settings-table td:nth-child(3) { width: 18%; min-width: 68px; text-align: center; }',
      '@media (max-width: 640px) {',
      '  #cookieSettingsPanel { left: 8px !important; right: 8px !important; bottom: 12px !important; }',
      '  #cookieSettingsPanel .cc-settings-shell { padding: 14px 12px !important; }',
      '  #cookieSettingsPanel .cc-settings-table { font-size: 12px !important; }',
      '  #cookieSettingsPanel .cc-settings-table th, #cookieSettingsPanel .cc-settings-table td { padding: 8px 6px !important; }',
      '  #cookieSettingsPanel .cc-settings-table th:nth-child(1), #cookieSettingsPanel .cc-settings-table td:nth-child(1) { width: 27% !important; }',
      '  #cookieSettingsPanel .cc-settings-table th:nth-child(2), #cookieSettingsPanel .cc-settings-table td:nth-child(2) { width: 55% !important; }',
      '  #cookieSettingsPanel .cc-settings-table th:nth-child(3), #cookieSettingsPanel .cc-settings-table td:nth-child(3) { width: 18% !important; min-width: 64px !important; }',
      '  #cookieSettingsPanel .cc-settings-table input[type="checkbox"] { width: 20px !important; height: 20px !important; min-width: 20px !important; }',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  function createBanner() {
    const wrapper = document.createElement('div');
    wrapper.id = 'cookieConsentBanner';
    wrapper.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:1100;max-width:980px;margin:0 auto;';
    wrapper.innerHTML = `
      <div style="background:#ffffff;border:1px solid rgba(29,58,143,.18);border-radius:14px;box-shadow:0 16px 36px rgba(0,0,0,.18);">
        <div style="padding:20px;">
          <h2 style="margin:0 0 8px;">Szanujemy Twoją prywatność</h2>
          <p style="margin:0 0 12px;color:#6b7280;">Gdy przeglądasz naszą stronę, chcielibyśmy wykorzystywać pliki cookies i inne podobne technologie do zbierania danych (m.in. adresy IP, inne identyfikatory internetowe) w dwóch głównych celach: by analizować statystyki ruchu na stronie oraz by kierować do Ciebie reklamy w innych miejscach w internecie. Kliknij poniżej, by wyrazić zgodę albo przejdź do ustawień, aby dokonać szczegółowych wyborów co do plików cookies. Szczegóły znajdziesz w <a href="./polityka-prywatnosci.html" target="_blank" rel="noopener">Polityce prywatności</a>.</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;">
            <button type="button" class="btn btn-primary" id="cookieAcceptAll">Zgadzam się</button>
            <button type="button" class="btn btn-outline-secondary" id="cookieReject">Nie wyrażam zgody</button>
            <button type="button" class="btn btn-outline-primary" id="cookieSettings">Przejdź do ustawień</button>
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
    panel.style.cssText = 'position:fixed;left:24px;right:24px;bottom:72px;z-index:1200;display:none;max-width:980px;margin:0 auto;';
    panel.innerHTML = `
      <div style="max-height:72vh;overflow:auto;background:#ffffff;border:1px solid rgba(29,58,143,.22);border-radius:14px;box-shadow:0 20px 42px rgba(0,0,0,.2);">
        <div class="cc-settings-shell" style="padding:28px 30px;">
          <h2 style="margin:0 0 10px;color:#1d3a8f;">Szanujemy Twoją prywatność</h2>
          <p style="margin:0 0 16px;color:#3b3462;">Oto używane w naszym serwisie usługi, które mogą zapisywać na Twoim urządzeniu pliki cookies. Wybierz odpowiadające Ci ustawienia. Zawsze możesz do nich wrócić używając linku, zamieszczonego w <a href="./polityka-prywatnosci.html" target="_blank" rel="noopener">Polityce prywatności</a>. Tam też znajdziesz więcej szczegółowych informacji o używanych przez nas plikach cookies.</p>

          <div class="cc-settings-table-wrap" style="border:1px solid #d9deec;border-radius:10px;overflow:hidden;margin-bottom:16px;">
            <table class="cc-settings-table" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.4;">
              <thead>
                <tr style="background:#f5f7ff;">
                  <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #d9deec;color:#1d3a8f;">USŁUGA</th>
                  <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #d9deec;color:#1d3a8f;">CEL UŻYCIA</th>
                  <th style="text-align:center;padding:10px 12px;border-bottom:1px solid #d9deec;color:#1d3a8f;white-space:nowrap;">WŁĄCZ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:12px;border-bottom:1px solid #e5e8f3;vertical-align:top;"><strong>Cookies wymagane</strong></td>
                  <td style="padding:12px;border-bottom:1px solid #e5e8f3;vertical-align:top;">Cookies niezbędne służą do prawidłowego działania strony oraz jeszcze lepszych zabezpieczeń. Niestety nie możesz ich wyłączyć, bo po wyłączeniu nasza strona po prostu nie będzie poprawnie działać.</td>
                  <td style="padding:12px;border-bottom:1px solid #e5e8f3;text-align:center;vertical-align:top;">
                    <input type="checkbox" id="cookieNecessary" checked disabled aria-label="Cookies wymagane zawsze aktywne" style="width:18px;height:18px;min-width:18px;margin:0;accent-color:#1d3a8f;">
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px;border-bottom:1px solid #e5e8f3;vertical-align:top;"><strong>Google Analytics</strong></td>
                  <td style="padding:12px;border-bottom:1px solid #e5e8f3;vertical-align:top;">Korzystamy z tego narzędzia do zebrania danych statystycznych, (na podstawie skróconego adresu IP) o sposobie korzystania przez internautów z naszej strony, np.: ilość użytkowników na stronie, skąd użytkownicy przeszli na stronę, jakie zakładki odwiedzali, czas pozostawania na stronie.</td>
                  <td style="padding:12px;border-bottom:1px solid #e5e8f3;text-align:center;vertical-align:top;">
                    <input type="checkbox" id="cookieAnalytics" aria-label="Zgoda na Google Analytics" style="width:18px;height:18px;min-width:18px;margin:0;accent-color:#1d3a8f;">
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px;vertical-align:top;"><strong>Pixel Meta</strong></td>
                  <td style="padding:12px;vertical-align:top;">Za pomocą tego narzędzia Facebook oraz Instagram zbierają informacje na temat tego jak korzystasz z naszej strony. Dzięki temu możemy w przyszłości kierować do Ciebie spersonalizowaną reklamę w ramach narzędzi reklamowych Facebooka oraz Instagrama. Facebook oraz Instagram mogą też wyświetlać nasze reklamy innym użytkownikom tego portalu, którzy mają według portalu podobne do Ciebie zainteresowania i/lub profil. My jako właściciel strony internetowej, nie gromadzimy danych pozwalających nam Cię bezpośrednio zidentyfikować.</td>
                  <td style="padding:12px;text-align:center;vertical-align:top;">
                    <input type="checkbox" id="cookieMarketing" aria-label="Zgoda na Pixel Meta" style="width:18px;height:18px;min-width:18px;margin:0;accent-color:#1d3a8f;">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;">
            <button type="button" class="btn btn-outline-primary" id="cookieSaveSelection">Zapisz te ustawienia</button>
            <button type="button" class="btn btn-outline-secondary" id="cookieRejectAll">Odrzuć wszystkie</button>
            <button type="button" class="btn btn-primary" id="cookieSaveAll">Zaakceptuj wszystkie</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector('#cookieAnalytics').checked = !!initialConsent.analytics;
    panel.querySelector('#cookieMarketing').checked = !!initialConsent.marketing;

    return panel;
  }

  function openSettings(panel) {
    panel.style.display = 'block';
  }

  function closeSettings(panel) {
    panel.style.display = 'none';
  }

  function init() {
    injectResponsiveStyles();

    const currentConsent = loadConsent();
    activateDeferredScripts(currentConsent);
    const shouldOpenFromUrl = new URLSearchParams(window.location.search).get('openCookieSettings') === '1' || window.location.hash === '#cookie-settings';

    const settingsPanel = createSettingsPanel(currentConsent);

    let banner = null;
    if (!currentConsent.consentGiven) {
      banner = createBanner();
    }

    function hideBannerIfVisible() {
      if (banner) {
        banner.remove();
        banner = null;
      }
    }

    function openSettingsWithLatestConsent() {
      const latest = loadConsent();
      settingsPanel.querySelector('#cookieAnalytics').checked = !!latest.analytics;
      settingsPanel.querySelector('#cookieMarketing').checked = !!latest.marketing;
      hideBannerIfVisible();
      openSettings(settingsPanel);
    }

    function applyConsent(consent) {
      const saved = saveConsent(consent);
      settingsPanel.querySelector('#cookieAnalytics').checked = !!saved.analytics;
      settingsPanel.querySelector('#cookieMarketing').checked = !!saved.marketing;
      hideBannerIfVisible();
      closeSettings(settingsPanel);
    }

    if (shouldOpenFromUrl) {
      openSettingsWithLatestConsent();
    }

    settingsPanel.querySelector('#cookieSaveSelection').addEventListener('click', function () {
      applyConsent({
        preferences: false,
        analytics: settingsPanel.querySelector('#cookieAnalytics').checked,
        marketing: settingsPanel.querySelector('#cookieMarketing').checked
      });
    });

    settingsPanel.querySelector('#cookieRejectAll').addEventListener('click', function () {
      applyConsent({ preferences: false, analytics: false, marketing: false });
    });

    settingsPanel.querySelector('#cookieSaveAll').addEventListener('click', function () {
      applyConsent({ preferences: false, analytics: true, marketing: true });
    });

    if (banner) {
      banner.querySelector('#cookieReject').addEventListener('click', function () {
        applyConsent({ preferences: false, analytics: false, marketing: false });
      });

      banner.querySelector('#cookieSettings').addEventListener('click', function () {
        openSettingsWithLatestConsent();
      });

      banner.querySelector('#cookieAcceptAll').addEventListener('click', function () {
        applyConsent({ preferences: false, analytics: true, marketing: true });
      });
    }
  }

  window.CookieConsent = {
    getConsent: loadConsent,
    hasConsent: hasConsent,
    openSettings: function () {
      const panel = document.getElementById('cookieSettingsPanel');
      if (!panel) return;

      const latest = loadConsent();
      const analyticsCheckbox = panel.querySelector('#cookieAnalytics');
      const marketingCheckbox = panel.querySelector('#cookieMarketing');
      if (analyticsCheckbox) analyticsCheckbox.checked = !!latest.analytics;
      if (marketingCheckbox) marketingCheckbox.checked = !!latest.marketing;

      const bannerEl = document.getElementById('cookieConsentBanner');
      if (bannerEl) bannerEl.remove();
      panel.style.display = 'block';
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
