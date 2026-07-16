const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'admin', 'index.html'), 'utf8');
const start = source.indexOf('async function andieLoadPlatformData()');
const end = source.indexOf('// ── Andie chat history persistence', start);
const loader = source.slice(start, end > start ? end : start + 20000);

test('Andie platform context no longer reads public image_logs', function() {
  assert.ok(start >= 0, 'andieLoadPlatformData must exist');
  assert.doesNotMatch(loader, /\/rest\/v1\/image_logs|RECENT IMAGE LOGS|const logs\s*=/);
});

test('Andie context retains the five intended sources with aligned indexes', function() {
  assert.match(loader, /const personas\s+= pick\(tasks\[0\]\)/);
  assert.match(loader, /const briefs\s+= pick\(tasks\[1\]\)/);
  assert.match(loader, /const chats\s+= pick\(tasks\[2\]\)/);
  assert.match(loader, /const memory\s+= pick\(tasks\[3\]\)/);
  assert.match(loader, /const sloanMemory = pick\(tasks\[4\]\)/);
  assert.match(loader, /\['personas\.json', 'icon_briefs', 'icon_chats', 'andie_memory', 'sloan_memory'\]/);
});
