const assert = require('node:assert/strict');
const { getBackupStatus } = require('../miniprogram/utils/backup-status');

assert.deepEqual(getBackupStatus(''), { text: '尚未生成完整备份', needsBackup: true });
assert.deepEqual(
  getBackupStatus('2026-09-05T10:30:00.000Z', date => `格式化 ${date.toISOString()}`),
  { text: '最近本机备份：格式化 2026-09-05T10:30:00.000Z', needsBackup: false }
);
assert.deepEqual(getBackupStatus('not-a-date'), { text: '尚未生成完整备份', needsBackup: true });
console.log('backup status tests passed');
