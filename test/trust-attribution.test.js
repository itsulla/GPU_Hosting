'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const pages = ['about.html', 'contact.html', 'privacy.html', 'editorial-methodology.html', 'affiliate-disclosure.html'];

test('GPUHosting publishes linked trust pages with a working public correction route', () => {
    const index = read('index.html');
    for (const page of pages) {
        assert.ok(fs.existsSync(path.join(ROOT, page)), `${page} missing`);
        assert.match(index, new RegExp(`href=["']${page.replace('.', '\\.') }["']`));
    }
    assert.match(read('contact.html'), /https:\/\/github\.com\/itsulla\/GPU_Hosting\/issues/i);
    assert.match(read('privacy.html'), /Google Analytics/i);
    assert.match(read('affiliate-disclosure.html'), /editorial independence/i);
});

test('GPUHosting serves the regenerated Tailwind artifact with the current review cache key', () => {
    const index = read('index.html');
    assert.match(index, /tailwind\.generated\.css\?v=20260727["']/);
    assert.doesNotMatch(index, /tailwind\.generated\.css\?v=20260726["']/);
});

test('GPUHosting privacy copy matches semantic, query-free affiliate destinations', () => {
    const privacy = read('privacy.html');
    assert.match(privacy, /semantic category label/i);
    assert.match(privacy, /gpu_provider/);
    assert.match(privacy, /vps_control_plane/);
    assert.doesNotMatch(privacy, /destination origin(?:\s*(?:and|\/)\s*path)?/i);
});

test('GPUHosting configures one GA property and emits exactly one query-free affiliate event', () => {
    const index = read('index.html');
    assert.doesNotMatch(index, /affiliate-events\.js/);

    const loaderIds = [...index.matchAll(/googletagmanager\.com\/gtag\/js\?id=([^&"']+)/g)].map((match) => match[1]);
    const configIds = [...index.matchAll(/gtag\(\s*['"]config['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1]);
    assert.deepEqual(loaderIds, ['G-3GTGPGDL3F']);
    assert.deepEqual(configIds, loaderIds, 'every configured GA property must match the one loaded property');

    const inlineScript = [...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
        .map((match) => match[1])
        .find((script) => script.includes("gtag('event', 'affiliate_click'"));
    assert.ok(inlineScript, 'affiliate listener script missing');

    const dataLayer = [];
    let clickListener;
    const window = {
        dataLayer,
        location: { href: 'https://gpuhosting.guide/?private=do-not-record', pathname: '/' },
    };
    const document = {
        addEventListener(type, listener) {
            assert.equal(type, 'click');
            assert.equal(clickListener, undefined, 'only one delegated click listener should be installed');
            clickListener = listener;
        },
        getElementById() { return null; },
    };
    vm.runInNewContext(inlineScript, { window, document, dataLayer, URL, Date });
    assert.equal(typeof clickListener, 'function');

    const link = {
        href: 'https://runpod.io/?ref=private-referral-code',
        hostname: 'runpod.io',
        dataset: {
            analyticsProvider: 'RunPod',
            analyticsPlacement: 'provider-table',
            analyticsModel: 'Qwen3.6-27B',
            analyticsCalculatorResult: 'not_used',
            analyticsDestination: 'gpu_provider',
            analyticsRelationship: 'direct_referral',
        },
        closest() { return { id: 'providers' }; },
    };
    clickListener({ target: { closest: () => link } });
    clickListener({ target: { closest: () => null } });

    const affiliateCalls = dataLayer
        .map((args) => Array.from(args))
        .filter((args) => args[0] === 'event' && args[1] === 'affiliate_click');
    assert.equal(affiliateCalls.length, 1);
    assert.equal(affiliateCalls[0][2].provider, 'RunPod');
    assert.equal(affiliateCalls[0][2].model_or_tool, 'Qwen3.6-27B');
    assert.equal(affiliateCalls[0][2].destination, 'gpu_provider');
    assert.doesNotMatch(JSON.stringify(affiliateCalls[0][2]), /private|referral-code/);
});
