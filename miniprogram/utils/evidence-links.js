function getPreviewUrls(fileList) {
  return fileList.filter(file => file.status === 0 && file.tempFileURL).map(file => file.tempFileURL);
}

function currentPreviewUrl(fileList, fileID) {
  const file = fileList.find(item => item.fileID === fileID && item.status === 0);
  return file && file.tempFileURL;
}

module.exports = { getPreviewUrls, currentPreviewUrl };
