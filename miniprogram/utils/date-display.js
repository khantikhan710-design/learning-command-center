function formatRecordDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '未记录时间');
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(date).reduce((map, part) => ({ ...map, [part.type]: part.value }), {});
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

module.exports = { formatRecordDate };
