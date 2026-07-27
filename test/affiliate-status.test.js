'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const tracker = fs.readFileSync(path.join(ROOT, 'GPUHosting_Tracker.csv'), 'utf8');

const DIGITALOCEAN_REFERRAL = 'https://m.do.co/c/0ac1da4ad477';
const HOSTINGER_REFERRAL = 'https://www.hostinger.com?REFERRALCODE=SNPULRICHICN';

test('confirmed direct DigitalOcean and Hostinger referrals are preserved', () => {
    assert.match(index, new RegExp(DIGITALOCEAN_REFERRAL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(index, new RegExp(HOSTINGER_REFERRAL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(tracker, /DigitalOcean,[^\n]*Active direct referral/);
    assert.match(tracker, /Hostinger,[^\n]*Active direct referral/);
});

test('DigitalOcean attribution is not presented as a compound provider relationship', () => {
    assert.doesNotMatch(index, /DigitalOcean \/ Paperspace/);
    assert.doesNotMatch(tracker, /DigitalOcean \/ Paperspace/);
    assert.match(index, /name:'DigitalOcean'.*typeName:'Paperspace Managed Cloud'/);
    assert.match(tracker, /DigitalOcean,Availability varies,Check live account quote,Paperspace managed cloud/);
    assert.match(tracker, /DigitalOcean,[^\n]*Paperspace managed cloud[^\n]*Active direct referral[^\n]*https:\/\/docs\.digitalocean\.com\/products\/paperspace\//);
    assert.doesNotMatch(tracker, /https:\/\/www\.digitalocean\.com\/products\/paperspace/);
});

test('RunPod provider scope, public rate range, and snapshot date match the tracker', () => {
    assert.match(index, /name:'RunPod'[^\n]*B300[^\n]*\$0\.34 — \$7\.39\/GPU-hr/);
    assert.match(tracker, /RunPod[^\n]*B300[^\n]*\$0\.34 - \$7\.39\/GPU-hr/);
    assert.doesNotMatch(index, /Price snapshot checked July 26, 2026|Official-page snapshot checked July 26, 2026/);
    assert.match(index, /Price snapshot checked July 27, 2026/);
    assert.match(index, /Official-page snapshot checked July 27, 2026/);
});

test('unapproved programs are editorial-only and carry no tracking parameter', () => {
    assert.doesNotMatch(index, /vultr\.com\/[^"']*\?ref=/i);
    assert.match(tracker, /Vultr,[^\n]*Not approved/);
    assert.match(tracker, /Liquid Web,[^\n]*Not approved/);
    assert.doesNotMatch(tracker, /linode\.com\/affiliate-program|cloud\.google\.com\/affiliate/i);
});

test('copyable Codex instructions and supporting-service copy use current, non-promotional facts', () => {
    assert.match(index, /@openai\/codex@0\.145\.0/);
    assert.doesNotMatch(index, /@openai\/codex@0\.118\.0/);
    assert.doesNotMatch(index, /Hostinger[^\n]{0,300}\$4\.99|Bluehost[^\n]{0,300}\$3\.79|Namecheap[^\n]{0,300}\$1\.18/i);
});

test('hardware map covers current single-device and rack-scale variants without mixing units', () => {
    for (const label of ['RTX 4090', 'L40S', 'MI300X', 'MI325X', 'B300 provider listing', 'GB200 NVL72 system', 'GB300 NVL72 system']) {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        assert.match(index, new RegExp(escaped), `${label} missing from page`);
        assert.match(tracker, new RegExp(escaped), `${label} missing from tracker`);
    }
    assert.match(index, /B300 provider listing[\s\S]{0,600}288GB listed[\s\S]{0,600}\$6\.94\/hr Community[\s\S]{0,200}\$7\.39 Secure/);
    assert.match(index, /GB200 NVL72 system[\s\S]{0,600}13\.4TB aggregate[\s\S]{0,600}576 TB\/s aggregate/);
    assert.match(index, /GB300 NVL72 system[\s\S]{0,600}20TB aggregate[\s\S]{0,600}Up to 576 TB\/s aggregate/);
});

test('Kimi K3 remains excluded from self-hosting while official weights are unavailable', () => {
    assert.match(index, /API-only and weights-pending records are comparison context, not deployment recommendations/);
    assert.match(tracker, /Kimi K3[^\n]*weights-pending[^\n]*Pending/);
    assert.doesNotMatch(index, /cannot feed self-host deployment recommendations at the 2026-07-26 cutoff/);
    assert.match(index, /latest verified status/);
});

test('GPU affiliate CTAs use the shared exactly-once tracker with contextual dimensions', () => {
    assert.match(index, /data-analytics-event="affiliate_click"/);
    assert.match(index, /data-analytics-provider=/);
    assert.match(index, /data-analytics-relationship=/);
    assert.match(index, /data-analytics-destination=/);
    assert.match(index, /data-analytics-placement=/);
    assert.match(index, /data-analytics-model=/);
    assert.match(index, /data-analytics-calculator-result=/);
    assert.doesNotMatch(index, /window\.umami\.track\(['"]affiliate_click/);
});
