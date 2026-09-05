function parseLocalDate(value) {
  const match = String(value || '').match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(value) {
  const date = parseLocalDate(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : '未记录月份';
}

function buildFilterOptions(items, field) {
  const values = [...new Set((items || []).map(item => String(item[field] || '').trim()).filter(Boolean))];
  return ['全部', ...values.sort((left, right) => left.localeCompare(right, 'zh-CN'))];
}

function filterStudyItems(items, filter = {}) {
  const keyword = String(filter.keyword || '').trim().toLowerCase();
  const subject = filter.subject || '全部';
  const source = filter.source || '全部';
  const month = filter.month || '全部';
  return (items || []).filter(item => {
    const text = [
      item.title, item.content, item.subject, item.type, item.source, item.sourceLabel,
      ...(Array.isArray(item.files) ? item.files.map(file => file.name) : [])
    ].join('\n').toLowerCase();
    const itemSubject = item.subject || item.type || '未分类';
    const itemSource = item.source || item.sourceLabel || '手动录入';
    const itemMonth = monthKey(item.date || item.created || item.masteredAt);
    return (!keyword || text.includes(keyword)) &&
      (subject === '全部' || itemSubject === subject) &&
      (source === '全部' || itemSource === source) &&
      (month === '全部' || itemMonth === month);
  });
}

module.exports = { monthKey, buildFilterOptions, filterStudyItems };
