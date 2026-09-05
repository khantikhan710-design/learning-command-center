const assert = require('node:assert/strict');
const { isCloudPath, saveLocalImages, saveLocalFiles, saveLocalFilesWithStatus } = require('../miniprogram/utils/local-attachments');

const fakeWx = {
  saveFile({ tempFilePath, success }) {
    success({ savedFilePath: `wxfile://saved/${tempFilePath.split('/').pop()}` });
  }
};

let temporaryPathWasPersisted = false;
const temporaryFileWx = {
  saveFile({ tempFilePath, success }) {
    temporaryPathWasPersisted = tempFilePath === 'wxfile://tmp/wrong.pdf';
    success({ savedFilePath: 'wxfile://saved/wrong.pdf' });
  }
};

assert.equal(isCloudPath('cloud://study/a.jpg'), true);
assert.equal(isCloudPath('wxfile://saved/a.jpg'), false);

Promise.all([
  saveLocalImages(['/tmp/scan.jpg'], fakeWx),
  saveLocalFiles([{ name: '错题.pdf', path: '/tmp/wrong.pdf' }], fakeWx),
  saveLocalFiles([{ name: '临时错题.pdf', path: 'wxfile://tmp/wrong.pdf' }], temporaryFileWx),
  saveLocalFilesWithStatus([
    { name: '小文件.pdf', path: '/tmp/small.pdf', size: 100 },
    { name: '大文件.pdf', path: '/tmp/large.pdf', size: 11 * 1024 * 1024 }
  ], fakeWx)
]).then(([images, files, temporaryFiles, statusResult]) => {
  assert.deepEqual(images, ['wxfile://saved/scan.jpg']);
  assert.deepEqual(files, [{ name: '错题.pdf', localFilePath: 'wxfile://saved/wrong.pdf', type: 'pdf' }]);
  assert.equal(temporaryPathWasPersisted, true);
  assert.deepEqual(temporaryFiles, [{ name: '临时错题.pdf', localFilePath: 'wxfile://saved/wrong.pdf', type: 'pdf' }]);
  assert.equal(statusResult.files[0].status, 'saved');
  assert.equal(statusResult.placeholders[0].status, 'needs_source');
  console.log('local attachment tests passed');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
