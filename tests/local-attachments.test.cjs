const assert = require('node:assert/strict');
const { isCloudPath, saveLocalImages, saveLocalFiles } = require('../miniprogram/utils/local-attachments');

const fakeWx = {
  saveFile({ tempFilePath, success }) {
    success({ savedFilePath: `wxfile://saved/${tempFilePath.split('/').pop()}` });
  }
};

assert.equal(isCloudPath('cloud://study/a.jpg'), true);
assert.equal(isCloudPath('wxfile://saved/a.jpg'), false);

Promise.all([
  saveLocalImages(['/tmp/scan.jpg'], fakeWx),
  saveLocalFiles([{ name: '错题.pdf', path: '/tmp/wrong.pdf' }], fakeWx)
]).then(([images, files]) => {
  assert.deepEqual(images, ['wxfile://saved/scan.jpg']);
  assert.deepEqual(files, [{ name: '错题.pdf', localFilePath: 'wxfile://saved/wrong.pdf', type: 'pdf' }]);
  console.log('local attachment tests passed');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
