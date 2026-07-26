const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const indexPath = path.join(repoRoot, 'index.html');
const registryPath = path.join(repoRoot, 'model-registry.js');
const index = fs.readFileSync(indexPath, 'utf8');
// The registry is an expected artifact of the correction, but its absence must
// produce assertion failures rather than a test-loader crash on the baseline.
const registry = fs.existsSync(registryPath) ? fs.readFileSync(registryPath, 'utf8') : '';
const appSource = `${index}\n${registry}`;

function scriptTagFor(file) {
  return new RegExp(`<script\\b[^>]*src=["'][^"']*${file.replace('.', '\\.')}(?:["'])[^>]*>`, 'i');
}

function metaContent(name) {
  const match = index.match(new RegExp(`<meta\\b[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
  return match ? match[1] : '';
}

test('loads the model registry synchronously before main inline application logic', () => {
  const external = index.match(scriptTagFor('model-registry.js'));
  assert.ok(external, 'index.html must load model-registry.js');
  assert.doesNotMatch(external[0], /\b(?:async|defer)\b/i, 'registry must be synchronous');

  const registryEnd = external.index + external[0].length;
  const appInline = index.indexOf('const AFFILIATES = {');
  assert.ok(appInline > registryEnd, 'registry must precede the main inline app logic');
  assert.doesNotMatch(index, /\bconst\s+models\s*=\s*\[/, 'model facts must not remain inline');
});

test('exposes four visible model-atlas categories and keeps API-only/pending guidance out of self-hosting', () => {
  for (const category of ['self-hostable', 'api-only', 'weights-pending', 'legacy']) {
    assert.match(appSource, new RegExp(`(?:data-category=["']${category}["']|id=["'][^"']*${category}[^"']*["'])`, 'i'), `missing visible ${category} atlas container`);
  }
  assert.match(appSource, /open-weight/i, 'atlas copy must use open-weight terminology');
  assert.doesNotMatch(appSource, /blanket.{0,30}open-source|open-source.{0,30}(?:all|every|models)/i);
  assert.match(appSource, /api-only[\s\S]{0,500}(?:exclude|not|cannot|do not).{0,120}(?:self-host|deploy)/i, 'API-only records need an explicit exclusion');
  assert.match(appSource, /weights-pending[\s\S]{0,500}(?:exclude|not|cannot|do not).{0,120}(?:self-host|deploy)/i, 'pending records need an explicit exclusion');
});

test('renders exact identities, registry evidence, and deployment metadata with safe HTTPS source links', () => {
  for (const field of ['modelId', 'apiId', 'verifiedOn', 'evidence', 'category', 'license', 'weights', 'totalParams', 'activeParams']) {
    assert.match(appSource, new RegExp(`\\b${field}\\b`, 'i'), `registry/rendering contract missing ${field}`);
  }
  assert.match(index, /getDisplayIdentifiers\(record\)/i, 'renderer must normalize identifiers through the runtime-tested helper');
  assert.match(index, /['"]Model ID['"]\s*,\s*identifiers\.modelId/i, 'expanded cards must render the normalized model ID');
  assert.match(index, /['"]API ID['"]\s*,\s*identifiers\.apiId/i, 'expanded cards must render the normalized API ID');
  assert.match(appSource, /(?:officialSource|sourceUrl|officialUrl|sources)/i, 'official source metadata is required');
  assert.match(appSource, /https:\/\//i, 'official/source links must use HTTPS');
  assert.match(index, /link\.href\s*=\s*url/i, 'renderer must assign each validated source URL to its anchor');
  assert.match(index, /link\.target\s*=\s*["']_blank["']/i, 'renderer must open source links in a separate tab');
  assert.match(index, /link\.rel\s*=\s*["'][^"']*(?:noopener|noreferrer)[^"']*["']/i, 'blank-target source anchors need a safe rel');
});

test('removes unsupported or stale homepage literals', () => {
  const forbidden = [
    /DeepSeek V3\.2/i,
    /Qwen 3\.5/i,
    /unreleased successor rumor/i,
    /Mistral\s*\/\s*Mixtral/i,
    /26B MoE is 8GB VRAM sweet spot/i,
    /\b(?:\d+(?:\.\d+)?\s*)tok\/s\b/i,
    /Q4_K_XL/i,
    /Specification review\s*[·•|:-]\s*03\/2026/i,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(index, pattern, `unsupported literal remains: ${pattern}`);
});

test('metadata describes an open-weight-first guide without advertising DeepSeek V3.2 or Qwen 3.5 as current', () => {
  const metadata = [metaContent('description'), metaContent('keywords'), metaContent('og:description'), metaContent('twitter:description')].join(' ');
  assert.match(`${metadata}\n${index.slice(0, 20000)}`, /open[- ]weight[- ]first/i);
  assert.doesNotMatch(metadata, /DeepSeek V3\.2|Qwen 3\.5/i);
});

test('supports 3T VRAM planning with coarse precision bytes and honest cluster-scale wording', () => {
  const slider = index.match(/<input\b[^>]*id=["']param-slider["'][^>]*>/i);
  assert.ok(slider, 'parameter slider is required');
  const max = Number((slider[0].match(/\bmax=["']([^"']+)["']/i) || [])[1]);
  assert.ok(max >= 3000, `parameter slider max must reach at least 3000B, got ${max}`);
  assert.match(index, />3T</i);

  assert.match(index, /data-multiplier=["']2["'][^>]*>FP16/i);
  assert.match(index, /data-multiplier=["']1["'][^>]*>(?:8-Bit|INT8)/i);
  assert.match(index, /data-multiplier=["']0\.5["'][^>]*>(?:4-Bit|INT4)/i);
  assert.match(index, /weights[- ]only/i);
  assert.match(index, /20%|1\.2|runtime allowance/i);
  assert.match(index, /KV cache[^<]*(?:not|exclude|separate)/i);
  assert.match(appSource, /cluster[- ]scale/i);
  assert.match(appSource, /(?:validate|check|verify).{0,100}(?:topology|shard|runtime)/i);
});

test('sizes weights from total parameters while exposing active parameters separately for compute planning', () => {
  assert.match(appSource, /totalParams/i, 'total parameter metadata is required');
  assert.match(appSource, /activeParams/i, 'active parameter metadata/control is required');
  assert.match(appSource, /(?:active parameters|active params|dense|MoE)[^<\n]{0,100}(?:speed|compute|throughput)/i);
  assert.match(appSource, /(?:weightsOnly|weightMemory|weightResidency)[^\n]{0,240}(?:totalParams|total params)/i, 'weight sizing must use total parameters');
  assert.doesNotMatch(appSource, /(?:weightsOnly|weightMemory|weightResidency)[^\n]{0,240}activeParams/i, 'active parameters must not reduce weight residency');
});

test('wizard recommendations are sourced from current self-hostable families, never API-only or pending records', () => {
  const wizardStart = index.indexOf('function showWizardResult');
  const wizardEnd = index.indexOf('window.resetWizard', wizardStart);
  const wizardSource = index.slice(wizardStart, wizardEnd);
  assert.match(registry, /function\s+selectWizardCandidate[\s\S]{0,1200}getDeploymentEligibleModels\(\)/i, 'runtime selector must consume fail-closed deployment eligibility');
  assert.match(registry, /function\s+isDeploymentEligible[\s\S]{0,400}self-hostable[\s\S]{0,400}public-weights/i);
  assert.match(index, /selectWizardCandidate\(wizardState\[1\],\s*wizardState\[3\]\)/i, 'wizard must call the runtime-tested registry selector');
  assert.doesNotMatch(wizardSource, /\bSupported GGUF\b/i, 'wizard must not assert an unverified runtime artifact');
  assert.doesNotMatch(index, /showWizardResult[\s\S]{0,3000}(?:DeepSeek V3\.2|Qwen 3\.5)/i);
});

test('preserves safe deployment invariants without credentials or public inference binds', () => {
  assert.doesNotMatch(appSource, /0\.0\.0\.0(?::|\s)/, 'inference services must not publish on all interfaces');
  assert.doesNotMatch(appSource, /(?:sk-[A-Za-z0-9]{20,}|hf_[A-Za-z0-9]{20,}|(?:API|ACCESS|SECRET)[_-]?KEY\s*=\s*["'][A-Za-z0-9_-]{20,})/i, 'credentials must not be committed');
  assert.match(index, /OLLAMA_IMAGE=ollama\/ollama:0\.32\.4@sha256:10c13eb515db310990527d36ca14a136da4bcc0fbf2bf3b15e9c1f111e9d3cd4/);
  assert.match(index, /-p 127\.0\.0\.1:11434:11434/);
  assert.match(index, /-p 127\.0\.0\.1:8000:11434/);
  assert.match(index, /vllm\/vllm-openai:v0\.26\.0/);
});
