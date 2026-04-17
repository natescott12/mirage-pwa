// Sloan Live — code.js
figma.showUI(__html__, { visible: false, width: 0, height: 0 });

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

async function runWithTheatre(code, delayMs = 150) {
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const originals = {};
  const created = [];
  const patchable = ['createFrame','createText','createRectangle','createEllipse','createLine','createVector','createComponent','createGroup'];

  for (const m of patchable) {
    originals[m] = figma[m].bind(figma);
    figma[m] = function(...args) {
      const node = originals[m](...args);
      created.push(node);
      return node;
    };
  }

  try {
    const fn = new Function('figma', 'return (async()=>{\n' + code + '\n})()');
    await fn(figma);
  } finally {
    for (const m of patchable) figma[m] = originals[m];
  }

  const topLevel = created.filter(n => {
    try { return n.parent === figma.currentPage; } catch { return false; }
  });

  for (const root of topLevel) {
    figma.viewport.scrollAndZoomIntoView([root]);
    if ('children' in root && root.children.length > 0) {
      const children = [...root.children];
      for (const child of children) {
        try { child.opacity = 0; } catch {}
      }
      await delay(200);
      for (const child of children) {
        try {
          child.opacity = 1;
          await delay(delayMs);
        } catch {}
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
