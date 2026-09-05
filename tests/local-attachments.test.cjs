const assert = require('node:assert/strict');
const { isCloudPath, saveLocalImages, saveLocalFiles } = require('../miniprogram/utils/local-attachments');

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
  saveLocalFiles([{ name: '临时错题.pdf', path: 'wxfile://tmp/wrong.pdf' }], temporaryFileWx)
]).then(([images, files, temporaryFiles]) => {
  assert.deepEqual(images, ['wxfile://saved/scan.jpg']);
  assert.deepEqual(files, [{ name: '错题.pdf', localFilePath: 'wxfile://saved/wrong.pdf', type: 'pdf' }]);
  assert.equal(temporaryPathWasPersisted, true);
  assert.deepEqual(temporaryFiles, [{ name: '临时错题.pdf', localFilePath: 'wxfile://saved/wrong.pdf', type: 'pdf' }]);
  console.log('local attachment tests passed');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
