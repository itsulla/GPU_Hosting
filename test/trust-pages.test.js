'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const pages = {
    'about.html': /independent/i,
    'contact.html': /https:\/\/github\.com\/itsulla\/GPU_Hosting\/issues/i,
    'privacy.html': /Google Analytics/i,
    'editorial-methodology.html': /first-party/i,
    'affiliate-disclosure.html': /commission|referral/i,
};

test('GPUHosting publishes complete, linked trust pages', () => {
    const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    for (const [file, expected] of Object.entries(pages)) {
        const page = fs.readFileSync(path.join(ROOT, file), 'utf8');
        assert.match(page, /<title>[^<]+<\/title>/i, `${file} title`);
        assert.match(page, /href="\/"/, `${file} home link`);
        assert.match(page, expected, `${file} required disclosure`);
        assert.match(home, new RegExp(`href=["']${file.replace('.', '\\.')}["']`), `${file} footer link`);
    }
});
