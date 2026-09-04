const assert = require('node:assert/strict');
const { buildCategoryMenu } = require('../miniprogram/utils/category-menu');

const categories = Array.from({ length: 20 }, (_, index) => `分类${index + 1}`);
const rootActions = [
  { type: 'create', label: '＋ 新建分类' },
  { type: 'manage', label: '管理分类' }
];

let offset = 0;
const seen = [];
do {
  const entries = buildCategoryMenu(categories, offset, rootActions);
  assert.ok(entries.length <= 6, '每个原生菜单最多显示 6 项');
  seen.push(...entries.filter(entry => entry.type === 'category').map(entry => entry.name));
  const more = entries.find(entry => entry.type === 'more');
  offset = more ? more.offset : null;
} while (offset !== null);

assert.deepEqual(seen, categories);
const first = buildCategoryMenu(['数学', '英语', '电路', '硬件', 'AI'], 0, rootActions);
assert.deepEqual(first.map(entry => entry.type), ['category', 'category', 'category', 'more', 'create', 'manage']);
console.log('category menu tests passed');
