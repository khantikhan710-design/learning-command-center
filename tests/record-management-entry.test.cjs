const assert = require('node:assert/strict');
const fs = require('node:fs');

const wxml = fs.readFileSync('miniprogram/pages/record/record.wxml', 'utf8');
const script = fs.readFileSync('miniprogram/pages/record/record.js', 'utf8');

assert.match(wxml, /(bind|catch)tap="openRecordActions"/);
assert.match(script, /openRecordActions\(e\)/);

console.log('record management entry tests passed');
