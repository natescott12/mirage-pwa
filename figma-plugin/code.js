// Sloan Live — code.js (Figma sandbox)
// Handles ONLY Figma API calls. All network requests live in ui.html.

figma.showUI(__html__, { visible: false, width: 0, height: 0 });

var theatreMode = true;

figma.ui.onmessage = async function(msg) {
  if (msg.type === 'theatre') { theatreMode = msg.value; return; }

  if (msg.type === 'ERROR') {
    figma.notify('Plugin error: ' + (msg.error || 'unknown'), { timeout: 6000, error: true });
    return;
  }

  if (msg.type === 'EXECUTE_TASK') {
    var task = msg.task;
    if (!task || !task.id) return;

    var taskName = (task.task || '').slice(0, 80);
    console.log('[sloan-live] executing task:', task.id, taskName);

    // Navigate to the correct page
    var pageKey = pageForTask(task.task || '');
    goToPage(pageKey);

    var code = task.figma_code || '';
    if (!code.trim()) {
      console.log('[sloan-live] no figma_code, brief only');
      figma.notify('\u2713 Sloan \u2014 Brief posted (no code)', { timeout: 4000 });
      figma.ui.postMessage({ type: 'TASK_DONE', id: task.id, status: 'complete', result: 'No code to execute \u2014 brief only.' });
      return;
    }

    try {
      await executeCode(code);
      figma.notify('\u2713 Sloan \u2014 Ready for review', { timeout: 4000 });
      figma.ui.postMessage({ type: 'TASK_DONE', id: task.id, status: 'complete', result: 'Executed successfully' });
    } catch (e) {
      console.error('[sloan-live] execution error:', e.message);
      figma.notify('Sloan \u2014 Task failed: ' + e.message, { timeout: 6000, error: true });
      figma.ui.postMessage({ type: 'TASK_DONE', id: task.id, status: 'failed', result: 'Execution error: ' + e.message });
    }
  }
};

function goToPage(name) {
  var page = figma.root.children.find(function(p) {
    return p.name.toLowerCase().indexOf(name.toLowerCase()) !== -1;
  });
  if (page) {
    figma.currentPage = page;
    console.log('[sloan-live] switched to page:', page.name);
  } else {
    console.warn('[sloan-live] page not found:', name);
  }
}

function pageForTask(task) {
  var t = (task || '').toLowerCase();
  if (/\b(type|typography|grid|font)\b/.test(t)) return '02';
  if (/\b(color|colour|palette|swatch)\b/.test(t)) return '03';
  if (/\b(layout|screen|interface|ui)\b/.test(t)) return '04';
  if (/\b(audit|image|review|library)\b/.test(t)) return '01';
  if (/\b(mood|reference|moodboard)\b/.test(t)) return '06';
  return '05';
}

function splitStatements(code) {
  var lines = code.split('\n');
  var stmts = [];
  var buf = '';
  var depth = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    buf += (buf ? '\n' : '') + line;
    for (var c = 0; c < line.length; c++) {
      if (line[c] === '{') depth++;
      if (line[c] === '}') depth--;
    }
    if (depth <= 0 && buf.trim()) {
      stmts.push(buf);
      buf = '';
      depth = 0;
    }
  }
  if (buf.trim()) stmts.push(buf);
  return stmts;
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function executeCode(code) {
  if (!theatreMode) {
    var fn = new Function('figma', code);
    fn(figma);
    figma.ui.postMessage({ type: 'progress', percent: 100 });
    return;
  }

  var stmts = splitStatements(code);
  for (var i = 0; i < stmts.length; i++) {
    try {
      var fn = new Function('figma', stmts[i]);
      fn(figma);
    } catch (e) {
      console.warn('[sloan-live] statement', i, 'error:', e.message, '\n', stmts[i].slice(0, 120));
    }
    var pct = Math.round(((i + 1) / stmts.length) * 100);
    figma.ui.postMessage({ type: 'progress', percent: pct });
    await sleep(Math.floor(Math.random() * 250) + 150);
  }
}
