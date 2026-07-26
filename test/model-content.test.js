'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MODEL_REGISTRY } = require('../model-registry.js');

const ROOT = path.join(__dirname, '..');
const DATE = '07/26/2026';
const LEDGER = fs.readFileSync(path.join(ROOT, 'research/2026-07-26/official-ledgers/MODEL_LINEUP_LEDGER.md'), 'utf8');
const ARCHIVE = fs.readFileSync(path.join(ROOT, 'research/archive/Prompt Research Project Analysis.md'), 'utf8');
const EXPECTED_HEADERS = ['Model', 'Model ID', 'Developer', 'Category', 'Architecture', 'Total Params', 'Active Params', 'Context', 'License', 'Weights Status', 'Availability Caveat', 'Best For', 'Evidence Type', 'Last Verified', 'Source URL'];
const OBSOLETE = ['DeepSeek V3.2', 'Qwen 3.5', 'Kimi K2.5', 'MiniMax M2.5', 'generic Mistral', 'Mixtral'];

function csvRows(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted && ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (!quoted && ch === ',') { row.push(field); field = ''; continue; }
    if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function modelSection() {
  const csv = fs.readFileSync(path.join(ROOT, 'GPUHosting_Tracker.csv'), 'utf8');
  const lines = csv.split(/\r?\n/);
  const start = lines.indexOf('SHEET: Model Specifications');
  assert.notEqual(start, -1, 'Model Specifications sheet missing');
  const end = lines.findIndex((line, index) => index > start && line.startsWith('SHEET: '));
  return csvRows(lines.slice(start + 1, end === -1 ? lines.length : end).join('\n'));
}

function displayNumber(value) { return value === null ? 'Not published' : `${value}B`; }
function displayContext(value) { return value === null ? 'Not published' : String(value); }
function displayArchitecture(record) {
  return record.architecture.includes('undisclosed') ? 'Not published' : record.architecture;
}
function displayLicense(record) {
  return record.license === 'Pending publication' ? 'Not published' : record.license;
}
function displayWeights(record) {
  return record.weightsStatus === 'released' ? 'Released' : record.weightsStatus === 'not-published' ? 'Not published' : 'Pending';
}
function displayCaveat(record) {
  if (record.category === 'self-hostable') return 'Public weights; self-hostable';
  if (record.category === 'api-only') return record.availability === 'restricted-api-preview' ? 'Restricted API preview; no public weights' : 'API-only; no public weights';
  if (record.category === 'weights-pending') return `API available; full weights pending until ${record.pendingWeightsDate}`;
  return 'Legacy public weights; retained for existing deployments';
}

function expectedRow(record) {
  return [
    record.displayName,
    record.modelId || record.apiId,
    record.vendor,
    record.category,
    displayArchitecture(record),
    displayNumber(record.totalParamsB),
    displayNumber(record.activeParamsB),
    displayContext(record.contextTokens),
    displayLicense(record),
    displayWeights(record),
    displayCaveat(record),
    record.bestFor,
    record.evidenceType,
    DATE,
    record.officialSources[0],
  ];
}

test('Model Specifications is an exact, rectangular projection of every registry record', () => {
  const rows = modelSection();
  assert.deepEqual(rows[0], EXPECTED_HEADERS);
  const actual = rows.slice(1);
  const expected = Object.values(MODEL_REGISTRY.models).map(expectedRow);
  assert.deepEqual(actual, expected);
});

test('tracker retains eight rectangular sheets and only the model schedule is refreshed', () => {
  const lines = fs.readFileSync(path.join(ROOT, 'GPUHosting_Tracker.csv'), 'utf8').split(/\r?\n/);
  const headers = lines.filter((line) => line.startsWith('SHEET: '));
  assert.equal(headers.length, 8);
  for (let i = 0; i < headers.length; i += 1) {
    const start = lines.indexOf(headers[i]);
    const end = lines.findIndex((line, index) => index > start && line.startsWith('SHEET: '));
    const rows = csvRows(lines.slice(start + 1, end === -1 ? lines.length : end).join('\n'));
    assert.ok(rows.length > 0, `${headers[i]} has no rows`);
    const width = rows[0].length;
    assert.ok(width > 0, `${headers[i]} has no columns`);
    for (const row of rows) assert.equal(row.length, width, `${headers[i]} is not rectangular`);
  }
  const schedule = csvRows(lines.slice(lines.indexOf('SHEET: Content Verification Schedule') + 1, lines.findIndex((line, index) => index > lines.indexOf('SHEET: Content Verification Schedule') && line.startsWith('SHEET: '))).join('\n'));
  for (const row of schedule.slice(1)) {
    if (['Model Specifications', 'New Model Releases'].includes(row[0])) assert.equal(row[3], DATE);
  }
});

test('obsolete current model rows and unsupported archive claims are rejected', () => {
  const tracker = fs.readFileSync(path.join(ROOT, 'GPUHosting_Tracker.csv'), 'utf8');
  const modelText = tracker.slice(tracker.indexOf('SHEET: Model Specifications'), tracker.indexOf('SHEET: GPU Hardware Specs'));
  const currentRows = modelText.split(/\r?\n/).filter((line) => line && !line.startsWith('SHEET: ') && !line.startsWith('Model,'));
  for (const term of OBSOLETE.slice(0, 5)) assert.equal(currentRows.some((line) => line.includes(term) && !line.includes(',legacy,')), false, `obsolete tracker term: ${term}`);
  assert.equal(currentRows.some((line) => line.includes('generic Mistral')), false, 'generic Mistral row');
  assert.equal(currentRows.some((line) => line.includes('Mixtral') && !line.includes(',legacy,')), false, 'obsolete current Mixtral row');
  assert.match(ARCHIVE, /ARCHIVED — SUPERSEDED/);
  assert.match(ARCHIVE, /canonical `model-registry\.js`/);
  assert.match(ARCHIVE, /GPUHosting_Tracker\.csv` Model Specifications (?:ledger|sheet)/i);
  assert.match(ARCHIVE, /must not be republished without re-verification/i);
  assert.doesNotMatch(ARCHIVE, /DeepSeek[- ]V4[^\n]*(?:parameter|params|trillion|billion|rumou?r|guessed|estimated)/i);
});

test('dated ledger is grouped, first-party, and fail-closed about estimates', () => {
  assert.match(LEDGER, /Research date:\*\*\s*2026-07-26/);
  for (const category of ['self-hostable', 'api-only', 'weights-pending', 'legacy']) assert.match(LEDGER, new RegExp(`### ${category}`));
  for (const record of Object.values(MODEL_REGISTRY.models)) {
    assert.match(LEDGER, new RegExp(record.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(LEDGER, new RegExp(record.officialSources[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(LEDGER, /official specification\/documentation/i);
  assert.match(LEDGER, /Estimate\/formula/);
  assert.match(LEDGER, /metadata.*runtime.*KV cache/i);
  assert.match(LEDGER, /DeepSeek-V4-Pro.*800GB/i);
  assert.match(LEDGER, /Kimi K3.*1\.4TB.*pending.*not a deployment target/i);
  assert.match(LEDGER, /Gemma 4 26B-A4B.*12\.6GB.*not 8GB/i);
  assert.match(LEDGER, /gpt-oss.*117B.*21B/i);
});
