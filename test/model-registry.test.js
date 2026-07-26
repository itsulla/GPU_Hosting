'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MODEL_REGISTRY, STATUS_CATEGORIES, isDeploymentEligible } = require('../model-registry.js');

const SNAPSHOT_DATE = '2026-07-26';
const CATEGORIES = new Set(['self-hostable', 'api-only', 'weights-pending', 'legacy']);
const EVIDENCE_TYPES = new Set(['Official specification', 'Official documentation']);
const RUMOR_WORDS = /rumou?r|alleged|reportedly|speculative|unconfirmed|maybe|likely|expected|upcoming|rumored/i;
const FORBIDDEN_CLAIMS = /benchmark|throughput|tok\/s|tokens?\s*\/\s*s|provider\s+prices?|\$\s*\d|gpu[- ]fit|fits?\s+(?:on|in)|recommended\s+gpu/i;
const HTTPS_FIRST_PARTY = /^https:\/\/(?:huggingface\.co\/(?:deepseek-ai|Qwen|moonshotai|MiniMaxAI|google|openai|meta-llama|mistralai|sarvamai)\/|ai\.google\.dev\/gemma\/docs\/|www\.llama\.com\/models\/|platform\.claude\.com\/docs\/|platform\.kimi\.ai\/docs\/|help\.aliyun\.com\/zh\/model-studio\/|ollama\.com\/library\/)/i;

function allRecords() {
  return Object.values(MODEL_REGISTRY.models);
}

test('exports the canonical snapshot with exact status categories and date', () => {
  assert.equal(MODEL_REGISTRY.snapshotDate, SNAPSHOT_DATE);
  assert.deepEqual(new Set(MODEL_REGISTRY.statusCategories), CATEGORIES);
  assert.deepEqual(new Set(STATUS_CATEGORIES), CATEGORIES);
});

test('every record has complete, dated, first-party evidence metadata', () => {
  const records = allRecords();
  assert.ok(records.length >= 20);
  const slugs = new Set();
  const names = new Set();
  for (const record of records) {
    for (const field of ['slug', 'displayName', 'vendor', 'category', 'availability', 'weightsStatus', 'license', 'architecture', 'evidenceType', 'bestFor', 'facts']) assert.ok(field in record, `${field} missing`);
    assert.ok(!slugs.has(record.slug), `duplicate slug ${record.slug}`); slugs.add(record.slug);
    assert.ok(!names.has(record.displayName), `duplicate display name ${record.displayName}`); names.add(record.displayName);
    assert.ok(CATEGORIES.has(record.category));
    assert.equal(record.verifiedOn, SNAPSHOT_DATE);
    assert.equal(record.evidenceStatus, 'verified', `${record.slug} status claim is not publication-verified`);
    assert.ok(EVIDENCE_TYPES.has(record.evidenceType), `${record.slug} uses an unapproved evidence label`);
    assert.ok(Array.isArray(record.facts) && record.facts.length > 0);
    assert.ok(Array.isArray(record.officialSources) && record.officialSources.length > 0);
    for (const source of record.officialSources) assert.ok(HTTPS_FIRST_PARTY.test(source), `non-first-party source ${source}`);
    assert.equal(typeof record.totalParamsB === 'number' || record.totalParamsB === null, true);
    assert.equal(typeof record.activeParamsB === 'number' || record.activeParamsB === null, true);
    assert.equal(typeof record.contextTokens === 'number' || record.contextTokens === null, true);
    if (record.totalParamsB !== null && record.activeParamsB !== null) assert.ok(record.activeParamsB <= record.totalParamsB, `${record.slug} active params exceed total params`);
    assert.equal(RUMOR_WORDS.test(JSON.stringify(record)), false, `${record.slug} contains rumor language`);
    assert.equal(FORBIDDEN_CLAIMS.test(JSON.stringify(record)), false, `${record.slug} contains forbidden commercial/performance claim`);
  }
});

test('publication invariants fail closed by category', () => {
  for (const record of allRecords()) {
    if (record.category === 'self-hostable') {
      assert.equal(record.weightsStatus, 'released');
      assert.notEqual(record.totalParamsB, null);
      assert.ok(record.license);
      assert.equal(record.evidenceStatus, 'verified');
      assert.equal(record.availability, 'public-weights');
    }
    if (record.category === 'api-only') {
      assert.notEqual(record.weightsStatus, 'released');
      assert.equal(isDeploymentEligible(record), false);
    }
    if (record.category === 'weights-pending') {
      assert.equal(isDeploymentEligible(record), false);
    }
    if (record.category === 'legacy') assert.match(record.displayName, /legacy/i);
  }
});

test('required current self-hostable models carry the supplied verified facts', () => {
  const bySlug = MODEL_REGISTRY.models;
  const expected = {
    'deepseek-v4-pro': [1600, 49, 1000000, 'MIT'],
    'deepseek-v4-flash': [284, 13, 1000000, 'MIT'],
    'qwen3.6-27b': [27.8, 27.8, 262144, 'Apache-2.0'],
    'qwen3.6-35b-a3b': [35, 3, 262144, 'Apache-2.0'],
    'kimi-k2.7-code': [1000, 32, 262144, 'Modified MIT'],
    'minimax-m3': [428, 23, 1000000, 'MiniMax Model License'],
    'google-gemma-4-26b-a4b': [25.2, 3.8, 262144, 'Apache-2.0'],
    'openai-gpt-oss-120b': [117, 5.1, 131072, 'Apache-2.0'],
    'openai-gpt-oss-20b': [21, 3.6, 131072, 'Apache-2.0'],
    'llama-4-scout': [109, 17, 10000000, 'Llama 4 Community License'],
    'llama-4-maverick': [400, 17, 1000000, 'Llama 4 Community License'],
    'mistral-small-4': [119, 6, 262144, 'Apache-2.0'],
    'mistral-large-3': [675, 41, 262144, 'Apache-2.0'],
    'sarvam-105b': [106, 10.3, 131072, 'Apache-2.0'],
  };
  for (const [slug, [total, active, context, license]] of Object.entries(expected)) {
    assert.ok(bySlug[slug], `missing ${slug}`);
    assert.equal(bySlug[slug].totalParamsB, total); assert.equal(bySlug[slug].activeParamsB, active);
    assert.equal(bySlug[slug].contextTokens, context); assert.equal(bySlug[slug].license, license);
  }
});

test('API comparators preserve exact identifiers and never become deployable', () => {
  const bySlug = MODEL_REGISTRY.models;
  for (const [slug, apiId] of Object.entries({
    'claude-fable-5': 'claude-fable-5',
    'claude-opus-5': 'claude-opus-5',
    'claude-sonnet-5': 'claude-sonnet-5',
    'kimi-k3-api': 'kimi-k3',
    'qwen3.8-max-preview': 'qwen3.8-max-preview',
  })) {
    const record = bySlug[slug];
    assert.ok(record); assert.equal(record.category, slug === 'kimi-k3-api' ? 'weights-pending' : 'api-only');
    assert.equal(record.apiId, apiId); assert.equal(isDeploymentEligible(record), false);
  }
  assert.equal(bySlug['kimi-k3-api'].pendingWeightsDate, '2026-07-27');
  assert.equal(bySlug['qwen3.8-max-preview'].availability, 'restricted-api-preview');
});

test('critical claims point to exact official pages rather than generic vendor roots', () => {
  const bySlug = MODEL_REGISTRY.models;
  assert.equal(bySlug['google-gemma-4-26b-a4b'].modelId, 'google/gemma-4-26B-A4B-it');
  const expectedSource = {
    'google-gemma-4-26b-a4b': 'https://ai.google.dev/gemma/docs/core/model_card_4',
    'mistral-small-4': 'https://huggingface.co/mistralai/Mistral-Small-4-119B-2603',
    'mistral-large-3': 'https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512',
    'claude-fable-5': 'https://platform.claude.com/docs/en/about-claude/models/overview',
    'kimi-k3-api': 'https://platform.kimi.ai/docs/guide/kimi-k3-quickstart',
    'qwen3.8-max-preview': 'https://help.aliyun.com/zh/model-studio/models',
  };
  for (const [slug, source] of Object.entries(expectedSource)) {
    assert.ok(bySlug[slug], `missing ${slug}`);
    assert.ok(bySlug[slug].officialSources.includes(source), `${slug} missing exact official source`);
  }
});

test('registry data is deeply immutable', () => {
  assert.equal(Object.isFrozen(MODEL_REGISTRY), true);
  assert.equal(Object.isFrozen(MODEL_REGISTRY.models), true);
  assert.equal(Object.isFrozen(MODEL_REGISTRY.models['deepseek-v4-pro']), true);
  assert.equal(Object.isFrozen(MODEL_REGISTRY.models['deepseek-v4-pro'].facts), true);
  assert.throws(() => { MODEL_REGISTRY.snapshotDate = 'tampered'; }, TypeError);
});

test('largest advertised model is at least 2800B total parameters', () => {
  assert.ok(allRecords().some((record) => record.totalParamsB >= 2800));
});
