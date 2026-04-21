// Sloan Live — Figma plugin main thread. Executes design tasks in the
// current file: navigates to the right sandbox page and runs the
// generated Figma Plugin API code (with optional theatre-mode stepping
// through statements on a delay).
//
// Architecture: this file has no network access. All fetches happen in
// ui.html. The UI polls the proxy for pending tasks, hands them off
// here via postMessage, and translates our lifecycle messages back
// into PATCH calls. The 'complete'/'failed' patch is the UI's signal
// to resume polling, so there is always exactly one task in flight.

let theatreMode = true;

figma.showUI(__html__, { width: 280, height: 180, themeColors: true });

figma.ui.onmessage = function (msg) {
  if (!msg || !msg.type) return;
  if (msg.type === 'theatre') { theatreMode = msg.value; return; }
  if (msg.type === 'task') {
    runTask(msg.task).catch(function (e) {
      console.error('[sloan-live] runTask unhandled error:', e && e.message);
    });
  }
  if (msg.type === 'place-image') {
    placeImageOnWorkshop(msg.bytes, msg.url).catch(function (e) {
      console.error('[sloan-live] place-image error:', e && e.message);
    });
  }
};

// Shorten a URL for the text label below a placed image. Returns
// host + path, truncated with an ellipsis past ~52 chars so labels
// stay readable when Sloan drops longer paths into the workshop.
function shortenUrlForLabel(url) {
  try {
    var parsed = new URL(url);
    var path = parsed.pathname || '';
    var host = parsed.host || '';
    var combined = host + path;
    if (combined.length > 52) combined = combined.slice(0, 49) + '…';
    return combined;
  } catch (_) {
    var s = String(url || '');
    return s.length > 52 ? s.slice(0, 49) + '…' : s;
  }
}

// Place an image dropped in by the [FIGMA_IMAGE: url] directive onto
// page 00 — Sloan's Workshop. Uses right-edge placement: scan the
// page's existing children for the max (x + width), drop the new
// image 80px to the right of that, with a Helvetica Neue Regular
// 12px label below it showing the shortened source URL.
// Find the first FRAME on the page whose name starts with 'img_' and
// has no IMAGE-type fill yet (still the grey placeholder). Iterates
// page.children in their natural order so a designer-arranged grid
// fills top-to-bottom / left-to-right the way the file was authored.
// Returns null when nothing matches — caller falls back to right-edge
// placement.
function findEmptyMoodboardSlot(page) {
  for (var i = 0; i < page.children.length; i++) {
    var node = page.children[i];
    if (!node || node.type !== 'FRAME') continue;
    if (!node.name || node.name.indexOf('img_') !== 0) continue;
    var fills = node.fills;
    // figma.mixed is a Symbol sentinel — skip rather than guess.
    if (fills === figma.mixed) continue;
    if (!Array.isArray(fills)) continue;
    var hasImage = false;
    for (var j = 0; j < fills.length; j++) {
      var f = fills[j];
      if (f && f.type === 'IMAGE' && f.visible !== false) { hasImage = true; break; }
    }
    if (!hasImage) return node;
  }
  return null;
}

async function placeImageOnWorkshop(bytesArr, url) {
  await goToPage('00');
  await new Promise(function (r) { setTimeout(r, 200); });

  var page = figma.currentPage;
  var bytes = new Uint8Array(bytesArr || []);
  var image = figma.createImage(bytes);

  // Preferred path — fill the next empty img_* placeholder frame in
  // the moodboard grid. Preserves the frame's existing dimensions
  // and position; only the fill changes (grey placeholder → IMAGE
  // with scaleMode FILL). No label is added — the moodboard's
  // layout speaks for itself and a caption below would break the
  // grid. Labels only appear on the right-edge fallback path below.
  var slot = findEmptyMoodboardSlot(page);
  if (slot) {
    slot.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
    figma.viewport.scrollAndZoomIntoView([slot]);
    figma.notify('✓ Sloan — Filled ' + slot.name, { timeout: 3000 });
    console.log('[sloan-live] filled moodboard slot:', slot.name, 'with', shortenUrlForLabel(url));
    return;
  }

  // Fallback — no empty placeholder frames on the page, so drop a
  // fresh rect at the right edge with a label. Matches the original
  // behavior from 153762a.
  var size;
  try {
    size = await image.getSizeAsync();
  } catch (_) {
    size = { width: 800, height: 800 };
  }
  // Cap the long edge at 800 so one huge image can't blow up the workshop.
  var scale = Math.min(1, 800 / Math.max(size.width, size.height));
  var w = Math.max(64, size.width * scale);
  var h = Math.max(64, size.height * scale);

  var rect = figma.createRectangle();
  rect.resize(w, h);
  rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
  rect.name = 'Web image — ' + shortenUrlForLabel(url);

  // Right-edge placement — find the rightmost bound of existing
  // children on this page and offset the new rect 80px past it.
  var maxX = 0;
  for (var i = 0; i < page.children.length; i++) {
    var node = page.children[i];
    if (typeof node.x === 'number' && typeof node.width === 'number') {
      var right = node.x + node.width;
      if (right > maxX) maxX = right;
    }
  }
  rect.x = maxX + 80;
  rect.y = 0;
  page.appendChild(rect);

  // Label below, Helvetica Neue Regular 12px — matches the font rules
  // the /sloan/figma code generator uses for any text in the workshop.
  await figma.loadFontAsync({ family: 'Helvetica Neue', style: 'Regular' });
  var text = figma.createText();
  text.fontName = { family: 'Helvetica Neue', style: 'Regular' };
  text.fontSize = 12;
  text.characters = shortenUrlForLabel(url);
  text.x = rect.x;
  text.y = rect.y + rect.height + 12;
  page.appendChild(text);

  figma.viewport.scrollAndZoomIntoView([rect, text]);
  figma.notify('✓ Sloan — Image placed in Workshop', { timeout: 3000 });
}

function uiMsg(obj) { figma.ui.postMessage(obj); }

// Navigate to a named page in the current file. Uses the async setter
// so plugins with pageLoad: false in the manifest work correctly.
async function goToPage(name) {
  const page = figma.root.children.find(function (p) {
    return p.name.toLowerCase().indexOf(name.toLowerCase()) !== -1;
  });
  if (page) {
    await figma.setCurrentPageAsync(page);
    console.log('[sloan-live] switched to page:', page.name);
  } else {
    console.warn('[sloan-live] page not found:', name);
  }
}

// All generated work goes to '00 — Sloan's Workshop'. Nate reviews there
// and moves approved pieces to the appropriate destination page himself.
// Matches the CRITICAL rule in the /sloan/figma generator prompt, so the
// plugin and the model agree on the target page.
function pageForTask(_task) {
  return '00';
}

// Split code into executable statements. Respects braces so we do not
// cut inside object literals or function bodies.
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

async function executeCode(code) {
  if (!theatreMode) {
    var fn = new Function('figma', code);
    fn(figma);
    uiMsg({ type: 'progress', percent: 100 });
    return;
  }

  // Theatre mode — step through statements with delays so you can watch.
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

// Execute one task delivered by the UI. Every lifecycle state emits a
// {type:'patch'} message — the UI turns those into PATCH /sloan/figma/:id
// calls and uses the terminal patch (complete|failed) to resume polling.
async function runTask(task) {
  if (!task || !task.id) return;
  var taskName = (task.task || '').slice(0, 80);
  console.log('[sloan-live] task received:', task.id, taskName);

  uiMsg({ type: 'working', task: taskName });
  uiMsg({ type: 'patch', id: task.id, status: 'running' });

  var page = pageForTask(task.task || '');
  await goToPage(page);
  // Figma's setCurrentPageAsync resolves before the page is fully
  // ready for create calls on a newly-loaded page. A small settle
  // delay before executing task code prevents "page not current" or
  // stale-root errors on the first figma.createX call.
  await new Promise(resolve => setTimeout(resolve, 500));

  var code = task.figma_code || '';
  if (!code.trim()) {
    console.log('[sloan-live] no figma_code, marking complete');
    uiMsg({ type: 'patch', id: task.id, status: 'complete', result: 'No code to execute \u2014 brief only.' });
    uiMsg({ type: 'complete', task: taskName });
    figma.notify('\u2713 Sloan \u2014 Brief posted (no code)', { timeout: 4000 });
    return;
  }

  try {
    await executeCode(code);
    uiMsg({ type: 'patch', id: task.id, status: 'complete', result: 'Executed successfully' });
    uiMsg({ type: 'complete', task: taskName });
    figma.notify('\u2713 Sloan \u2014 Ready for review', { timeout: 4000 });
  } catch (e) {
    console.error('[sloan-live] execution error:', e.message);
    uiMsg({ type: 'patch', id: task.id, status: 'failed', result: 'Execution error: ' + e.message });
    uiMsg({ type: 'error', message: e.message || 'unknown' });
    figma.notify('Sloan \u2014 Task failed: ' + e.message, { timeout: 6000, error: true });
  }
}

// Signal to the UI that the main thread is ready for tasks. The UI
// starts polling on load regardless, but this gives it a confirmation
// beat so the initial status pulse lines up with actual readiness.
uiMsg({ type: 'ready' });
