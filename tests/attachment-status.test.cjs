const assert = require('node:assert/strict');
const { MAX_LOCAL_FILE_BYTES, createSourcePlaceholder, describeSaveFailure } = require('../miniprogram/utils/attachment-status');

assert.equal(MAX_LOCAL_FILE_BYTES, 10 * 1024 * 1024);
assert.deepEqual(createSourcePlaceholder({ name: '电路.pdf', size: 12 * 1024 * 1024, type: 'file' }, '文件超过本机 10MB 限额'), {
  name: '电路.pdf',
  type: 'file',
  size: 12 * 1024 * 1024,
  attachmentId: 'source-电路.pdf-12582912',
  status: 'needs_source',
  reason: '文件超过本机 10MB 限额'
});
assert.equal(describeSaveFailure({ errMsg: 'saveFile:fail exceed max file size' }), '本机小程序文件空间不足或文件超过 10MB 限额');
console.log('attachment status tests passed');
