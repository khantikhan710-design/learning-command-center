const MATERIAL_SOURCES = ['Goodnotes', 'WPS 扫描', '纸质拍照', '其他'];

function normalizeMaterialSource(source) {
  return MATERIAL_SOURCES.includes(source) ? source : '其他';
}

function materialTitle(record) {
  const title = String(record && record.title || '').trim();
  if (title) return title;
  const firstLine = String(record && record.content || '').split(/\r?\n/)[0].trim();
  return firstLine || '未命名资料卡';
}

function createReviewDraft(record) {
  const sourceLabel = normalizeMaterialSource(record && record.source);
  const title = materialTitle(record);
  const body = String(record && record.content || '').trim();
  return {
    recordId: record && record.id,
    sourceLabel,
    content: '【资料卡｜' + sourceLabel + '】' + title + (body ? '\n' + body : '')
  };
}

function createSourceImportDraft(source, file) {
  const normalized = normalizeMaterialSource(source);
  const name = String(file && file.name || '').replace(/\.[^.]+$/, '').trim();
  return { source: normalized, title: name, dateHint: `已从 ${normalized}导入文件` };
}

module.exports = { MATERIAL_SOURCES, normalizeMaterialSource, materialTitle, createReviewDraft, createSourceImportDraft };
