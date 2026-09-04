const assert = require('node:assert/strict');
const { buildFocusAttribution } = require('../miniprogram/utils/focus-attribution');

const result = buildFocusAttribution([
  { id: 'math', title: '欧几里得刷题', subject: '考研数学', done: false },
  { id: 'legacy', title: '旧任务', subject: '信号与系统', done: false },
  { id: 'finished', title: '已完成任务', subject: '英语', done: true }
], ['专业基础', '考研数学', '英语']);

assert.deepEqual(result.subjectOptions, ['未分类', '专业基础', '考研数学', '英语', '信号与系统']);
assert.deepEqual(result.taskOptions, [
  { id: '', title: '不关联具体任务', subject: '' },
  { id: 'math', title: '欧几里得刷题', subject: '考研数学' },
  { id: 'legacy', title: '旧任务', subject: '信号与系统' }
]);
console.log('focus attribution tests passed');
