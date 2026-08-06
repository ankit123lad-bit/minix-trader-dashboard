(function () {
  "use strict";

  var deferredPrompt = null;
  var installButton = null;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function isMobile() {
    return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function addStyles() {
    if (document.getElementById("minix-pwa-install-style")) return;
    var style = document.createElement("style");
    style.id = "minix-pwa-install-style";
    style.textContent =
      "#minixPwaInstallButton{position:fixed;right:14px;bottom:100px;z-index:99991;border:1px solid #60a5fa;border-radius:14px;padding:11px 15px;background:#2563eb;color:#fff;font:800 14px Arial,sans-serif;box-shadow:0 14px 34px rgba(0,0,0,.38);cursor:pointer}" +
      "#minixPwaInstallButton:hover{background:#1d4ed8}" +
      ".minix-pwa-help{position:fixed;inset:0;z-index:1000000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.88)}" +
      ".minix-pwa-help-card{width:min(520px,100%);border:1px solid #475569;border-radius:18px;padding:20px;background:#111827;color:#fff;box-shadow:0 28px 80px rgba(0,0,0,.55);font-family:Arial,sans-serif}" +
      ".minix-pwa-help-card h2{margin:0 0 12px}.minix-pwa-help-card p{color:#cbd5e1;line-height:1.55}.minix-pwa-help-card ol{padding-left:22px;line-height:1.7}.minix-pwa-help-card button{width:100%;margin-top:12px;border:0;border-radius:11px;padding:11px;background:#475569;color:#fff;font-weight:800;cursor:pointer}" +
      "@media(max-width:600px){#minixPwaInstallButton{right:10px;bottom:88px;padding:10px 13px;font-size:13px}}";
    document.head.appendChild(style);
  }

  function closeHelp() {
    var help = document.getElementById("minixPwaHelp");
    if (help) help.remove();
  }

  function showHelp() {
    closeHelp();
    var overlay = document.createElement("div");
    overlay.id = "minixPwaHelp";
    overlay.className = "minix-pwa-help";
    var steps = isIOS()
      ? "<ol><li>આ page Safari માં ખોલો.</li><li>નીચેનું Share button દબાવો.</li><li><b>Add to Home Screen</b> પસંદ કરો.</li><li><b>Add</b> દબાવો.</li></ol>"
      : "<ol><li>Browser menu (⋮) ખોલો.</li><li><b>Install app</b> અથવા <b>Add to Home screen</b> પસંદ કરો.</li><li><b>Install</b> દબાવો.</li></ol>";
    overlay.innerHTML = '<div class="minix-pwa-help-card"><h2>📲 Minix App Install</h2><p>Dashboard mobileમાં app જેવું full-screen ખોલવા માટે:</p>' + steps + '<button type="button" id="minixPwaHelpClose">Close</button></div>';
    document.body.appendChild(overlay);
    document.getElementById("minixPwaHelpClose").addEventListener("click", closeHelp);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) closeHelp(); });
  }

  function ensureButton() {
    if (isStandalone() || installButton || !isMobile()) return;
    addStyles();
    installButton = document.createElement("button");
    installButton.type = "button";
    installButton.id = "minixPwaInstallButton";
    installButton.textContent = "📲 Install Minix App";
    installButton.addEventListener("click", async function () {
      if (!deferredPrompt) {
        showHelp();
        return;
      }
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (error) {}
      deferredPrompt = null;
      if (installButton) installButton.style.display = "none";
    });
    document.body.appendChild(installButton);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/service-worker.js", { updateViaCache: "none" })
        .then(function (registration) { registration.update().catch(function () {}); })
        .catch(function (error) { console.warn("Minix PWA service worker registration failed:", error); });
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    ensureButton();
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    if (installButton) installButton.remove();
    installButton = null;
  });

  document.addEventListener("DOMContentLoaded", function () {
    if (!isStandalone() && isMobile()) {
      setTimeout(ensureButton, 700);
    }
  });
})();
(function(){
  if(window.innerWidth<=900 && !/desktop=1/.test(location.search) && !/mobile\.html$/i.test(location.pathname)){
    location.replace('mobile.html');
  }
})();
