'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const { parse } = require('csv-parse/sync');
const { MODEL_REGISTRY } = require('../model-registry.js');

const ROOT = path.join(__dirname, '..');
const DATE = '07/26/2026';
const LEDGER = fs.readFileSync(path.join(ROOT, 'research/2026-07-26/official-ledgers/MODEL_LINEUP_LEDGER.md'), 'utf8');
const ARCHIVE = fs.readFileSync(path.join(ROOT, 'research/archive/Prompt Research Project Analysis.md'), 'utf8');
const EXPECTED_HEADERS = ['Model', 'Model ID', 'Developer', 'Category', 'Architecture', 'Total Params', 'Active Params', 'Context', 'License', 'Weights Status', 'Availability Caveat', 'Best For', 'Evidence Type', 'Last Verified', 'Source URL'];
const OBSOLETE = ['DeepSeek V3.2', 'Qwen 3.5', 'Kimi K2.5', 'MiniMax M2.5', 'generic Mistral', 'Mixtral'];

function csvRows(text) { return parse(text, { relax_column_count: false, skip_empty_lines: true }); }

function sheetBlocks(csv) {
  return csv.match(/SHEET: [^\r\n]+[\s\S]*?(?=\r?\nSHEET: |$)/g) || [];
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
  const tracker = fs.readFileSync(path.join(ROOT, 'GPUHosting_Tracker.csv'), 'utf8');
  const blocks = sheetBlocks(tracker);
  assert.equal(blocks.length, 8);
  assert.equal(new Set(blocks.map((block) => block.match(/^SHEET: ([^\r\n]+)/)[1])).size, 8);
  for (const block of blocks) {
    const rows = csvRows(block.slice(block.indexOf('\n') + 1));
    assert.ok(rows.length > 0, `${block.split('\n', 1)[0]} has no rows`);
    const width = rows[0].length;
    assert.ok(width > 0, `${block.split('\n', 1)[0]} has no columns`);
    for (const row of rows) assert.equal(row.length, width, `${block.split('\n', 1)[0]} is not rectangular`);
  }
  const lines = tracker.split(/\r?\n/);
  assert.ok(lines.includes('SHEET: Content Verification Schedule'));
});

test('all seven non-model tracker sheets remain byte-for-byte identical to the baseline', () => {
  const current = fs.readFileSync(path.join(ROOT, 'GPUHosting_Tracker.csv'), 'utf8');
  const baseline = childProcess.execFileSync('git', ['show', 'ca490b58c526dc7307621579f4c63a788f1422e7:GPUHosting_Tracker.csv'], { cwd: ROOT, encoding: 'utf8' });
  const currentBlocks = new Map(sheetBlocks(current).map((block) => [block.match(/^SHEET: ([^\r\n]+)/)[1], block]));
  const baselineBlocks = new Map(sheetBlocks(baseline).map((block) => [block.match(/^SHEET: ([^\r\n]+)/)[1], block]));
  for (const [name, block] of baselineBlocks) {
    if (name === 'Model Specifications') continue;
    assert.equal(crypto.createHash('sha256').update(currentBlocks.get(name) || '').digest('hex'), crypto.createHash('sha256').update(block).digest('hex'), `${name} changed from baseline`);
  }
});

test('standards-compliant CSV parsing rejects an unterminated quote', () => {
  assert.throws(() => parse('header\n"unterminated'), /quote|record/i);
});

test('obsolete current model rows are rejected and superseded research is a non-factual tombstone', () => {
  const tracker = fs.readFileSync(path.join(ROOT, 'GPUHosting_Tracker.csv'), 'utf8');
  const modelText = tracker.slice(tracker.indexOf('SHEET: Model Specifications'), tracker.indexOf('SHEET: GPU Hardware Specs'));
  const currentRows = modelText.split(/\r?\n/).filter((line) => line && !line.startsWith('SHEET: ') && !line.startsWith('Model,'));
  for (const term of OBSOLETE.slice(0, 5)) assert.equal(currentRows.some((line) => line.includes(term) && !line.includes(',legacy,')), false, `obsolete tracker term: ${term}`);
  assert.equal(currentRows.some((line) => line.includes('generic Mistral')), false, 'generic Mistral row');
  assert.equal(currentRows.some((line) => line.includes('Mixtral') && !line.includes(',legacy,')), false, 'obsolete current Mixtral row');
  assert.match(ARCHIVE, /ARCHIVED — SUPERSEDED/);
  assert.match(ARCHIVE, /Canonical model data: `model-registry\.js`/);
  assert.match(ARCHIVE, /GPUHosting_Tracker\.csv` Model Specifications (?:ledger|sheet)/i);
  assert.match(ARCHIVE, /must not be republished without re-verification/i);
  assert.match(ARCHIVE, /body was intentionally removed/i);
  assert.ok(ARCHIVE.split(/\r?\n/).length < 30, 'archive must not retain a reusable unsupported report body');
  assert.doesNotMatch(ARCHIVE, /(?:tok\/s|tokens per second|outperforming|VRAM fit|hourly rental|affiliate commission|universal adoption)/i);
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
