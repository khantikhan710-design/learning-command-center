const assert = require('node:assert/strict');
const fs = require('node:fs');

const script = fs.readFileSync('miniprogram/pages/record/record.js', 'utf8');
const wxml = fs.readFileSync('miniprogram/pages/record/record.wxml', 'utf8');

assert.match(script, /saveLocalFilesWithStatus/);
assert.match(script, /confirmKeepSourceOnly/);
assert.match(script, /showSourceGuide/);
assert.match(wxml, /原件未保存/);

console.log('record source flow tests passed');
