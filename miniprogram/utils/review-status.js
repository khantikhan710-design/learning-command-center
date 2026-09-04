function localDay(date) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function parseChineseDate(value) {
  const match = String(value || '').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

function dueReviews(items, now = new Date()) {
  const today = localDay(now);
  return (items || []).filter(item => {
    const due = parseChineseDate(item.next);
    return !item.mastered && due && localDay(due) <= today;
  });
}

function buildDailySummary({ date = new Date(), completed = 0, total = 0, focusMinutes = 0, goalMinutes = 0, dueItems = [] }) {
  const stamp = new Date(date).toLocaleDateString('zh-CN');
  const lines = [
    `学习指挥台｜${stamp}`,
    `任务：已完成 ${completed}/${total} 项`,
    `专注：${focusMinutes} 分钟 / ${goalMinutes} 分钟`,
    `待复习：${dueItems.length} 条`
  ];
  dueItems.slice(0, 3).forEach(item => lines.push(`- ${String(item.content || '未命名复盘').split('\n')[0]}`));
  return lines.join('\n');
}

module.exports = { parseChineseDate, dueReviews, buildDailySummary };
