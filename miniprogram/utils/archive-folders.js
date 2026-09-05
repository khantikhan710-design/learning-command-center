function monthKey(value) {
  const text = String(value || '');
  const matched = text.match(/(\d{4})[\-/年](\d{1,2})/);
  if (matched) return `${matched[1]}-${String(matched[2]).padStart(2, '0')}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未分类日期';
  const parts = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit' }).formatToParts(date);
  const lookup = parts.reduce((map, part) => ({ ...map, [part.type]: part.value }), {});
  return `${lookup.year}-${lookup.month}`;
}

function buildMonthlyFolders(records, reviews, tasks = []) {
  const buckets = {};
  const add = (key, field, item) => {
    if (!buckets[key]) buckets[key] = { key, records: [], reviews: [], tasks: [] };
    if (!buckets[key][field].some(entry => entry.id === item.id)) buckets[key][field].push(item);
  };
  records.forEach(record => add(monthKey(record.date), 'records', record));
  reviews.forEach(review => add(monthKey(review.created || review.masteredAt), 'reviews', review));
  tasks.forEach(task => {
    const keys = [...new Set([task.createdAt, task.completedAt]
      .filter(Boolean)
      .map(monthKey)
      .filter(key => key !== '未分类日期'))];
    keys.forEach(key => add(key, 'tasks', task));
  });
  return Object.values(buckets).sort((a, b) => b.key.localeCompare(a.key)).map(folder => ({
    ...folder,
    label: folder.key === '未分类日期' ? folder.key : `${folder.key.slice(0, 4)} 年 ${folder.key.slice(5)} 月`,
    recordCount: folder.records.length,
    reviewCount: folder.reviews.length,
    taskCount: folder.tasks.length
  }));
}

function toggleFolderOpen(open, key) {
  const state = open || {};
  return {
    ...state,
    [key]: !Boolean(state[key])
  };
}

module.exports = { buildMonthlyFolders, monthKey, toggleFolderOpen };
