const { normalizeTaskCategories, UNCATEGORIZED } = require('./task-categories');

function buildFocusAttribution(tasks, categories) {
  const taskOptions = [{ id: '', title: '不关联具体任务', subject: '' }];
  const subjectOptions = [UNCATEGORIZED, ...normalizeTaskCategories(categories)];
  (tasks || []).filter(task => !task.done).forEach(task => {
    const subject = String(task.subject || UNCATEGORIZED).trim() || UNCATEGORIZED;
    if (subject !== UNCATEGORIZED && !subjectOptions.includes(subject)) subjectOptions.push(subject);
    taskOptions.push({ id: task.id, title: task.title || '未命名任务', subject });
  });
  return { subjectOptions, taskOptions };
}

module.exports = { buildFocusAttribution };
