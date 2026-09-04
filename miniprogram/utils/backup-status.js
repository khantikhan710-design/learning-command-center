function getBackupStatus(value, formatDate = date => date.toLocaleString('zh-CN', { hour12: false })) {
  if (!value) return { text: '尚未生成完整备份', needsBackup: true };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { text: '尚未生成完整备份', needsBackup: true };
  return { text: `最近本机备份：${formatDate(date)}`, needsBackup: false };
}

module.exports = { getBackupStatus };
