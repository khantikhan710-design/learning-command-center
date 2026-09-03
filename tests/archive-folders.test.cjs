const assert = require('node:assert/strict');
const { buildMonthlyFolders } = require('../miniprogram/utils/archive-folders');

const folders = buildMonthlyFolders(
  [{ id: 'r1', date: '2026-09-03T04:30:00.000Z', content: '节点电压法' }, { id: 'r2', date: '2026-08-20T04:30:00.000Z', content: '模电' }],
  [{ id: 'v1', created: '2026/9/2', content: '线性代数' }]
);
assert.deepEqual(folders.map(folder => [folder.key, folder.recordCount, folder.reviewCount]), [['2026-09', 1, 1], ['2026-08', 1, 0]]);
assert.equal(folders[0].label, '2026 年 09 月');
console.log('archive folder tests passed');
