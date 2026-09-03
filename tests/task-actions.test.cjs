const assert = require('node:assert/strict');
const { sortTasks, updateTask, removeTask, ensureTaskOrder } = require('../miniprogram/utils/task-actions');

const tasks = [{ id: 'a', pinned: false }, { id: 'b', pinned: true }, { id: 'c', pinned: false }];
assert.deepEqual(sortTasks(tasks).map(x => x.id), ['b', 'a', 'c']);
assert.equal(updateTask(tasks, 'a', { subject: 'AI 学习' })[0].subject, 'AI 学习');
assert.deepEqual(removeTask(tasks, 'b').map(x => x.id), ['a', 'c']);

const stableTasks = ensureTaskOrder([{ id: 'a', pinned: false }, { id: 'b', pinned: false }, { id: 'c', pinned: false }]);
const pinned = sortTasks(updateTask(stableTasks, 'b', { pinned: true }));
assert.deepEqual(pinned.map(x => x.id), ['b', 'a', 'c']);
const restored = sortTasks(updateTask(pinned, 'b', { pinned: false }));
assert.deepEqual(restored.map(x => x.id), ['a', 'b', 'c']);
console.log('task action tests passed');
