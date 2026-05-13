/*
 * AgentAegis cookie consent banner.
 *
 * Lightweight GDPR-friendly banner that integrates with Google Consent Mode v2.
 * Default consent is DENIED (set in the inline gtag snippet on every page).
 * On Accept → analytics_storage = granted, GA4 starts firing.
 * On Reject → analytics_storage stays denied, no cookies, no client_id sent.
 *
 * Choice persists in localStorage (key: "aegis-consent-v1"). The banner is
 * not shown again after a choice is made until the key is cleared.
 *
 * No third-party deps. No remote requests. ~2 KB minified.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "aegis-consent-v1";
  var ALLOWED_VALUES = { granted: 1, denied: 1 };

  // gtag is loaded by the inline GA snippet on every page. Provide a safe
  // shim so this script doesn't error on pages without GA4.
  function gtagSafe() {
    if (typeof window.gtag === "function") {
      window.gtag.apply(null, arguments);
    }
  }

  function applyConsent(state) {
    gtagSafe("consent", "update", {
      analytics_storage: state,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }

  function persist(state) {
    try {
      localStorage.setItem(STORAGE_KEY, state);
    } catch (e) {
      /* ignore — Safari private mode etc */
    }
  }

  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return ALLOWED_VALUES[v] ? v : null;
    } catch (e) {
      return null;
    }
  }

  // Inject CSS once.
  function injectStyles() {
    if (document.getElementById("aegis-consent-styles")) return;
    var style = document.createElement("style");
    style.id = "aegis-consent-styles";
    style.textContent = [
      ".aegis-consent-banner {",
      "  position: fixed;",
      "  left: 16px; right: 16px; bottom: 16px;",
      "  max-width: 720px;",
      "  margin: 0 auto;",
      "  background: #131826;",
      "  border: 1px solid #1f2740;",
      "  border-radius: 12px;",
      "  box-shadow: 0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(91,141,239,0.08);",
      "  padding: 16px 20px;",
      "  z-index: 99999;",
      "  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;",
      "  color: #aab4cc;",
      "  font-size: 13.5px;",
      "  line-height: 1.55;",
      "  animation: aegis-consent-in 0.24s ease-out;",
      "}",
      "@keyframes aegis-consent-in {",
      "  from { opacity: 0; transform: translateY(8px); }",
      "  to   { opacity: 1; transform: translateY(0); }",
      "}",
      ".aegis-consent-inner {",
      "  display: flex; gap: 16px; align-items: center; flex-wrap: wrap;",
      "}",
      ".aegis-consent-text { flex: 1 1 280px; min-width: 240px; }",
      ".aegis-consent-text strong { color: #ffffff; font-weight: 600; }",
      ".aegis-consent-text a {",
      "  color: #5b8def; text-decoration: none; border-bottom: 1px solid rgba(91,141,239,0.3);",
      "}",
      ".aegis-consent-text a:hover { color: #ffffff; border-bottom-color: #ffffff; }",
      ".aegis-consent-buttons { display: flex; gap: 8px; flex-shrink: 0; }",
      ".aegis-consent-btn {",
      "  font-family: inherit; font-size: 13px; font-weight: 600;",
      "  padding: 9px 18px; border-radius: 8px; cursor: pointer;",
      "  border: 1px solid #1f2740; background: transparent; color: #aab4cc;",
      "  transition: all 0.15s ease-out;",
      "}",
      ".aegis-consent-btn:hover { color: #ffffff; border-color: #aab4cc; }",
      ".aegis-consent-btn:focus-visible { outline: 2px solid #5b8def; outline-offset: 2px; }",
      ".aegis-consent-btn-accept {",
      "  background: #5b8def; color: #ffffff; border-color: #5b8def;",
      "}",
      ".aegis-consent-btn-accept:hover { background: #4977d8; border-color: #4977d8; color: #ffffff; }",
      "@media (max-width: 520px) {",
      "  .aegis-consent-banner { left: 8px; right: 8px; bottom: 8px; padding: 14px 16px; }",
      "  .aegis-consent-buttons { width: 100%; }",
      "  .aegis-consent-btn { flex: 1; }",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function showBanner() {
    injectStyles();

    var banner = document.createElement("div");
    banner.className = "aegis-consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.setAttribute("aria-describedby", "aegis-consent-text");

    banner.innerHTML =
      '<div class="aegis-consent-inner">' +
      '  <div class="aegis-consent-text" id="aegis-consent-text">' +
      '    <strong>Cookies.</strong> We use Google Analytics to understand how AgentAegis is used. ' +
      '    IP addresses are anonymized. No advertising, no cross-site tracking, no data sold. ' +
      '  </div>' +
      '  <div class="aegis-consent-buttons">' +
      '    <button class="aegis-consent-btn" data-consent="denied" type="button">Reject</button>' +
      '    <button class="aegis-consent-btn aegis-consent-btn-accept" data-consent="granted" type="button">Accept</button>' +
      '  </div>' +
      '</div>';

    banner.addEventListener("click", function (e) {
      var target = e.target.closest("[data-consent]");
      if (!target) return;
      var choice = target.getAttribute("data-consent");
      if (!ALLOWED_VALUES[choice]) return;
      persist(choice);
      applyConsent(choice);
      banner.remove();
    });

    document.body.appendChild(banner);
  }

  function init() {
    var stored = readStored();
    if (stored === "granted") {
      applyConsent("granted");
      return;
    }
    if (stored === "denied") {
      applyConsent("denied");
      return;
    }
    // First visit — show the banner. Default consent stays "denied" until user picks.
    showBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose a tiny API so the user can revoke from the console / link later.
  window.AegisConsent = {
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      location.reload();
    },
    state: readStored
  };
})();
