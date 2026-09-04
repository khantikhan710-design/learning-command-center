const assert = require('node:assert/strict');
const {
  DEFAULT_TASK_CATEGORIES, UNCATEGORIZED, normalizeTaskCategories,
  normalizeTaskSubjects, createCategory, renameCategory, deleteCategory
} = require('../miniprogram/utils/task-categories');

assert.deepEqual(DEFAULT_TASK_CATEGORIES, ['考研数学', '专业基础', '硬件电路', '英语', 'AI 学习']);
assert.deepEqual(normalizeTaskCategories([' 英语 ', '英语', '未分类', '']), ['英语']);
assert.deepEqual(normalizeTaskSubjects([{ id: 'a', subject: '自定义' }, { id: 'b' }]), [
  { id: 'a', subject: UNCATEGORIZED }, { id: 'b', subject: UNCATEGORIZED }
]);
assert.deepEqual(createCategory(['英语'], ' 通信原理 '), { categories: ['英语', '通信原理'], error: null });
assert.equal(createCategory(['英语'], '英语').error, 'duplicate');
assert.equal(createCategory(['英语'], ' ').error, 'empty');
assert.deepEqual(renameCategory(['英语', '通信原理'], [{ id: 'a', subject: '通信原理' }], '通信原理', '信号与系统'), {
  categories: ['英语', '信号与系统'], tasks: [{ id: 'a', subject: '信号与系统' }], error: null
});
assert.deepEqual(deleteCategory(['英语', '通信原理'], [{ id: 'a', subject: '通信原理' }], '通信原理'), {
  categories: ['英语'], tasks: [{ id: 'a', subject: UNCATEGORIZED }]
});
console.log('task category tests passed');
