const assert = require('node:assert/strict');
const { getBackupStatus, buildLocalSafetyStatus } = require('../miniprogram/utils/backup-status');

assert.deepEqual(getBackupStatus(''), { text: '尚未生成完整备份', needsBackup: true });
assert.deepEqual(
  getBackupStatus('2026-09-05T10:30:00.000Z', date => `格式化 ${date.toISOString()}`),
  { text: '最近本机备份：格式化 2026-09-05T10:30:00.000Z', needsBackup: false }
);
assert.deepEqual(getBackupStatus('not-a-date'), { text: '尚未生成完整备份', needsBackup: true });
const safety = buildLocalSafetyStatus({
  backupAt: '2026-08-25T00:00:00.000Z',
  records: [{ files: [{ status: 'needs_source', name: '未保存.pdf' }, { size: 11 * 1024 * 1024, name: '大文件.pdf' }] }],
  now: new Date('2026-09-05T00:00:00.000Z')
});
assert.equal(safety.needsBackup, true);
assert.equal(safety.unsavedFiles, 1);
assert.equal(safety.oversizedFiles, 1);
console.log('backup status tests passed');
