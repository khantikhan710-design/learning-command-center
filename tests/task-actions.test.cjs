const assert = require('node:assert/strict');
const { sortTasks, updateTask, removeTask, ensureTaskOrder, createTask, toggleTaskDone } = require('../miniprogram/utils/task-actions');

const tasks = [{ id: 'a', pinned: false }, { id: 'b', pinned: true }, { id: 'c', pinned: false }];
assert.deepEqual(sortTasks(tasks).map(x => x.id), ['b', 'a', 'c']);
assert.equal(updateTask(tasks, 'a', { subject: 'AI 学习' })[0].subject, 'AI 学习');
assert.deepEqual(removeTask(tasks, 'b').map(x => x.id), ['a', 'c']);

const stableTasks = ensureTaskOrder([{ id: 'a', pinned: false }, { id: 'b', pinned: false }, { id: 'c', pinned: false }]);
const pinned = sortTasks(updateTask(stableTasks, 'b', { pinned: true }));
assert.deepEqual(pinned.map(x => x.id), ['b', 'a', 'c']);
const restored = sortTasks(updateTask(pinned, 'b', { pinned: false }));
assert.deepEqual(restored.map(x => x.id), ['a', 'b', 'c']);

const created = createTask([], { id: 'new', title: '电路刷题', done: false }, '2026-09-04T08:00:00.000Z');
assert.equal(created[0].createdAt, '2026-09-04T08:00:00.000Z');
const completed = toggleTaskDone(created, 'new', '2026-09-04T09:00:00.000Z');
assert.equal(completed[0].done, true);
assert.equal(completed[0].completedAt, '2026-09-04T09:00:00.000Z');
const reopened = toggleTaskDone(completed, 'new', '2026-09-04T10:00:00.000Z');
assert.equal(reopened[0].done, false);
assert.equal('completedAt' in reopened[0], false);
console.log('task action tests passed');
