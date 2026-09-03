function mergeCategories(categories, name) {
  const clean = String(name || '').trim();
  return clean && !categories.includes(clean) ? [...categories, clean] : categories;
}

function buildFolders(items, categories, field = 'subject') {
  return categories.map(name => {
    const folderItems = items.filter(item => item[field] === name && !item.mastered);
    return { name, count: folderItems.length, items: folderItems };
  }).filter(folder => folder.count);
}

function markMastered(items, id, masteredAt) {
  return items.map(item => item.id === id ? { ...item, mastered: true, masteredAt } : item);
}

function unmarkMastered(items, id) {
  return items.map(item => {
    if (item.id !== id) return item;
    const restored = { ...item, mastered: false };
    delete restored.masteredAt;
    return restored;
  });
}

module.exports = { mergeCategories, buildFolders, markMastered, unmarkMastered };
