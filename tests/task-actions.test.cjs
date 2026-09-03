const assert = require('node:assert/strict');
const { sortTasks, updateTask, removeTask } = require('../miniprogram/utils/task-actions');

const tasks = [{ id: 'a', pinned: false }, { id: 'b', pinned: true }, { id: 'c', pinned: false }];
assert.deepEqual(sortTasks(tasks).map(x => x.id), ['b', 'a', 'c']);
assert.equal(updateTask(tasks, 'a', { subject: 'AI 学习' })[0].subject, 'AI 学习');
assert.deepEqual(removeTask(tasks, 'b').map(x => x.id), ['a', 'c']);
console.log('task action tests passed');
