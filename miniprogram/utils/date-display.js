function formatRecordDate(value) {
  const source = String(value || '').replace(/(GMT[+-]\d{4})\s+CST\b/i, '$1');
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return String(value || '未记录时间');
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(date).reduce((map, part) => ({ ...map, [part.type]: part.value }), {});
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

module.exports = { formatRecordDate };
