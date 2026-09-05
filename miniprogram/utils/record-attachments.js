function removeAttachment(records, recordId, attachmentId) {
  return records.map(record => {
    if (String(record.id) !== String(recordId)) return record;
    return { ...record, files: (record.files || []).filter(file => String(file.attachmentId) !== String(attachmentId)) };
  });
}

module.exports = { removeAttachment };
