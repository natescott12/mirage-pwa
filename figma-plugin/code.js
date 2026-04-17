// Sloan Live — Figma plugin that polls for design tasks from the Mirage
// proxy, navigates to the correct sandbox page, and executes generated
// Figma Plugin API code. Theatre mode steps through statements with a
// natural delay so you can watch Sloan work.

const PROXY = 'https://mirage-proxy-production.up.railway.app';
const INTERNAL_KEY = 'mirage-int-2026';
const POLL_MS = 3000;

let theatreMode = true;
let polling = true;

figma.showUI(__html__, { width: 280, height: 180, themeColors: true });

figma.ui.onmessage = function (msg) {
  if (msg.type === 'theatre') theatreMode = msg.value;
};

function uiMsg(obj) { figma.ui.postMessage(obj); }

// Navigate to a named page in the current file.
function goToPage(name) {
  const page = figma.root.children.find(function (p) {
    return p.name.toLowerCase().indexOf(name.toLowerCase()) !== -1;
  });
  if (page) {
    figma.currentPage = page;
    console.log('[sloan-live] switched to page:', page.name);
  } else {
    console.warn('[sloan-live] page not found:', name);
  }
}

// Decide which page based on task content keywords.
function pageForTask(task) {
  var t = (task || '').toLowerCase();
  if (/\b(type|typography|grid|font)\b/.test(t)) return '02';
  if (/\b(color|colour|palette|swatch)\b/.test(t)) return '03';
  if (/\b(layout|screen|interface|ui)\b/.test(t)) return '04';
  if (/\b(audit|image|review|library)\b/.test(t)) return '01';
  if (/\b(mood|reference|moodboard)\b/.test(t)) return '06';
  return '05';
}

// Split code into executable statements. Tries to respect braces and
// avoid cutting inside object literals or function bodies.
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

function randomDelay() {
  return Math.floor(Math.random() * 250) + 150;
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function patchTask(id, status, result) {
  try {
    await fetch(PROXY + '/sloan/figma/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-mirage-key': INTERNAL_KEY },
      body: JSON.stringify({ status: status, result: result || null }),
    });
  } catch (e) {
    console.warn('[sloan-live] patch error:', e.message);
  }
}

async function executeCode(code, taskName) {
  if (!theatreMode) {
    // Direct execution
    try {
      var fn = new Function('figma', code);
      fn(figma);
      uiMsg({ type: 'progress', percent: 100 });
    } catch (e) {
      throw e;
    }
    return;
  }

  // Theatre mode — step through statements with delays
  var stmts = splitStatements(code);
  for (var i = 0; i < stmts.length; i++) {
    try {
      var fn = new Function('figma', stmts[i]);
      fn(figma);
    } catch (e) {
      console.warn('[sloan-live] statement', i, 'error:', e.message, '\n', stmts[i].slice(0, 120));
    }
    var pct = Math.round(((i + 1) / stmts.length) * 100);
    uiMsg({ type: 'progress', percent: pct });
    await sleep(randomDelay());
  }
}

async function pollOnce() {
  try {
    var r = await fetch(PROXY + '/sloan/figma/pending', { headers: { 'x-mirage-key': INTERNAL_KEY } });
    if (!r.ok) { uiMsg({ type: 'error' }); return; }
    var task = await r.json();
    if (!task || !task.id) { uiMsg({ type: 'empty' }); return; }

    var taskName = (task.task || '').slice(0, 80);
    console.log('[sloan-live] task found:', task.id, taskName);
    uiMsg({ type: 'working', task: taskName });

    // Mark as running
    await patchTask(task.id, 'running');

    // Navigate to the right page
    var page = pageForTask(task.task || '');
    goToPage(page);

    // Execute
    var code = task.figma_code || '';
    if (!code.trim()) {
      console.log('[sloan-live] no figma_code, marking complete');
      await patchTask(task.id, 'complete', 'No code to execute — brief only.');
      uiMsg({ type: 'complete', task: taskName });
      figma.notify('\u2713 Sloan \u2014 Brief posted (no code)', { timeout: 4000 });
      return;
    }

    try {
      await executeCode(code, taskName);
      await patchTask(task.id, 'complete', 'Executed successfully');
      uiMsg({ type: 'complete', task: taskName });
      figma.notify('\u2713 Sloan \u2014 Ready for review', { timeout: 4000 });
    } catch (e) {
      console.error('[sloan-live] execution error:', e.message);
      await patchTask(task.id, 'failed', 'Execution error: ' + e.message);
      uiMsg({ type: 'error' });
      figma.notify('Sloan \u2014 Task failed: ' + e.message, { timeout: 6000, error: true });
    }
  } catch (e) {
    console.warn('[sloan-live] poll error:', e.message);
    uiMsg({ type: 'error' });
  }
}

// Main loop
async function loop() {
  uiMsg({ type: 'watching' });
  while (polling) {
    await pollOnce();
    await sleep(POLL_MS);
  }
}

loop();
