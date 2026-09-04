const assert = require('node:assert/strict');
const { INSIGHTS, getDailyInsight, getNextInsight } = require('../miniprogram/utils/daily-insights');

const sameDayFirst = getDailyInsight('2026-09-05');
const sameDaySecond = getDailyInsight('2026-09-05T23:59:59.000+08:00');
const nextDay = getDailyInsight('2026-09-06');

assert.deepEqual(sameDayFirst, sameDaySecond);
assert.notEqual(sameDayFirst.title, nextDay.title);
assert.ok(sameDayFirst.type);
assert.ok(sameDayFirst.source);
assert.ok(sameDayFirst.content);
assert.deepEqual(getNextInsight(0), { insight: INSIGHTS[0], nextIndex: 1 });
assert.deepEqual(getNextInsight(INSIGHTS.length - 1), { insight: INSIGHTS[INSIGHTS.length - 1], nextIndex: 0 });
console.log('daily insight tests passed');
