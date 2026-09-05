const assert = require('node:assert/strict');
const { MATERIAL_SOURCES, normalizeMaterialSource, materialTitle, createReviewDraft, createSourceImportDraft } = require('../miniprogram/utils/study-material-cards');

assert.deepEqual(MATERIAL_SOURCES, ['Goodnotes', 'WPS 扫描', '纸质拍照', '其他']);
assert.equal(normalizeMaterialSource('Goodnotes'), 'Goodnotes');
assert.equal(normalizeMaterialSource('未知软件'), '其他');
assert.equal(materialTitle({ title: '  极限错题集  ', content: '说明' }), '极限错题集');
assert.equal(materialTitle({ content: '第一行标题\n第二行说明' }), '第一行标题');
assert.equal(materialTitle({}), '未命名资料卡');
assert.deepEqual(createReviewDraft({ id: 'r1', source: 'WPS 扫描', title: '微分方程错题', content: '变量代换漏写初值条件' }), {
  recordId: 'r1',
  sourceLabel: 'WPS 扫描',
  content: '【资料卡｜WPS 扫描】微分方程错题\n变量代换漏写初值条件'
});
assert.deepEqual(createReviewDraft({ id: 'r2', content: '' }), {
  recordId: 'r2',
  sourceLabel: '其他',
  content: '【资料卡｜其他】未命名资料卡'
});
assert.deepEqual(createSourceImportDraft('WPS 扫描', { name: '9月模电错题.pdf' }), { source: 'WPS 扫描', title: '9月模电错题', dateHint: '已从 WPS 扫描导入文件' });
console.log('study material card tests passed');
