function getBackupStatus(value, formatDate = date => date.toLocaleString('zh-CN', { hour12: false })) {
  if (!value) return { text: '尚未生成完整备份', needsBackup: true };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { text: '尚未生成完整备份', needsBackup: true };
  return { text: `最近本机备份：${formatDate(date)}`, needsBackup: false };
}

function buildLocalSafetyStatus({ backupAt, records = [], now = new Date() }) {
  const backup = getBackupStatus(backupAt);
  const savedAt = new Date(backupAt);
  const daysSinceBackup = Number.isNaN(savedAt.getTime()) ? null : Math.floor((now.getTime() - savedAt.getTime()) / (24 * 60 * 60 * 1000));
  const files = records.flatMap(record => record.files || []);
  const unsavedFiles = files.filter(file => file.status === 'needs_source').length;
  const oversizedFiles = files.filter(file => Number(file.size) > 10 * 1024 * 1024).length;
  const needsBackup = backup.needsBackup || daysSinceBackup >= 7;
  return { ...backup, daysSinceBackup, unsavedFiles, oversizedFiles, needsBackup };
}

module.exports = { getBackupStatus, buildLocalSafetyStatus };
