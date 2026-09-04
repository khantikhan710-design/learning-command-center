const assert = require('node:assert/strict');
const { createBackup, parseBackup, summarizeBackup } = require('../miniprogram/utils/local-backup');

const storage = {
  studyTasks: [{ id: 't1', title: '电路刷题' }],
  studyTaskCategories: ['专业基础'],
  studyRecords: [{ id: 'r1', content: '节点电压法' }],
  recordCategories: ['考研数学'],
  reviewItems: [{ id: 'v1', content: '复习戴维南定理' }],
  reviewCategories: ['概念'],
  focusMinutes: 150,
  studyActiveDates: ['2026/9/4']
};
const text = createBackup(storage, '2026-09-04T09:00:00.000Z');
const backup = parseBackup(text);
assert.equal(backup.format, 'study-command-center-backup');
assert.equal(backup.exportedAt, '2026-09-04T09:00:00.000Z');
assert.deepEqual(backup.data.studyTasks, storage.studyTasks);
assert.deepEqual(summarizeBackup(backup), { tasks: 1, records: 1, reviews: 1, focusMinutes: 150 });
const emptyBackup = parseBackup(createBackup({}));
assert.deepEqual(summarizeBackup(emptyBackup), { tasks: 0, records: 0, reviews: 0, focusMinutes: 0 });
const blankStorageBackup = parseBackup(createBackup({ studyTasks: '', focusMinutes: '' }));
assert.deepEqual(summarizeBackup(blankStorageBackup), { tasks: 0, records: 0, reviews: 0, focusMinutes: 0 });
assert.throws(() => parseBackup('{bad json'), /备份内容不是有效 JSON/);
assert.throws(() => parseBackup(JSON.stringify({ format: 'other-app', data: {} })), /不是学习指挥台备份/);
console.log('local backup tests passed');
