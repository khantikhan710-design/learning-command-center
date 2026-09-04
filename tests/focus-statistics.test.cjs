const assert = require('node:assert/strict');
const { sessionsForWeek, summarizeSessions } = require('../miniprogram/utils/focus-statistics');

const now = new Date('2026-09-04T12:00:00+08:00').getTime();
const sessions = [
  { minutes: 30, endedAt: new Date('2026-09-01T08:00:00+08:00').getTime(), subject: '考研数学', taskTitle: '欧几里得刷题' },
  { minutes: 20, endedAt: new Date('2026-09-04T09:00:00+08:00').getTime(), subject: '英语', taskTitle: '' },
  { minutes: 50, endedAt: new Date('2026-08-30T09:00:00+08:00').getTime(), subject: '考研数学' }
];

assert.equal(sessionsForWeek(sessions, now).length, 2);
assert.deepEqual(summarizeSessions(sessionsForWeek(sessions, now)), {
  totalMinutes: 50,
  subjects: [{ name: '考研数学', minutes: 30 }, { name: '英语', minutes: 20 }],
  tasks: [{ name: '欧几里得刷题', minutes: 30 }]
});
console.log('focus statistics tests passed');
