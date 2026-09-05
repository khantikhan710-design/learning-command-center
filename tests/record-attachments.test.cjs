const assert = require('node:assert/strict');
const { removeAttachment } = require('../miniprogram/utils/record-attachments');

const records = [{
  id: 'record-1',
  title: '错题资料',
  files: [
    { attachmentId: 'file-a', name: '失效.pdf' },
    { attachmentId: 'file-b', name: '保留.docx' }
  ]
}];

assert.deepEqual(removeAttachment(records, 'record-1', 'file-a'), [{
  id: 'record-1',
  title: '错题资料',
  files: [{ attachmentId: 'file-b', name: '保留.docx' }]
}]);
assert.deepEqual(removeAttachment(records, 'record-1', 'missing'), records);

console.log('record attachment tests passed');
