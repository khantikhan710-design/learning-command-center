function buildCategoryMenu(categories, offset = 0, rootActions = []) {
  const root = offset === 0;
  const fixedEntries = root ? rootActions : [{ type: 'back', label: '返回分类选择' }];
  let categoryLimit = 6 - fixedEntries.length;
  if (categories.length - offset > categoryLimit) categoryLimit -= 1;

  const entries = categories.slice(offset, offset + categoryLimit).map(name => ({ type: 'category', name, label: name }));
  const nextOffset = offset + categoryLimit;
  if (nextOffset < categories.length) entries.push({ type: 'more', offset: nextOffset, label: '更多分类' });
  return [...entries, ...fixedEntries];
}

module.exports = { buildCategoryMenu };
