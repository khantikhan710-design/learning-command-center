function sortTasks(tasks) {
  return [...tasks].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}

function updateTask(tasks, id, patch) {
  return tasks.map(task => task.id === id ? { ...task, ...patch } : task);
}

function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

module.exports = { sortTasks, updateTask, removeTask };
