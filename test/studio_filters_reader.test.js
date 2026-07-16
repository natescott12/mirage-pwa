const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'admin', 'index.html'), 'utf8');
const start = source.indexOf('// ── CONTENT LIBRARY (Lightroom)');
const end = source.indexOf('// ── ANDIE', start);
const contentLibrary = source.slice(start, end > start ? end : start + 100000);

test('Content Library does not read studio_filters from the browser', function() {
  assert.ok(start >= 0, 'Content Library source must exist');
  assert.doesNotMatch(contentLibrary, /\/rest\/v1\/studio_filters|\.from\(['"]studio_filters['"]\)|clFetchPresets/);
});

test('the bundled Studio preset set is canonical and complete', function() {
  assert.match(contentLibrary, /const CL_PRESETS = \[/);
  assert.match(contentLibrary, /let clPresets = CL_PRESETS\.slice\(\)/);
  for (const slug of ['none', 'bw', 'portra400', 'fuji400h', 'overcast', 'flash', 'dusk', 'filmscan']) {
    assert.match(contentLibrary, new RegExp("slug: '" + slug + "'"));
  }
});
