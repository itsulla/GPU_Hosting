'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MODEL_REGISTRY } = require('../model-registry.js');

const ROOT = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const tracker = fs.readFileSync(path.join(ROOT, 'GPUHosting_Tracker.csv'), 'utf8');

test('hardware table covers current consumer, inference, AMD, and Blackwell Ultra options', () => {
    assert.match(index, /RTX 4090[\s\S]{0,700}24GB GDDR6X[\s\S]{0,700}Not published on cited page[\s\S]{0,700}\$0\.34\/hr[\s\S]{0,700}\$0\.69 Secure/);
    assert.match(index, /L40S[\s\S]{0,700}48GB GDDR6 ECC[\s\S]{0,700}864 GB\/s[\s\S]{0,700}\$0\.79\/hr[\s\S]{0,700}\$0\.99 Secure/);
    assert.match(index, /MI300X[\s\S]{0,700}192GB HBM3[\s\S]{0,700}5\.3 TB\/s/);
    assert.match(index, /MI325X[\s\S]{0,700}256GB HBM3E[\s\S]{0,700}6 TB\/s/);
    assert.match(index, /B300 provider listing[\s\S]{0,700}288GB listed[\s\S]{0,700}Configuration-specific[\s\S]{0,700}\$6\.94\/hr[\s\S]{0,700}\$7\.39 Secure/);
    assert.match(index, /GB200 NVL72 system[\s\S]{0,700}rack-scale totals[\s\S]{0,200}single GPU row/i);
    assert.match(index, /GB300 NVL72 system[\s\S]{0,700}rack-scale totals[\s\S]{0,200}per-device specification/i);
});

test('tracker mirrors hardware facts and separates manufacturer specs from provider prices', () => {
    for (const name of ['Nvidia RTX 4090', 'Nvidia L40S', 'AMD MI300X', 'AMD MI325X', 'B300 provider listing']) {
        assert.match(tracker, new RegExp(`^${name},`, 'm'));
    }
    assert.match(tracker, /B300 provider listing,288GB listed,HBM3e,Configuration-specific,"RunPod \$6\.94 Community \/ \$7\.39 Secure"/);
});

test('Kimi K3 remains API-available and weights-pending after the July 27 recheck', () => {
    const kimi = MODEL_REGISTRY.models['kimi-k3-api'];
    assert.equal(kimi.category, 'weights-pending');
    assert.equal(kimi.weightsStatus, 'pending');
    assert.equal(kimi.apiAvailable, true);
    assert.equal(kimi.verifiedOn, '2026-07-27');
    assert.match(kimi.facts.join(' '), /still (?:pending|not published)/i);
    assert.match(tracker, /Kimi K3,[^\n]*weights-pending[^\n]*07\/27\/2026/);
});
