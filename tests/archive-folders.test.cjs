const assert = require('node:assert/strict');
const { buildMonthlyFolders, toggleFolderOpen, buildRecordClipboardText, filterRecordsBySource, updateRecordById } = require('../miniprogram/utils/archive-folders');

const folders = buildMonthlyFolders(
  [{ id: 'r1', date: '2026-09-03T04:30:00.000Z', content: '节点电压法' }, { id: 'r2', date: '2026-08-20T04:30:00.000Z', content: '模电' }],
  [{ id: 'v1', created: '2026/9/2', content: '线性代数' }],
  [
    { id: 't1', title: '电路刷题', createdAt: '2026-09-01T04:30:00.000Z', completedAt: '2026-09-03T04:30:00.000Z', done: true },
    { id: 't2', title: '整理错题', createdAt: '2026-08-20T04:30:00.000Z', done: false },
    { id: 'legacy', title: '旧任务，没有日期' }
  ]
);
assert.deepEqual(folders.map(folder => [folder.key, folder.recordCount, folder.reviewCount, folder.taskCount]), [['2026-09', 1, 1, 1], ['2026-08', 1, 0, 1]]);
assert.equal(folders[0].label, '2026 年 09 月');
assert.deepEqual(folders[0].tasks.map(task => task.id), ['t1']);
assert.deepEqual(toggleFolderOpen({}, '2026-09'), { '2026-09': true });
assert.deepEqual(toggleFolderOpen({ '2026-09': true }, '2026-09'), { '2026-09': false });
assert.equal(buildRecordClipboardText({ title: '节点法例题', content: '列 KCL 方程后联立求解' }), '节点法例题\n列 KCL 方程后联立求解');
assert.equal(buildRecordClipboardText({ title: '', content: '仅有正文' }), '仅有正文');
assert.equal(filterRecordsBySource([{ id: 'a', source: 'Goodnotes' }, { id: 'b', source: 'WPS 扫描' }], 'Goodnotes').length, 1);
assert.deepEqual(updateRecordById([{ id: 'a', pinned: false }], 'a', record => ({ ...record, pinned: true })), [{ id: 'a', pinned: true }]);
console.log('archive folder tests passed');
