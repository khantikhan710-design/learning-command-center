const assert = require('node:assert/strict');
const { useBreak, beginExit, returnFromBreak, formatElapsed } = require('../miniprogram/utils/focus-guard');

assert.deepEqual(useBreak(3), { allowed: true, remaining: 2, seconds: 300 }, 'a break uses one of three 5-minute passes');
assert.deepEqual(useBreak(0), { allowed: false, remaining: 0, seconds: 0 }, 'no break may start after all passes are used');
assert.deepEqual(beginExit(true, 3), { paused: true, allowed: true, remaining: 2, seconds: 300 }, 'leaving during strict focus pauses the study timer and starts one break');
assert.deepEqual(returnFromBreak(), { onBreak: false, breakSeconds: 0 }, 'returning to the mini program ends the break immediately');
assert.equal(formatElapsed(138), '2 分 18 秒');
assert.equal(formatElapsed(0), '0 秒');
console.log('strict focus guard tests passed');
