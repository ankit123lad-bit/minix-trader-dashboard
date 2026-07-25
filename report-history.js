(function () {
  "use strict";

  var TABLE = "minix_daily_trader_reports";
  var client = null;
  var allRows = [];
  var allEdits = [];
  var loading = false;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function currentUser() {
    try {
      return JSON.parse(localStorage.getItem("minixUser") || "{}");
    } catch (_) {
      return {};
    }
  }

  function isAdmin() {
    return /^admin$/i.test(String(currentUser().role || "").trim());
  }

  function number(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(number(value));
  }

  function displayDate(value) {
    if (!value) return "—";
    var parts = String(value).slice(0, 10).split("-");
    return parts.length === 3 ? parts[2] + "-" + parts[1] + "-" + parts[0] : escapeHtml(value);
  }

  function submittedAt(value) {
    if (!value) return "—";
    var d = new Date(value);
    return Number.isNaN(d.getTime())
      ? escapeHtml(value)
      : d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  }

  function statusLabel(value) {
    var labels = {
      TRADED: "Traded",
      NO_TRADE: "No Trade",
      SICK_LEAVE: "Sick Leave",
      ON_LEAVE: "On Leave"
    };
    return labels[String(value || "").toUpperCase()] || String(value || "—");
  }

  function getClient() {
    if (client) return client;
    var config = window.MINIX_CONFIG || {};
    if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error("Supabase configuration is not available.");
    }
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return client;
  }

  async function loadAllReports() {
    var db = getClient();
    var rows = [];
    var pageSize = 1000;
    var from = 0;

    while (true) {
      var result = await db
        .from(TABLE)
        .select("*")
        .order("report_date", { ascending: false })
        .order("trader_name", { ascending: true })
        .range(from, from + pageSize - 1);

      if (result.error) throw result.error;
      var page = result.data || [];
      rows = rows.concat(page);
      if (page.length < pageSize) break;
      from += pageSize;
    }
    return rows;
  }

  async function loadAllEdits() {
    var db = getClient();
    var rows = [];
    var pageSize = 1000;
    var from = 0;
    while (true) {
      var result = await db
        .from("minix_daily_report_edits")
        .select("*")
        .order("edited_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (result.error) {
        if (/does not exist|schema cache/i.test(String(result.error.message || ""))) return [];
        throw result.error;
      }
      var page = result.data || [];
      rows = rows.concat(page);
      if (page.length < pageSize) break;
      from += pageSize;
    }
    return rows;
  }

  function injectStyles() {
    if (document.getElementById("minixReportHistoryStyles")) return;
    var style = document.createElement("style");
    style.id = "minixReportHistoryStyles";
    style.textContent =
      "#minixReportHistory{color:#e8f2ff;font-family:inherit}" +
      "#minixReportHistory .rh-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}" +
      "#minixReportHistory h2{margin:0;color:#7db7ff}" +
      "#minixReportHistory .rh-filters{display:grid;grid-template-columns:180px minmax(220px,1fr) auto;gap:10px;margin-bottom:14px}" +
      "#minixReportHistory input{width:100%;box-sizing:border-box;background:#081829;color:#fff;border:1px solid #31506e;border-radius:9px;padding:10px}" +
      "#minixReportHistory button,.minix-history-btn{border:1px solid #2e8bd8;border-radius:9px;padding:9px 13px;background:#1268ad;color:#fff;cursor:pointer;font-weight:700}" +
      "#minixReportHistory .rh-kpis{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:10px;margin-bottom:14px}" +
      "#minixReportHistory .rh-kpi{background:#091a2d;border:1px solid #27445f;border-radius:12px;padding:12px}" +
      "#minixReportHistory .rh-kpi small{display:block;color:#9fc8ef;margin-bottom:5px}" +
      "#minixReportHistory .rh-kpi strong{font-size:21px;color:#36d98b}" +
      "#minixReportHistory .rh-section{margin:18px 0 8px;color:#7db7ff}" +
      "#minixReportHistory .rh-table-wrap{overflow:auto;max-height:390px;border:1px solid #27445f;border-radius:10px}" +
      "#minixReportHistory table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:13px}" +
      "#minixReportHistory th{position:sticky;top:0;background:#102944;color:#9fd0ff;z-index:1}" +
      "#minixReportHistory th,#minixReportHistory td{padding:9px;border-bottom:1px solid #21394f;text-align:left}" +
      "#minixReportHistory tr:hover td{background:#0d2238}" +
      "#minixReportHistory .rh-edited{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:999px;background:#78350f;color:#fde68a;font-weight:800;font-size:11px}" +
      "#minixReportHistory .rh-empty{text-align:center;padding:24px;color:#9eb4c8}" +
      "@media(max-width:760px){#minixReportHistory .rh-filters{grid-template-columns:1fr}#minixReportHistory .rh-kpis{grid-template-columns:repeat(2,1fr)}}" +
      "@media(max-width:430px){#minixReportHistory .rh-kpis{grid-template-columns:1fr}}";
    document.head.appendChild(style);
  }

  function filteredRows() {
    var dateInput = document.getElementById("minixHistoryDate");
    var nameInput = document.getElementById("minixHistoryName");
    var date = dateInput ? dateInput.value : "";
    var name = nameInput ? nameInput.value.trim().toLowerCase() : "";

    return allRows.filter(function (row) {
      var dateOk = !date || String(row.report_date || "").slice(0, 10) === date;
      var nameOk = !name || String(row.trader_name || "").toLowerCase().includes(name);
      return dateOk && nameOk;
    });
  }

  function render() {
    var root = document.getElementById("minixReportHistory");
    if (!root) return;
    var rows = filteredRows();
    var traderMap = {};
    var dates = {};
    var traded = 0;
    var editMap = {};
    allEdits.forEach(function (edit) {
      var key = String(edit.report_date || "").slice(0, 10) + "|" + String(edit.trader_name || "").trim().toLowerCase();
      if (!editMap[key]) editMap[key] = [];
      editMap[key].push(edit);
    });

    rows.forEach(function (row) {
      var name = String(row.trader_name || "Unknown");
      var date = String(row.report_date || "").slice(0, 10);
      dates[date] = true;
      if (String(row.today_status || row.status || "").toUpperCase() === "TRADED") traded++;
      if (!traderMap[name]) traderMap[name] = { dates: {}, first: date, last: date };
      traderMap[name].dates[date] = true;
      if (date && (!traderMap[name].first || date < traderMap[name].first)) traderMap[name].first = date;
      if (date && (!traderMap[name].last || date > traderMap[name].last)) traderMap[name].last = date;
    });

    var summaries = Object.keys(traderMap)
      .sort(function (a, b) { return a.localeCompare(b); })
      .map(function (name) {
        var item = traderMap[name];
        return "<tr><td>" + escapeHtml(name) + "</td><td>" +
          Object.keys(item.dates).length + "</td><td>" + displayDate(item.first) +
          "</td><td>" + displayDate(item.last) + "</td></tr>";
      }).join("");

    var detail = rows.map(function (row) {
      var fno = number(row.fno_total_fund);
      var cash = number(row.cash_total_fund);
      var mcx = number(row.mcx_total_fund);
      var total = row.total_margin == null ? fno + cash + mcx : number(row.total_margin);
      var gross = number(row.fno_gross) + number(row.cash_gross) + number(row.mcx_gross);
      var charges = number(row.fno_charges) + number(row.cash_charges) + number(row.mcx_charges);
      var net = gross - charges;
      var editKey = String(row.report_date || "").slice(0, 10) + "|" + String(row.trader_name || "").trim().toLowerCase();
      var edits = editMap[editKey] || [];
      var editBadge = edits.length ? '<span class="rh-edited">Edited ' + edits.length + ' time' + (edits.length === 1 ? "" : "s") + "</span>" : "";
      return "<tr>" +
        "<td>" + displayDate(row.report_date) + "</td>" +
        "<td>" + escapeHtml(row.trader_name || "—") + editBadge + "</td>" +
        "<td>" + escapeHtml(statusLabel(row.today_status || row.status)) + "</td>" +
        "<td>" + submittedAt(row.created_at || row.updated_at) + "</td>" +
        "<td>" + money(fno) + "</td><td>" + money(cash) + "</td><td>" + money(mcx) + "</td>" +
        "<td>" + money(total) + "</td><td>" + money(row.margin_utilized) + "</td>" +
        "<td>" + money(gross) + "</td><td>" + money(charges) + "</td><td>" + money(net) + "</td>" +
        "<td>" + escapeHtml(row.reason || row.no_trade_reason || "—") + "</td></tr>";
    }).join("");

    document.getElementById("minixHistoryKpis").innerHTML =
      '<div class="rh-kpi"><small>Filtered Submissions</small><strong>' + rows.length + "</strong></div>" +
      '<div class="rh-kpi"><small>Traders</small><strong>' + Object.keys(traderMap).length + "</strong></div>" +
      '<div class="rh-kpi"><small>Report Dates</small><strong>' + Object.keys(dates).filter(Boolean).length + "</strong></div>" +
      '<div class="rh-kpi"><small>Traded Reports</small><strong>' + traded + "</strong></div>";

    document.getElementById("minixHistorySummaryBody").innerHTML =
      summaries || '<tr><td colspan="4" class="rh-empty">No reports found.</td></tr>';
    document.getElementById("minixHistoryDetailBody").innerHTML =
      detail || '<tr><td colspan="13" class="rh-empty">No reports found.</td></tr>';

    var visibleKeys = {};
    rows.forEach(function (row) {
      visibleKeys[String(row.report_date || "").slice(0, 10) + "|" + String(row.trader_name || "").trim().toLowerCase()] = true;
    });
    var auditRows = allEdits.filter(function (edit) {
      var key = String(edit.report_date || "").slice(0, 10) + "|" + String(edit.trader_name || "").trim().toLowerCase();
      return visibleKeys[key];
    }).map(function (edit) {
      var oldData = edit.old_data || {};
      var newData = edit.new_data || {};
      function changed(field) {
        return number(oldData[field]) !== number(newData[field]);
      }
      var fields = [
        ["Total Fund", "total_margin"],
        ["Utilized", "margin_utilized"],
        ["F&O Gross", "fno_gross"],
        ["F&O Charges", "fno_charges"],
        ["Cash Gross", "cash_gross"],
        ["Cash Charges", "cash_charges"],
        ["MCX Gross", "mcx_gross"],
        ["MCX Charges", "mcx_charges"]
      ];
      var changes = fields.filter(function (item) { return changed(item[1]); }).map(function (item) {
        return escapeHtml(item[0]) + ": " + money(oldData[item[1]]) + " → " + money(newData[item[1]]);
      });
      if (String(oldData.today_status || "") !== String(newData.today_status || "")) {
        changes.unshift("Status: " + escapeHtml(statusLabel(oldData.today_status)) + " → " + escapeHtml(statusLabel(newData.today_status)));
      }
      if (String(oldData.reason || "") !== String(newData.reason || "")) {
        changes.push("Reason: " + escapeHtml(oldData.reason || "—") + " → " + escapeHtml(newData.reason || "—"));
      }
      return "<tr><td>" + displayDate(edit.report_date) + "</td><td>" +
        escapeHtml(edit.trader_name || "—") + "</td><td>" + submittedAt(edit.edited_at) +
        "</td><td>" + escapeHtml(edit.edited_by || newData.submitted_by || "—") +
        "</td><td style=\"white-space:normal;min-width:420px\">" +
        (changes.length ? changes.join("<br>") : "Submitted time/details updated") + "</td></tr>";
    }).join("");
    document.getElementById("minixHistoryAuditBody").innerHTML =
      auditRows || '<tr><td colspan="5" class="rh-empty">No edited reports found.</td></tr>';
  }

  function clearFilters() {
    var dateInput = document.getElementById("minixHistoryDate");
    var nameInput = document.getElementById("minixHistoryName");
    if (dateInput) dateInput.value = "";
    if (nameInput) nameInput.value = "";
    render();
  }

  function modalHtml(message) {
    return '<div id="minixReportHistory">' +
      '<div class="rh-head"><h2>📚 Daily Report History</h2><button type="button" onclick="minixClosePushModal()">Close</button></div>' +
      (message ? '<div class="rh-empty">' + escapeHtml(message) + "</div>" :
      '<div class="rh-filters">' +
        '<input id="minixHistoryDate" type="date" aria-label="Search by date">' +
        '<input id="minixHistoryName" type="search" placeholder="Search trader name..." aria-label="Search trader name">' +
        '<button type="button" onclick="minixClearReportHistoryFilters()">Clear Filters</button>' +
      "</div>" +
      '<div id="minixHistoryKpis" class="rh-kpis"></div>' +
      '<h3 class="rh-section">Trader-wise Submitted Days</h3>' +
      '<div class="rh-table-wrap"><table><thead><tr><th>Trader Name</th><th>Submitted Days</th><th>First Report</th><th>Last Report</th></tr></thead><tbody id="minixHistorySummaryBody"></tbody></table></div>' +
      '<h3 class="rh-section">All Daily Reports</h3>' +
      '<div class="rh-table-wrap"><table><thead><tr><th>Date</th><th>Trader Name</th><th>Status</th><th>Submitted At</th><th>F&amp;O Fund</th><th>Cash Fund</th><th>MCX Fund</th><th>Total Fund</th><th>Utilized</th><th>Gross</th><th>Charges</th><th>Net P&amp;L</th><th>Reason</th></tr></thead><tbody id="minixHistoryDetailBody"></tbody></table></div>' +
      '<h3 class="rh-section">Edit Audit History (Original → Updated)</h3>' +
      '<div class="rh-table-wrap"><table><thead><tr><th>Report Date</th><th>Trader Name</th><th>Edited At</th><th>Edited By</th><th>Changes</th></tr></thead><tbody id="minixHistoryAuditBody"></tbody></table></div>') +
      "</div>";
  }

  async function openHistory() {
    if (!isAdmin()) {
      alert("Daily Report History is available only for Admin.");
      return;
    }
    if (loading) return;
    injectStyles();
    var modal = document.getElementById("minixPushModal");
    if (!modal) {
      alert("Dashboard modal is not available.");
      return;
    }
    modal.style.display = "flex";
    modal.innerHTML = '<div class="minix-push-overlay" style="width:min(96vw,1500px);max-height:92vh;overflow:auto">' +
      modalHtml("Loading report history...") + "</div>";
    loading = true;
    try {
      var loaded = await Promise.all([loadAllReports(), loadAllEdits()]);
      allRows = loaded[0];
      allEdits = loaded[1];
      modal.innerHTML = '<div class="minix-push-overlay" style="width:min(96vw,1500px);max-height:92vh;overflow:auto">' +
        modalHtml("") + "</div>";
      document.getElementById("minixHistoryDate").addEventListener("input", render);
      document.getElementById("minixHistoryName").addEventListener("input", render);
      render();
    } catch (error) {
      modal.innerHTML = '<div class="minix-push-overlay" style="width:min(96vw,900px)">' +
        modalHtml("Could not load history: " + (error.message || error)) + "</div>";
    } finally {
      loading = false;
    }
  }

  function syncAdminButton() {
    var actions = document.getElementById("minixHeaderActions");
    var button = document.getElementById("minixReportHistoryButton");
    if (!isAdmin()) {
      if (button) button.remove();
      return;
    }
    if (!actions || button) return;
    button = document.createElement("button");
    button.id = "minixReportHistoryButton";
    button.className = "minix-history-btn";
    button.type = "button";
    button.textContent = "📚 Daily Report History";
    button.addEventListener("click", openHistory);
    actions.appendChild(button);
  }

  window.minixOpenReportHistory = openHistory;
  window.minixRenderReportHistory = render;
  window.minixClearReportHistoryFilters = clearFilters;

  injectStyles();
  syncAdminButton();
  setInterval(syncAdminButton, 1500);
})();
