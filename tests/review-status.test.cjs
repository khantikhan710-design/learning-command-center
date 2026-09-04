const assert = require('node:assert/strict');
const { dueReviews, buildDailySummary } = require('../miniprogram/utils/review-status');

const now = new Date('2026-09-04T12:00:00+08:00');
const reviews = [
  { id: 1, content: '已到期', next: '2026/9/4', mastered: false },
  { id: 2, content: '逾期', next: '2026/9/2', mastered: false },
  { id: 3, content: '未来', next: '2026/9/5', mastered: false },
  { id: 4, content: '已掌握', next: '2026/9/1', mastered: true },
  { id: 5, content: '无效', next: 'not-a-date', mastered: false }
];

const dueItems = dueReviews(reviews, now);
assert.deepEqual(dueItems.map(item => item.id), [1, 2]);
assert.equal(
  buildDailySummary({ date: now, completed: 2, total: 4, focusMinutes: 75, goalMinutes: 360, dueItems }),
  '学习指挥台｜2026/9/4\n任务：已完成 2/4 项\n专注：75 分钟 / 360 分钟\n待复习：2 条\n- 已到期\n- 逾期'
);
console.log('review status tests passed');
