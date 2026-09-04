const assert = require('node:assert/strict');
const { parseGoalHours, formatGoalMinutes, goalMinutesFromPicker, goalPickerValue } = require('../miniprogram/utils/goal-time');

assert.equal(parseGoalHours('6'), 360);
assert.equal(parseGoalHours('1.5'), 90);
assert.equal(parseGoalHours('0'), null);
assert.equal(parseGoalHours('25'), null);
assert.equal(formatGoalMinutes(360), '6 小时');
assert.equal(formatGoalMinutes(90), '1 小时 30 分钟');
assert.equal(goalMinutesFromPicker('06', '30'), 390);
assert.equal(goalMinutesFromPicker('00', '00'), null);
assert.deepEqual(goalPickerValue(390), [6, 2]);
console.log('goal time tests passed');
