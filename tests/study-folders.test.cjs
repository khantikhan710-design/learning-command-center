const assert = require('node:assert/strict');
const { mergeCategories, buildFolders, markMastered, unmarkMastered } = require('../miniprogram/utils/study-folders');

assert.deepEqual(mergeCategories(['考研数学'], '模电专题'), ['考研数学', '模电专题']);
assert.deepEqual(mergeCategories(['考研数学'], '考研数学'), ['考研数学']);

const records = [{ id: 'r1', subject: '模电专题', pinned: false }];
assert.deepEqual(buildFolders(records, ['模电专题']), [{ name: '模电专题', count: 1, items: records }]);

const reviewed = markMastered([{ id: 'v1', mastered: false }], 'v1', '2026/9/3');
assert.equal(reviewed[0].mastered, true);
assert.equal(reviewed[0].masteredAt, '2026/9/3');

const restored = unmarkMastered([{ id: 'v1', mastered: true, masteredAt: '2026/9/3', stage: 3 }], 'v1');
assert.equal(restored[0].mastered, false);
assert.equal(restored[0].masteredAt, undefined);
assert.equal(restored[0].stage, 3);
console.log('study folder tests passed');
