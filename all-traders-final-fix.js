(function () {
  'use strict';

  var currentTable = null;
  var resizeObserver = null;

  function cleanDuplicateControls(root) {
    if (!root || !root.parentNode) return;
    var parent=root.parentNode;
    parent.querySelectorAll(':scope > .minix-all-traders-nav').forEach(function(el){el.remove();});
    var toolbars=Array.prototype.slice.call(parent.querySelectorAll(':scope > .gpt-table-toolbar'));
    if(toolbars.length){
      var keep=toolbars[toolbars.length-1];
      toolbars.slice(0,-1).forEach(function(el){el.remove();});
      if(root.previousElementSibling!==keep)parent.insertBefore(keep,root);
    }
    var bars=Array.prototype.slice.call(parent.querySelectorAll(':scope > .minix-table-scroll-controls'));
    bars.slice(1).forEach(function(el){el.remove();});
    if(bars[0]&&toolbars.length&&bars[0].nextElementSibling!==toolbars[toolbars.length-1]){
      parent.insertBefore(bars[0],toolbars[toolbars.length-1]);
    }
  }

  function forceCleanTable(root,table){
    var head=table.querySelector('thead');
    if(head){
      head.style.setProperty('position','static','important');
      head.style.setProperty('top','auto','important');
      head.style.setProperty('transform','none','important');
    }
    table.querySelectorAll('thead th').forEach(function(th){
      th.style.setProperty('position','static','important');
      th.style.setProperty('top','auto','important');
      th.style.setProperty('transform','none','important');
      th.style.setProperty('background','#eef1f4','important');
      th.style.setProperty('color','#28313b','important');
      th.style.setProperty('height','44px','important');
      th.style.setProperty('line-height','20px','important');
      th.style.setProperty('overflow','hidden','important');
    });
    table.querySelectorAll('tbody td').forEach(function(td){
      td.style.setProperty('position','static','important');
      td.style.setProperty('top','auto','important');
      td.style.setProperty('transform','none','important');
    });
    var firstHead=table.querySelector('thead th:first-child');
    if(firstHead)firstHead.style.setProperty('background','#eef1f4','important');
  }

  function normalize() {
    var root = document.getElementById('allTradersDateWiseTable');
    if (!root) return;
    var table = root.querySelector('table');
    cleanDuplicateControls(root);

    if (table && table !== currentTable) {
      currentTable = table;
      root.scrollLeft = 0;
      root.scrollTop = 0;
      var utilizedHeader = table.querySelector('thead th.ai-utilized-col');
      if (utilizedHeader) {
        utilizedHeader.textContent = 'UTILIZED';
        utilizedHeader.setAttribute('title', 'Utilized');
      }
      forceCleanTable(root,table);
      if (resizeObserver) resizeObserver.disconnect();
      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(function () { forceCleanTable(root,table); });
        resizeObserver.observe(root);
        resizeObserver.observe(table);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalize);
  } else {
    normalize();
  }

  new MutationObserver(normalize).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', normalize, { passive: true });
})();
