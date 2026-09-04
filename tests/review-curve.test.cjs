const assert = require('node:assert/strict');
const { buildReviewCurve, selectCurveItem } = require('../miniprogram/utils/review-curve');

const model = buildReviewCurve({ stage: 2, type: '错题', content: '拉普拉斯变换', next: '2026/9/8' });
assert.equal(model.title, '错题｜拉普拉斯变换');
assert.deepEqual(model.milestones.map(node => node.status), ['done', 'done', 'current', 'future', 'future', 'future']);
assert.equal(model.milestones[2].day, 4);
assert.equal(model.points.length, 31);
assert.ok(model.points[0].retention > model.points.at(-1).retention);

const selected = selectCurveItem([
  { id: 'later', next: '2026/9/12', mastered: false },
  { id: 'soon', next: '2026/9/6', mastered: false },
  { id: 'mastered', next: '2026/9/1', mastered: true }
], [{ id: 'due', next: '2026/9/2', mastered: false }]);
assert.equal(selected.id, 'due');
assert.equal(selectCurveItem([{ id: 'later', next: '2026/9/12', mastered: false }, { id: 'soon', next: '2026/9/6', mastered: false }], []).id, 'soon');
console.log('review curve tests passed');
