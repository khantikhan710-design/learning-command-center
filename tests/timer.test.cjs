const assert = require('node:assert/strict');
const { toSeconds, fromSeconds } = require('../miniprogram/utils/timer');

assert.equal(toSeconds(25, 0), 1500, '25 minutes should become 1500 seconds');
assert.deepEqual(fromSeconds(1500), { minutes: 25, seconds: 0 }, '1500 seconds should display as 25:00');
assert.deepEqual(fromSeconds(59), { minutes: 0, seconds: 59 }, 'sub-minute choices should remain selectable');
console.log('timer picker behavior tests passed');
