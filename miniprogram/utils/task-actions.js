function sortTasks(tasks) {
  return [...tasks].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (a.order || 0) - (b.order || 0));
}

function ensureTaskOrder(tasks) {
  return tasks.map((task, index) => Number.isFinite(task.order) ? task : { ...task, order: index });
}

function nextTopOrder(tasks) {
  const orders = tasks.map(task => Number.isFinite(task.order) ? task.order : 0);
  return Math.min(0, ...orders) - 1;
}

function updateTask(tasks, id, patch) {
  return tasks.map(task => task.id === id ? { ...task, ...patch } : task);
}

function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

function createTask(tasks, task, now = new Date().toISOString()) {
  return [...tasks, { ...task, createdAt: now }];
}

function toggleTaskDone(tasks, id, now = new Date().toISOString()) {
  return tasks.map(task => {
    if (task.id !== id) return task;
    if (!task.done) return { ...task, done: true, completedAt: now };
    const { completedAt, ...restored } = task;
    return { ...restored, done: false };
  });
}

function splitTasks(tasks) {
  return {
    pending: tasks.filter(task => !task.done),
    completed: tasks.filter(task => task.done)
  };
}

function reorderPendingTasks(tasks, movingId, targetId) {
  const moving = tasks.find(task => task.id === movingId);
  const target = tasks.find(task => task.id === targetId);
  if (!moving || !target || moving.done || target.done || Boolean(moving.pinned) !== Boolean(target.pinned)) return tasks;

  const group = sortTasks(tasks).filter(task => !task.done && Boolean(task.pinned) === Boolean(moving.pinned));
  const fromIndex = group.findIndex(task => task.id === movingId);
  const toIndex = group.findIndex(task => task.id === targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return tasks;

  const reorderedGroup = [...group];
  const [moved] = reorderedGroup.splice(fromIndex, 1);
  reorderedGroup.splice(toIndex, 0, moved);
  const orderById = new Map(reorderedGroup.map((task, index) => [task.id, index]));
  return tasks.map(task => orderById.has(task.id) ? { ...task, order: orderById.get(task.id) } : task);
}

module.exports = { sortTasks, ensureTaskOrder, nextTopOrder, updateTask, removeTask, createTask, toggleTaskDone, splitTasks, reorderPendingTasks };
