const assert = require('node:assert/strict');
const { buildWeeklyReview } = require('../miniprogram/utils/weekly-review');

const now = new Date('2026-09-05T12:00:00+08:00');
const summary = buildWeeklyReview({
  now,
  tasks: [
    { id: 'a', subject: '考研数学', createdAt: '2026-09-02T08:00:00+08:00', completedAt: '2026-09-03T08:00:00+08:00' },
    { id: 'b', subject: '硬件电路', createdAt: '2026-09-04T08:00:00+08:00' }
  ],
  sessions: [
    { subject: '考研数学', minutes: 60, endedAt: new Date('2026-09-04T08:00:00+08:00').getTime() },
    { subject: '硬件电路', minutes: 30, endedAt: new Date('2026-09-05T08:00:00+08:00').getTime() }
  ],
  reviews: [
    { type: '电路', next: '2026/9/4', mastered: false },
    { type: '电路', next: '2026/9/1', mastered: false },
    { type: '高数', next: '2026/9/3', mastered: false }
  ],
  activityDates: ['2026/9/3', '2026/9/4', '2026/9/5']
});

assert.deepEqual(summary.plan, { total: 2, completed: 1, percent: 50 });
assert.deepEqual(summary.subjects, [
  { name: '考研数学', minutes: 60, percent: 67 },
  { name: '硬件电路', minutes: 30, percent: 33 }
]);
assert.deepEqual(summary.weakTopics, [{ name: '电路', dueCount: 2 }, { name: '高数', dueCount: 1 }]);
assert.equal(summary.streak, 3);

const empty = buildWeeklyReview({ tasks: [], sessions: [], reviews: [], activityDates: [], now });
assert.deepEqual(empty.plan, { total: 0, completed: 0, percent: 0 });
assert.deepEqual(empty.weakTopics, []);
console.log('weekly review tests passed');
