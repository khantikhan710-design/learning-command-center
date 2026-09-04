const assert = require('node:assert/strict');
const { getTaskDragState } = require('../miniprogram/utils/task-drag');

const state = getTaskDragState({
  startY: 200,
  currentY: 330,
  rectangles: [{ top: 100, bottom: 180 }, { top: 200, bottom: 280 }, { top: 300, bottom: 380 }],
  tasks: [{ id: 'first' }, { id: 'second' }, { id: 'third' }]
});

assert.deepEqual(state, { offsetY: 120, targetId: 'third' });
assert.deepEqual(getTaskDragState({
  startY: 200,
  currentY: 160,
  rectangles: [{ top: 100, bottom: 180 }],
  tasks: [{ id: 'first' }]
}), { offsetY: -40, targetId: 'first' });
console.log('task drag tests passed');
