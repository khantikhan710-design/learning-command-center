function removeAttachment(records, recordId, attachmentId) {
  return records.map(record => {
    if (String(record.id) !== String(recordId)) return record;
    return { ...record, files: (record.files || []).filter(file => String(file.attachmentId) !== String(attachmentId)) };
  });
}

function replaceAttachment(records, recordId, attachmentId, replacement) {
  return records.map(record => {
    if (String(record.id) !== String(recordId)) return record;
    return {
      ...record,
      files: (record.files || []).map(file => String(file.attachmentId) === String(attachmentId) ? replacement : file)
    };
  });
}

module.exports = { removeAttachment, replaceAttachment };
