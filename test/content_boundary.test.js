const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin', 'index.html'), 'utf8');
const studio = fs.readFileSync(path.join(root, 'studio', 'index.html'), 'utf8');

test('legacy PWA content mutations fail closed while public readers remain', () => {
  assert.match(admin, /Content uploads have moved to the current Mirage admin/);
  assert.match(admin, /Content deletion has moved to the current Mirage admin/);
  assert.match(admin, /Saving edited content has moved to the current Mirage admin/);
  assert.match(admin, /\/rest\/v1\/content\?select=/);
  assert.doesNotMatch(admin, /\/storage\/v1\/object\/content\//);
  assert.doesNotMatch(admin, /\/rest\/v1\/content['"]\s*,\s*\{\s*method:\s*['"]POST/);

  assert.match(studio, /Content deletion has moved to the current Mirage admin/);
  assert.match(studio, /Bulk clear is retired/);
  assert.match(studio, /\/rest\/v1\/content\?order=/);
  assert.doesNotMatch(studio, /migrateSloanImages/);
  assert.doesNotMatch(studio, /\/storage\/v1\/object\/(?:list\/)?content/);
  assert.doesNotMatch(studio, /\.storage\.from\(['"]content['"]\)\.(?:upload|remove|list|move)\s*\(/);
  assert.doesNotMatch(studio, /\.from\(['"]content['"]\)\.(?:insert|update|delete|upsert)\s*\(/);
});

test('shipped HTML contains no Supabase service-role JWT', () => {
  const htmlFiles = [];
  function collect(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(absolute);
      else if (entry.name.endsWith('.html')) htmlFiles.push(absolute);
    }
  }
  collect(root);

  for (const file of htmlFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const tokens = source.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g) || [];
    for (const token of tokens) {
      let payload;
      try { payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); }
      catch (_) { continue; }
      assert.notEqual(payload.role, 'service_role', `service-role JWT found in ${path.relative(root, file)}`);
    }
  }
});
