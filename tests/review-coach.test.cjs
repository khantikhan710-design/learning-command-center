const assert = require('node:assert/strict');
const { recordReviewDay, buildReviewCoach } = require('../miniprogram/utils/review-coach');

const now = new Date('2026-09-04T12:00:00+08:00');

assert.deepEqual(recordReviewDay(['2026/9/4'], now), ['2026/9/4']);
assert.deepEqual(recordReviewDay(['2026/9/2'], now), ['2026/9/2', '2026/9/4']);

assert.deepEqual(buildReviewCoach({ activityDates: [], dueCount: 0, reviewCount: 0, now }), {
  title: '从第一条开始', message: '添加一条错题或概念，建立自己的复习队列。', streak: 0, missedDays: 0
});
assert.deepEqual(buildReviewCoach({ activityDates: ['2026/9/4'], dueCount: 1, reviewCount: 3, now }), {
  title: '连续复习第 1 天', message: '今天先完成一条，先把节奏建立起来。', streak: 1, missedDays: 0
});
assert.deepEqual(buildReviewCoach({ activityDates: ['2026/9/2', '2026/9/3', '2026/9/4'], dueCount: 1, reviewCount: 3, now }), {
  title: '节奏已建立', message: '连续复习 3 天，优先完成今天到期内容。', streak: 3, missedDays: 0
});
assert.deepEqual(buildReviewCoach({ activityDates: ['2026/9/2', '2026/9/3'], dueCount: 1, reviewCount: 3, now }), {
  title: '别让节奏断掉', message: '昨天已连续复习 2 天，今天完成一条即可续上。', streak: 2, missedDays: 0
});
assert.deepEqual(buildReviewCoach({ activityDates: ['2026/9/1'], dueCount: 1, reviewCount: 3, now }), {
  title: '重新衔接', message: '已间隔 2 天，今天先处理最早到期的一条，不补量。', streak: 0, missedDays: 2
});
assert.deepEqual(buildReviewCoach({ activityDates: ['2026/9/1'], dueCount: 4, reviewCount: 4, now }), {
  title: '先清复习积压', message: '现在有 4 条待复习，先完成最早 3 条，再做新内容。已间隔 2 天，今天不补量。', streak: 0, missedDays: 2
});

console.log('review coach tests passed');
