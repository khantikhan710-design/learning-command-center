function isCloudPath(path) {
  return typeof path === 'string' && path.startsWith('cloud://');
}

function saveLocalPath(path, api = wx) {
  if (typeof path !== 'string' || !path) return Promise.reject(new Error('找不到本机附件'));
  return new Promise((resolve, reject) => {
    api.saveFile({ tempFilePath: path, success: result => resolve(result.savedFilePath), fail: reject });
  });
}

function extension(file) {
  const source = file.name || file.path || '';
  return source.includes('.') ? source.split('.').pop().toLowerCase() : 'file';
}

function saveLocalImages(paths, api = wx) {
  return Promise.all(paths.map(path => saveLocalPath(path, api)));
}

function saveLocalFiles(files, api = wx) {
  return Promise.all(files.map(file => saveLocalPath(file.localFilePath || file.path, api).then(localFilePath => ({
    name: file.name || `附件.${extension(file)}`,
    localFilePath,
    type: file.type || extension(file)
  }))));
}

async function saveLocalFilesWithStatus(files, api = wx) {
  const outcomes = await Promise.all(files.map(async file => {
    if (Number(file.size) > MAX_LOCAL_FILE_BYTES) {
      return { placeholder: createSourcePlaceholder(file, '文件超过本机 10MB 限额') };
    }
    try {
      const [saved] = await saveLocalFiles([file], api);
      return { file: { ...saved, status: 'saved' } };
    } catch (error) {
      return { placeholder: createSourcePlaceholder(file, describeSaveFailure(error)) };
    }
  }));
  return {
    files: outcomes.filter(item => item.file).map(item => item.file),
    placeholders: outcomes.filter(item => item.placeholder).map(item => item.placeholder)
  };
}

module.exports = { isCloudPath, saveLocalImages, saveLocalFiles, saveLocalFilesWithStatus };
const { MAX_LOCAL_FILE_BYTES, createSourcePlaceholder, describeSaveFailure } = require('./attachment-status');
