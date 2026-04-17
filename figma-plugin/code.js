// Sloan Live — code.js
figma.showUI(__html__, { width: 300, height: 48 });

function getTargetPage(taskText) {
  const t = (taskText || '').toLowerCase();
  const map = [
    { keys: ['audit', 'image audit'], page: '01' },
    { keys: ['type', 'typography', 'font', 'grid', 'scale', 'hierarchy'], page: '02' },
    { keys: ['color', 'colour', 'palette', 'swatch'], page: '03' },
    { keys: ['layout', 'composition', 'spacing'], page: '04' },
    { keys: ['mirage direction', 'direction', 'brand'], page: '05' },
    { keys: ['mood', 'reference', 'inspiration'], page: '06' },
  ];
  for (const entry of map) {
    if (entry.keys.some(k => t.includes(k))) {
      const found = figma.root.children.find(p => p.name.includes(entry.page));
      if (found) return found;
    }
  }
  return figma.root.children[0];
}

async function runWithTheatre(code, delayMs) {
  delayMs = delayMs || 150;
  var delay = function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); };

  // Snapshot existing page children before running
  var before = {};
  for (var i = 0; i < figma.currentPage.children.length; i++) {
    before[figma.currentPage.children[i].id] = true;
  }

  // Run the code — no monkey patching
  var fn = new Function('return (async function(){' + code + '})()');
  await fn();

  // Find nodes that were added to the page
  var newNodes = figma.currentPage.children.filter(function(n) { return !before[n.id]; });

  // Theatre mode: animate children of each new node
  for (var ni = 0; ni < newNodes.length; ni++) {
    var root = newNodes[ni];
    figma.viewport.scrollAndZoomIntoView([root]);
    if (root.children && root.children.length > 0) {
      var children = root.children.slice();
      for (var ci = 0; ci < children.length; ci++) {
        try { children[ci].opacity = 0; } catch(e) {}
      }
      await delay(300);
      for (var ci2 = 0; ci2 < children.length; ci2++) {
        try {
          children[ci2].opacity = 1;
          await delay(delayMs);
        } catch(e) {}
      }
    }
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'EXECUTE_TASK') {
    const task = msg.task;
    if (!task || !task.figma_code) {
      figma.ui.postMessage({ type: 'TASK_DONE', id: task?.id, status: 'failed', result: 'No code' });
      return;
    }
    try {
      const page = getTargetPage(task.task || '');
      await figma.setCurrentPageAsync(page);
      figma.notify('Sloan is working — ' + page.name, { timeout: 60000 });
      await runWithTheatre(task.figma_code, 150);
      figma.notify('Ready for your review \u2713', { timeout: 4000 });
      figma.ui.postMessage({ type: 'TASK_DONE', id: task.id, status: 'complete', result: 'Done' });
    } catch (e) {
      figma.notify('Error: ' + String(e.message || e), { error: true });
      figma.ui.postMessage({ type: 'TASK_DONE', id: task?.id, status: 'failed', result: String(e.message || e) });
    }
  }
  if (msg.type === 'ERROR') {
    figma.notify('Plugin error: ' + String(msg.error), { error: true });
  }
};
