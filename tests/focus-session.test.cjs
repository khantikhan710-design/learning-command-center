const assert = require('node:assert/strict');
const { startSession, remainingSeconds, pauseSession, resumeSession, shouldFinish } = require('../miniprogram/utils/focus-session');

const started = startSession(25 * 60, 1000, { subject: '考研数学', taskId: 'math' });
assert.equal(remainingSeconds(started, 1000), 1500);
assert.equal(started.subject, '考研数学');
assert.equal(started.taskId, 'math');
assert.equal(remainingSeconds(started, 1000 + 321000), 1179);
assert.equal(shouldFinish(started, 1000 + 1500000), true);

const paused = pauseSession(started, 1000 + 60000);
assert.equal(paused.running, false);
assert.equal(remainingSeconds(paused, 1000 + 600000), 1440);
const resumed = resumeSession(paused, 2000000);
assert.equal(resumed.endsAt, 3440000);
assert.equal(remainingSeconds(resumed, 2000000 + 1440000), 0);
console.log('focus session tests passed');
