const MAX_LOCAL_FILE_BYTES = 10 * 1024 * 1024;

function createSourcePlaceholder(file, reason) {
  const name = file.name || '未命名附件';
  const size = Number(file.size) || 0;
  return {
    name,
    type: file.type || 'file',
    size,
    attachmentId: `source-${name}-${size}`,
    status: 'needs_source',
    reason
  };
}

function describeSaveFailure(error) {
  const message = String(error && (error.errMsg || error.message) || '');
  if (/size|space|quota|max/i.test(message)) return '本机小程序文件空间不足或文件超过 10MB 限额';
  return '附件未能保存到小程序，请保留 Goodnotes/WPS 原件';
}

module.exports = { MAX_LOCAL_FILE_BYTES, createSourcePlaceholder, describeSaveFailure };
