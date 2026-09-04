const assert = require('node:assert/strict');
const { buildDailyPlan } = require('../miniprogram/utils/daily-plan');

const base = { focusMinutes: 80, goalMinutes: 360, tasks: [{ id: 'math', title: '欧几里得刷题', subject: '考研数学', minutes: 90, done: false }] };
const withReview = buildDailyPlan({ ...base, dueItems: [{ id: 'review', content: '二重积分换元', type: '错题' }] });
assert.equal(withReview.action.kind, 'review');
assert.equal(withReview.remainingMinutes, 280);
assert.equal(withReview.plannedMinutes, 90);

const withTask = buildDailyPlan({ ...base, dueItems: [] });
assert.deepEqual(withTask.action, { kind: 'task', taskId: 'math', title: '欧几里得刷题', subject: '考研数学', minutes: 90 });

const empty = buildDailyPlan({ focusMinutes: 360, goalMinutes: 360, tasks: [], dueItems: [] });
assert.equal(empty.action.kind, 'empty');
assert.equal(empty.remainingMinutes, 0);
console.log('daily plan tests passed');
