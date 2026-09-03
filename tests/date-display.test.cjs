const assert = require('node:assert/strict');
const { formatRecordDate } = require('../miniprogram/utils/date-display');

assert.equal(formatRecordDate('2026-09-03T04:30:00.000Z'), '2026/09/03 12:30');
assert.equal(formatRecordDate('Wed Sep 03 2026 12:30:00 GMT+0800 (中国标准时间)'), '2026/09/03 12:30');
console.log('date display tests passed');
