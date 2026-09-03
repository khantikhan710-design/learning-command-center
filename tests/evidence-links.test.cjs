const assert = require('node:assert/strict');
const { getPreviewUrls, currentPreviewUrl } = require('../miniprogram/utils/evidence-links');

const files = [
  { fileID: 'cloud://a', status: 0, tempFileURL: 'https://temp/a.jpg' },
  { fileID: 'cloud://b', status: -1, tempFileURL: '' },
  { fileID: 'cloud://c', status: 0, tempFileURL: 'https://temp/c.jpg' }
];
assert.deepEqual(getPreviewUrls(files), ['https://temp/a.jpg', 'https://temp/c.jpg']);
assert.equal(currentPreviewUrl(files, 'cloud://c'), 'https://temp/c.jpg');
console.log('evidence link tests passed');
