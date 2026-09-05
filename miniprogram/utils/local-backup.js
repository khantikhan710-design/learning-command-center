const BACKUP_FORMAT = 'study-command-center-backup';
const BACKUP_VERSION = 1;
const ARRAY_KEYS = ['studyTasks', 'studyTaskCategories', 'studyRecords', 'recordCategories', 'reviewItems', 'reviewCategories', 'studyActiveDates', 'reviewActiveDates', 'focusSessions'];
const STORAGE_KEYS = [...ARRAY_KEYS, 'focusMinutes'];

function copyData(storage) {
  return STORAGE_KEYS.reduce((data, key) => {
    const value = storage[key];
    data[key] = key === 'focusMinutes'
      ? (Number.isFinite(value) && value >= 0 ? value : 0)
      : (Array.isArray(value) ? value : []);
    return data;
  }, {});
}

function createBackup(storage, exportedAt = new Date().toISOString()) {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    data: copyData(storage)
  }, null, 2);
}

function parseBackup(text) {
  let backup;
  try {
    backup = JSON.parse(String(text || ''));
  } catch (_) {
    throw new Error('备份内容不是有效 JSON');
  }
  if (!backup || backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) throw new Error('不是学习指挥台备份');
  if (!backup.data || typeof backup.data !== 'object') throw new Error('备份缺少学习数据');
  if (!Array.isArray(backup.data.focusSessions)) backup.data.focusSessions = [];
  if (!Array.isArray(backup.data.reviewActiveDates)) backup.data.reviewActiveDates = [];
  if (ARRAY_KEYS.some(key => !Array.isArray(backup.data[key]))) throw new Error('备份数据格式不完整');
  if (!Number.isFinite(backup.data.focusMinutes) || backup.data.focusMinutes < 0) throw new Error('备份专注时长无效');
  return backup;
}

function summarizeBackup(backup) {
  const data = backup.data;
  return {
    tasks: data.studyTasks.length,
    records: data.studyRecords.length,
    reviews: data.reviewItems.length,
    focusMinutes: data.focusMinutes
  };
}

function backupFileName(date = new Date()) {
  return `学习指挥台备份-${date.toISOString().slice(0, 10)}.json`;
}

module.exports = { BACKUP_FORMAT, STORAGE_KEYS, createBackup, parseBackup, summarizeBackup, backupFileName };
