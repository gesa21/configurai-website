/* ============================================================
   ConfigurAI Cookie Consent Banner
   Self-contained widget. Injects HTML, CSS, and behaviour into
   the page on load. Renders only when the visitor has not yet
   made a choice. Storage key: localStorage 'configurai_cookie_consent'
   with one of two values: 'accepted' or 'rejected'.

   Integration points:
   - window.onCookieAccept (optional): called when the visitor
     clicks Accept all. Use this hook to load analytics or other
     non-essential scripts after consent.
   - window.openCookieSettings (provided): re-displays the banner
     so the visitor can change their mind. Wire the footer
     "Cookie settings" link to this function.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'configurai_cookie_consent';
  var BANNER_ID = 'cookie-banner';
  var STYLE_ID = 'cookie-banner-style';

  // Inline stylesheet scoped via the #cookie-banner id so it does
  // not bleed into the rest of the page. Inherits the page font
  // family by leaving font-family unset on the banner elements.
  var STYLE = [
    '#cookie-banner {',
    '  position: fixed;',
    '  bottom: 0;',
    '  left: 0;',
    '  right: 0;',
    '  z-index: 9999;',
    '  background: #0D1B2A;',
    '  color: #FFFFFF;',
    '  border-top: 2px solid #D5FF4D;',
    '  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);',
    '  transform: translateY(100%);',
    '  opacity: 0;',
    '  transition: transform 0.4s ease-out, opacity 0.4s ease-out;',
    '}',
    '#cookie-banner.is-visible {',
    '  transform: translateY(0);',
    '  opacity: 1;',
    '}',
    '#cookie-banner .cookie-banner__inner {',
    '  max-width: 1200px;',
    '  margin: 0 auto;',
    '  padding: 1.25rem 2rem;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 2rem;',
    '}',
    '#cookie-banner .cookie-banner__text {',
    '  flex: 1 1 auto;',
    '  max-width: 60%;',
    '}',
    '#cookie-banner .cookie-banner__title {',
    '  font-weight: 700;',
    '  font-size: 1rem;',
    '  line-height: 1.3;',
    '  margin: 0 0 0.4rem;',
    '  color: #FFFFFF;',
    '}',
    '#cookie-banner .cookie-banner__body {',
    '  margin: 0;',
    '  font-size: 0.875rem;',
    '  line-height: 1.55;',
    '  color: rgba(220, 234, 232, 0.85);',
    '}',
    '#cookie-banner .cookie-banner__body a {',
    '  color: #D5FF4D;',
    '  text-decoration: none;',
    '}',
    '#cookie-banner .cookie-banner__body a:hover,',
    '#cookie-banner .cookie-banner__body a:focus {',
    '  text-decoration: underline;',
    '}',
    '#cookie-banner .cookie-banner__buttons {',
    '  display: flex;',
    '  gap: 0.75rem;',
    '  flex-shrink: 0;',
    '}',
    '#cookie-banner .cookie-banner__btn {',
    '  border-radius: 4px;',
    '  padding: 0.7rem 1.4rem;',
    '  font-size: 0.85rem;',
    '  font-weight: 700;',
    '  cursor: pointer;',
    '  font-family: inherit;',
    '  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;',
    '  border: 1.5px solid transparent;',
    '  white-space: nowrap;',
    '  line-height: 1.2;',
    '}',
    '#cookie-banner .cookie-banner__btn--primary {',
    '  background: #D5FF4D;',
    '  color: #0D1B2A;',
    '  border-color: #D5FF4D;',
    '}',
    '#cookie-banner .cookie-banner__btn--primary:hover,',
    '#cookie-banner .cookie-banner__btn--primary:focus {',
    '  background: #c2eb3a;',
    '  border-color: #c2eb3a;',
    '}',
    '#cookie-banner .cookie-banner__btn--secondary {',
    '  background: transparent;',
    '  color: #D5FF4D;',
    '  border-color: #D5FF4D;',
    '}',
    '#cookie-banner .cookie-banner__btn--secondary:hover,',
    '#cookie-banner .cookie-banner__btn--secondary:focus {',
    '  background: rgba(213, 255, 77, 0.1);',
    '}',
    '@media (max-width: 768px) {',
    '  #cookie-banner .cookie-banner__inner {',
    '    flex-direction: column;',
    '    align-items: stretch;',
    '    padding: 1rem 1.25rem;',
    '    gap: 1rem;',
    '  }',
    '  #cookie-banner .cookie-banner__text {',
    '    max-width: 100%;',
    '  }',
    '  #cookie-banner .cookie-banner__buttons {',
    '    flex-direction: column;',
    '    width: 100%;',
    '  }',
    '  #cookie-banner .cookie-banner__btn {',
    '    width: 100%;',
    '  }',
    '}'
  ].join('\n');

  var BANNER_HTML = [
    '<div id="cookie-banner" role="dialog" aria-label="Cookie consent">',
    '  <div class="cookie-banner__inner">',
    '    <div class="cookie-banner__text">',
    '      <p class="cookie-banner__title">Cookies on configurai.com</p>',
    '      <p class="cookie-banner__body">I use a small number of cookies to make this site work properly and, in future, to understand how people use it. You can accept or decline non-essential cookies at any time. Read the <a href="privacy-policy.html">privacy policy</a> for full detail.</p>',
    '    </div>',
    '    <div class="cookie-banner__buttons">',
    '      <button id="cookie-accept" class="cookie-banner__btn cookie-banner__btn--primary" type="button">Accept all</button>',
    '      <button id="cookie-reject" class="cookie-banner__btn cookie-banner__btn--secondary" type="button">Reject non-essential</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  function getStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStored(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      // localStorage unavailable. The banner will reappear next visit,
      // but the click was still honoured for this session.
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  function removeExisting() {
    var existing = document.getElementById(BANNER_ID);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function show() {
    injectStyle();
    removeExisting();

    var wrapper = document.createElement('div');
    wrapper.innerHTML = BANNER_HTML;
    var banner = wrapper.firstElementChild;
    document.body.appendChild(banner);

    var acceptBtn = banner.querySelector('#cookie-accept');
    var rejectBtn = banner.querySelector('#cookie-reject');

    acceptBtn.addEventListener('click', function () { choose('accepted'); });
    rejectBtn.addEventListener('click', function () { choose('rejected'); });

    // Wait one paint frame, then toggle the visible class so the
    // slide-up and fade-in animations actually run.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('is-visible');
      });
    });
  }

  function hide() {
    var banner = document.getElementById(BANNER_ID);
    if (!banner) return;
    banner.classList.remove('is-visible');
    // Remove from the DOM after the transition completes so it
    // does not linger as an empty fixed element.
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 400);
  }

  function choose(value) {
    setStored(value);
    hide();
    if (value === 'accepted' && typeof window.onCookieAccept === 'function') {
      try {
        window.onCookieAccept();
      } catch (e) {
        // Swallow integration errors so a bad analytics hook
        // cannot break the consent flow.
      }
    }
  }

  function init() {
    var stored = getStored();
    if (stored === 'accepted' || stored === 'rejected') {
      // Visitor has already chosen. Make sure no stale banner is
      // sitting in the DOM (e.g. a static fallback markup).
      removeExisting();
      return;
    }
    show();
  }

  // Public entry point for the footer Cookie settings link.
  window.openCookieSettings = function () {
    show();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
