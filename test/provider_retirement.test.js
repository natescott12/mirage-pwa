'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'api');
const deployableSources = fs.readdirSync(apiDir)
  .filter((name) => name.endsWith('.js'))
  .sort()
  .map((name) => ({ name, source: fs.readFileSync(path.join(apiDir, name), 'utf8') }));
const executorSource = fs.readFileSync(path.join(apiDir, 'sloan-figma-executor.js'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

test('deployable API runtime has no Twilio or Sinch credential reads or provider endpoints', () => {
  for (const { name, source } of deployableSources) {
    assert.doesNotMatch(source, /process\.env\.(?:TWILIO|SINCH)_/, name);
    assert.doesNotMatch(source, /api\.(?:twilio|sinch)\.com/i, name);
    assert.doesNotMatch(source, /TWILIO_(?:ACCOUNT_SID|AUTH_TOKEN)/, name);
  }
});

test('scheduled executor contains no outbound carrier helper or fallback', () => {
  assert.doesNotMatch(executorSource, /sendSms\s*\(/);
  assert.doesNotMatch(executorSource, /URLSearchParams\s*\(/);
  assert.doesNotMatch(executorSource, /Messages\.json/);
  assert.doesNotMatch(executorSource, /NATE_PHONE_NUMBER|SLOAN_PHONE_NUMBER/);
});

test('ordinary deployment and schedule retain the non-carrier task path', () => {
  assert.deepEqual(vercel.crons, [{
    path: '/api/sloan-figma-executor',
    schedule: '0 16 * * 0',
  }]);
  assert.match(executorSource, /sloan_figma_tasks\?status=eq\.pending/);
  assert.match(executorSource, /postFigmaComment\(/);
  assert.match(executorSource, /method: 'PATCH'/);
  assert.match(executorSource, /results\.push\(\{ id: task\.id, taskName, commented \}\)/);
});

test('no deployable replacement-provider sender is enabled', () => {
  const combined = deployableSources.map(({ source }) => source).join('\n');
  assert.doesNotMatch(combined, /sinch/i);
  assert.doesNotMatch(combined, /replacementProviderReady\s*[:=]\s*true/);
});
