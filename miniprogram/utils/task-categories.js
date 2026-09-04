const DEFAULT_TASK_CATEGORIES = ['考研数学', '专业基础', '硬件电路', '英语', 'AI 学习'];
const UNCATEGORIZED = '未分类';

function clean(value) {
  return String(value || '').trim();
}

function normalizeTaskCategories(categories) {
  const source = Array.isArray(categories) ? categories : DEFAULT_TASK_CATEGORIES;
  return source.reduce((result, item) => {
    const name = clean(item);
    return name && name !== UNCATEGORIZED && !result.includes(name) ? [...result, name] : result;
  }, []);
}

function normalizeTaskSubjects(tasks) {
  return (tasks || []).map(task => ({
    ...task,
    subject: task.subject && task.subject !== '自定义' ? task.subject : UNCATEGORIZED
  }));
}

function createCategory(categories, name) {
  const value = clean(name);
  if (!value) return { categories, error: 'empty' };
  if (value === UNCATEGORIZED || categories.includes(value)) return { categories, error: 'duplicate' };
  return { categories: [...categories, value], error: null };
}

function renameCategory(categories, tasks, oldName, newName) {
  const result = createCategory(categories.filter(name => name !== oldName), newName);
  if (result.error) return { categories, tasks, error: result.error };
  const value = clean(newName);
  return {
    categories: result.categories,
    tasks: (tasks || []).map(task => task.subject === oldName ? { ...task, subject: value } : task),
    error: null
  };
}

function deleteCategory(categories, tasks, name) {
  return {
    categories: categories.filter(item => item !== name),
    tasks: (tasks || []).map(task => task.subject === name ? { ...task, subject: UNCATEGORIZED } : task)
  };
}

module.exports = {
  DEFAULT_TASK_CATEGORIES,
  UNCATEGORIZED,
  normalizeTaskCategories,
  normalizeTaskSubjects,
  createCategory,
  renameCategory,
  deleteCategory
};
