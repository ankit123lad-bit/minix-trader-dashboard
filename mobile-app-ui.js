(function () {
  "use strict";

  var sectionLabels = {
    summarySection: "Dashboard Summary",
    individualSection: "Individual Performance",
    fullSummarySection: "Full Dashboard Summary"
  };

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function callIfAvailable(name) {
    if (typeof window[name] === "function") {
      var args = Array.prototype.slice.call(arguments, 1);
      return window[name].apply(window, args);
    }
    return undefined;
  }

  function sectionButton(sectionId) {
    var buttons = document.querySelectorAll(".dashboard-tab");
    for (var i = 0; i < buttons.length; i += 1) {
      var handler = buttons[i].getAttribute("onclick") || "";
      if (handler.indexOf("'" + sectionId + "'") !== -1 || handler.indexOf('"' + sectionId + '"') !== -1) return buttons[i];
    }
    return null;
  }

  function visibleSectionId() {
    var ids = ["summarySection", "individualSection", "fullSummarySection"];
    for (var i = 0; i < ids.length; i += 1) {
      var section = document.getElementById(ids[i]);
      if (!section) continue;
      var style = window.getComputedStyle(section);
      if (style.display !== "none") return ids[i];
    }
    return "summarySection";
  }

  function setActive(sectionId) {
    document.querySelectorAll(".minix-mobile-nav-btn[data-section]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-section") === sectionId);
    });
    var subtitle = document.getElementById("minixMobileSectionName");
    if (subtitle) subtitle.textContent = sectionLabels[sectionId] || "Live Dashboard";
  }

  function openSection(sectionId) {
    document.body.classList.remove("minix-mobile-show-filters");
    var desktopButton = sectionButton(sectionId);
    if (typeof window.showSection === "function") window.showSection(sectionId, desktopButton);
    else if (desktopButton) desktopButton.click();
    setActive(sectionId);
    closeMore();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleFilters() {
    closeMore();
    var section = document.getElementById(visibleSectionId());
    var filters = section ? section.querySelector(":scope > .filters") : null;
    if (!filters) return;
    var willOpen = !document.body.classList.contains("minix-mobile-show-filters");
    document.body.classList.toggle("minix-mobile-show-filters", willOpen);
    var button = document.getElementById("minixMobileFilterButton");
    if (button) button.classList.toggle("is-active", willOpen);
    if (willOpen) setTimeout(function () { filters.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
  }

  function closeMore() {
    var sheet = document.getElementById("minixMobileMoreSheet");
    var backdrop = document.getElementById("minixMobileMoreBackdrop");
    var moreButton = document.getElementById("minixMobileMoreButton");
    if (sheet) sheet.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    if (moreButton) moreButton.classList.remove("is-active");
    document.body.classList.remove("minix-mobile-more-open");
  }

  function toggleMore() {
    document.body.classList.remove("minix-mobile-show-filters");
    var filterButton = document.getElementById("minixMobileFilterButton");
    if (filterButton) filterButton.classList.remove("is-active");
    var sheet = document.getElementById("minixMobileMoreSheet");
    var backdrop = document.getElementById("minixMobileMoreBackdrop");
    var moreButton = document.getElementById("minixMobileMoreButton");
    if (!sheet || !backdrop) return;
    var open = !sheet.classList.contains("is-open");
    sheet.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    if (moreButton) moreButton.classList.toggle("is-active", open);
    document.body.classList.toggle("minix-mobile-more-open", open);
  }

  function runTool(action) {
    if (action === "admin") {
      if (typeof window.minixOpenAdminEntry === "function") window.minixOpenAdminEntry();
      else window.location.href = "admin.html";
    } else if (action === "today") callIfAvailable("minixShowTodayReport");
    else if (action === "history") callIfAvailable("minixOpenHistory");
    else if (action === "notify") callIfAvailable("minixEnableNotifications");
    else if (action === "test") callIfAvailable("minixTestNotification");
    else if (action === "alerts") callIfAvailable("openFundAlertModal");
    else if (action === "clear") callIfAvailable("clearAllFilters");
    else if (action === "logout") callIfAvailable("minixLogout");
    closeMore();
  }

  function todayLabel() {
    try {
      return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
    } catch (error) {
      return new Date().toLocaleDateString();
    }
  }

  function syncMirror(sourceId) {
    var source = document.getElementById(sourceId);
    var targets = document.querySelectorAll('[data-minix-mirror="' + sourceId + '"]');
    if (!source || !targets.length) return;
    var update = function () {
      var value = (source.textContent || "").trim() || "0";
      targets.forEach(function (target) {
        target.textContent = value;
        target.classList.toggle("positive", source.classList.contains("positive"));
        target.classList.toggle("negative", source.classList.contains("negative"));
        target.classList.toggle("warning", source.classList.contains("warning"));
        target.classList.toggle("neutral", source.classList.contains("neutral"));
      });
    };
    update();
    if (!source.__minixMobileMirrorObserver) {
      source.__minixMobileMirrorObserver = new MutationObserver(update);
      source.__minixMobileMirrorObserver.observe(source, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] });
    }
  }

  function moduleButton(icon, label, targetId) {
    return '<button type="button" class="minix-mobile-module-btn" data-minix-jump="' + targetId + '">' +
      '<span class="module-copy"><span class="module-icon">' + icon + '</span><span class="module-text">' + label + '</span></span>' +
      '<span class="module-arrow">›</span></button>';
  }

  function jumpToTarget(targetId) {
    if (targetId === "aiSegmentMISTable" && !document.getElementById(targetId)) callIfAvailable("renderSegmentMISReport");
    var target = document.getElementById(targetId);
    if (!target) return;
    var card = target.closest(".table-card,.kpi-grid,.weekly-grid") || target;
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function makeOverview(sectionId) {
    var section = document.getElementById(sectionId);
    if (!section || section.querySelector(":scope > .minix-mobile-overview")) return;
    var overview = document.createElement("div");
    overview.className = "minix-mobile-overview";

    if (sectionId === "summarySection") {
      overview.innerHTML =
        '<div class="minix-mobile-overview-head"><div><span class="minix-mobile-overview-kicker">' + todayLabel() + '</span><h2 class="minix-mobile-overview-title">Dashboard Summary</h2></div><span class="minix-mobile-live-badge">Live</span></div>' +
        '<div class="minix-mobile-overview-stats">' +
          '<article class="minix-mobile-overview-card cash"><span>Cash net P&amp;L</span><strong data-minix-mirror="cashTotalNet">₹0</strong><small>Cash performance</small></article>' +
          '<article class="minix-mobile-overview-card fno"><span>FNO net P&amp;L</span><strong data-minix-mirror="fnoTotalNet">₹0</strong><small>FNO performance</small></article>' +
          '<article class="minix-mobile-overview-card mcx"><span>MCX net P&amp;L</span><strong data-minix-mirror="mcxTotalNet">₹0</strong><small>MCX performance</small></article>' +
          '<article class="minix-mobile-overview-card total"><span>Total net P&amp;L</span><strong data-minix-mirror="totalNet">₹0</strong><small><span data-minix-mirror="positiveDays">0</span> positive days</small></article>' +
        '</div>' +
        '<div class="minix-mobile-module-title"><strong>All summary modules</strong><span>Tap to open</span></div>' +
        '<div class="minix-mobile-module-list">' +
          moduleButton("📅", "Weekly Net P&amp;L Summary", "weeklyNetCards") +
          moduleButton("💸", "FNO, Cash, MCX &amp; Total Charges", "fnoChargesTotal") +
          moduleButton("🏆", "Weekly Top / Worst Performance", "topWeekly") +
          moduleButton("📆", "Monthly Top / Worst Performance", "topMonthly") +
          moduleButton("🎯", "Win Ratio / Accuracy Summary", "winRatio") +
        '</div>' +
        '<p class="minix-mobile-overview-note">Filters ઉપરના ⚙ buttonથી ખુલશે. નીચે scroll કરતાં HTMLના બધા 72 KPI cards અને દરેક table સંપૂર્ણ મળશે.</p>';
      section.insertBefore(overview, section.firstChild);
      ["cashTotalNet", "fnoTotalNet", "mcxTotalNet", "totalNet", "positiveDays"].forEach(syncMirror);
    } else if (sectionId === "individualSection") {
      overview.innerHTML =
        '<div class="minix-mobile-overview-head"><div><span class="minix-mobile-overview-kicker">Trader view</span><h2 class="minix-mobile-overview-title">Individual Performance</h2></div><span class="minix-mobile-live-badge">Live</span></div>' +
        '<div class="minix-mobile-profile-preview"><div class="minix-mobile-profile-avatar" id="minixMobileProfileAvatar">T</div><div class="minix-mobile-profile-copy"><strong data-minix-mirror="traderProfileName">Select Trader</strong><div class="minix-mobile-profile-pills"><span class="minix-mobile-profile-pill">Day <b data-minix-mirror="traderProfileDay">₹0</b></span><span class="minix-mobile-profile-pill">MTD <b data-minix-mirror="traderProfileMtd">₹0</b></span><span class="minix-mobile-profile-pill">Win <b data-minix-mirror="traderProfileWin">0%</b></span></div></div></div>' +
        '<div class="minix-mobile-module-title"><strong>All individual reports</strong><span>Nothing removed</span></div>' +
        '<div class="minix-mobile-module-list">' +
          moduleButton("🏆", "Trader Performance Summary", "individualPerformanceTable") +
          moduleButton("🟢", "Risk Utilization Monitoring", "riskUtilizationTable") +
          moduleButton("🎯", "Accuracy / Win Ratio", "accuracyTable") +
          moduleButton("📊", "Trader Analytics Professional", "analyticsTable") +
          moduleButton("💸", "Month-wise Charges", "monthWiseChargesTable") +
          moduleButton("📋", "All Traders Date-wise Summary", "allTradersDateWiseTable") +
          moduleButton("📈", "Segment Wise MIS Report", "aiSegmentMISTable") +
          moduleButton("💰", "Total Capital Utilization", "capitalUtilizationTable") +
        '</div>' +
        '<p class="minix-mobile-overview-note">Trader, researcher, portfolio અને date filters ઉપરના ⚙ buttonથી ખુલશે.</p>';
      section.insertBefore(overview, section.firstChild);
      ["traderProfileName", "traderProfileDay", "traderProfileMtd", "traderProfileWin"].forEach(syncMirror);
      var sourceImage = document.getElementById("traderProfileImg");
      var avatar = document.getElementById("minixMobileProfileAvatar");
      var updateAvatar = function () {
        if (!sourceImage || !avatar) return;
        var src = sourceImage.getAttribute("src") || "";
        if (src) avatar.innerHTML = '<img src="' + src.replace(/"/g, "&quot;") + '" alt="Trader photo">';
        else {
          var name = (document.getElementById("traderProfileName") || {}).textContent || "T";
          avatar.textContent = name.trim().charAt(0).toUpperCase() || "T";
        }
      };
      updateAvatar();
      if (sourceImage) new MutationObserver(updateAvatar).observe(sourceImage, { attributes: true, attributeFilter: ["src"] });
    } else if (sectionId === "fullSummarySection") {
      overview.innerHTML =
        '<div class="minix-mobile-overview-head"><div><span class="minix-mobile-overview-kicker">Executive view</span><h2 class="minix-mobile-overview-title">Full Dashboard Summary</h2></div><span class="minix-mobile-live-badge">Live</span></div>' +
        '<div class="minix-mobile-overview-stats">' +
          '<article class="minix-mobile-overview-card total"><span>Total net P&amp;L</span><strong data-minix-mirror="totalNet">₹0</strong><small>All traders</small></article>' +
          '<article class="minix-mobile-overview-card fno"><span>Total charges</span><strong data-minix-mirror="chargesTotalCard">₹0</strong><small>Statutory breakup</small></article>' +
        '</div>' +
        '<div class="minix-mobile-module-title"><strong>All full reports</strong><span>Tap to open</span></div>' +
        '<div class="minix-mobile-module-list">' +
          moduleButton("📌", "FY / Demat / Month Summary", "fullFyDematMonthSummaryTable") +
          moduleButton("🏆", "Trader Performance Summary", "fullTraderPerformanceTable") +
          moduleButton("💸", "Charges &amp; Statutory Breakdown", "fullTraderChargesTable") +
          moduleButton("🏁", "Fintech vs Lokesh Jainam / SMC Comparison", "fintechLokeshComparisonTable") +
        '</div>' +
        '<p class="minix-mobile-overview-note">Financial year, company અને month filters ઉપરના ⚙ buttonથી ખુલશે. Expand, sort અને government-charge details યથાવત છે.</p>';
      section.insertBefore(overview, section.firstChild);
      ["totalNet", "chargesTotalCard"].forEach(syncMirror);
    }

    overview.querySelectorAll("[data-minix-jump]").forEach(function (button) {
      button.addEventListener("click", function () { jumpToTarget(button.getAttribute("data-minix-jump")); });
    });
  }

  function buildAllOverviews() {
    makeOverview("summarySection");
    makeOverview("individualSection");
    makeOverview("fullSummarySection");
  }

  function buildMobileUi() {
    if (document.getElementById("minixMobileAppBar")) return;

    var appBar = document.createElement("header");
    appBar.id = "minixMobileAppBar";
    appBar.setAttribute("aria-label", "Minix mobile app header");
    appBar.innerHTML =
      '<div class="minix-mobile-brand">' +
        '<div class="minix-mobile-logo" aria-hidden="true">M</div>' +
        '<div class="minix-mobile-brand-copy"><strong>MINIX Trader</strong><span id="minixMobileSectionName">Dashboard Summary</span></div>' +
      '</div>' +
      '<div class="minix-mobile-head-actions">' +
        '<button type="button" id="minixMobileFilterButton" class="minix-mobile-icon-btn" aria-label="Show filters">⚙</button>' +
        '<button type="button" id="minixMobileAlertButton" class="minix-mobile-icon-btn" aria-label="Fund transfer alerts">🔔</button>' +
      '</div>';

    var nav = document.createElement("nav");
    nav.id = "minixMobileBottomNav";
    nav.setAttribute("aria-label", "Mobile dashboard navigation");
    nav.innerHTML =
      '<button type="button" class="minix-mobile-nav-btn is-active" data-section="summarySection"><span class="nav-icon">⌂</span><span class="nav-label">Summary</span></button>' +
      '<button type="button" class="minix-mobile-nav-btn" data-section="individualSection"><span class="nav-icon">♙</span><span class="nav-label">Individual</span></button>' +
      '<button type="button" class="minix-mobile-nav-btn" data-section="fullSummarySection"><span class="nav-icon">▤</span><span class="nav-label">Full Report</span></button>' +
      '<button type="button" id="minixMobileMoreButton" class="minix-mobile-nav-btn"><span class="nav-icon">☰</span><span class="nav-label">More</span></button>';

    var backdrop = document.createElement("div");
    backdrop.id = "minixMobileMoreBackdrop";
    backdrop.setAttribute("aria-hidden", "true");

    var sheet = document.createElement("aside");
    sheet.id = "minixMobileMoreSheet";
    sheet.setAttribute("aria-label", "More dashboard tools");
    sheet.innerHTML =
      '<div class="minix-mobile-sheet-head"><div><strong>More &amp; Tools</strong><div style="color:#94a3b8;font-size:11px;margin-top:3px">All existing dashboard actions</div></div><button type="button" id="minixMobileMoreClose" class="minix-mobile-icon-btn" aria-label="Close">✕</button></div>' +
      '<div class="minix-mobile-sheet-grid">' +
        '<button type="button" class="minix-mobile-tool-btn" data-tool="admin"><span>🔐</span><span>Admin Entry</span></button>' +
        '<button type="button" class="minix-mobile-tool-btn" data-tool="today"><span>📊</span><span>Today’s Report</span></button>' +
        '<button type="button" class="minix-mobile-tool-btn" data-tool="history"><span>📚</span><span>Report History</span></button>' +
        '<button type="button" class="minix-mobile-tool-btn" data-tool="notify"><span>🔔</span><span>Enable Notifications</span></button>' +
        '<button type="button" class="minix-mobile-tool-btn" data-tool="test"><span>🧪</span><span>Test Notification</span></button>' +
        '<button type="button" class="minix-mobile-tool-btn" data-tool="alerts"><span>💰</span><span>Fund Alerts</span></button>' +
        '<button type="button" class="minix-mobile-tool-btn" data-tool="clear"><span>🧹</span><span>Clear Filters</span></button>' +
        '<button type="button" class="minix-mobile-tool-btn danger" data-tool="logout"><span>↪</span><span>Logout</span></button>' +
      '</div>';

    document.body.appendChild(appBar);
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    document.body.appendChild(nav);

    document.getElementById("minixMobileFilterButton").addEventListener("click", toggleFilters);
    document.getElementById("minixMobileAlertButton").addEventListener("click", function () { callIfAvailable("openFundAlertModal"); });
    document.getElementById("minixMobileMoreButton").addEventListener("click", toggleMore);
    document.getElementById("minixMobileMoreClose").addEventListener("click", closeMore);
    backdrop.addEventListener("click", closeMore);

    nav.querySelectorAll("[data-section]").forEach(function (button) {
      button.addEventListener("click", function () { openSection(button.getAttribute("data-section")); });
    });
    sheet.querySelectorAll("[data-tool]").forEach(function (button) {
      button.addEventListener("click", function () { runTool(button.getAttribute("data-tool")); });
    });

    setActive(visibleSectionId());
    buildAllOverviews();
  }

  function resizeVisibleCharts() {
    if (!window.Plotly || !window.Plotly.Plots || typeof window.Plotly.Plots.resize !== "function") return;
    document.querySelectorAll(".js-plotly-plot").forEach(function (chart) {
      if (chart.offsetParent !== null) {
        try { window.Plotly.Plots.resize(chart); } catch (error) {}
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildMobileUi();
    var oldShowSection = window.showSection;
    if (typeof oldShowSection === "function" && !oldShowSection.__minixMobileWrapped) {
      var wrapped = function (sectionId, button) {
        var result = oldShowSection.apply(this, arguments);
        if (sectionLabels[sectionId]) setActive(sectionId);
        setTimeout(resizeVisibleCharts, 140);
        return result;
      };
      wrapped.__minixMobileWrapped = true;
      window.showSection = wrapped;
    }
  });

  window.addEventListener("resize", function () {
    if (!isMobile()) closeMore();
    setTimeout(resizeVisibleCharts, 120);
  }, { passive: true });
  window.addEventListener("orientationchange", function () { setTimeout(resizeVisibleCharts, 220); }, { passive: true });
})();
