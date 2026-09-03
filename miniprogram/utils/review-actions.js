function removeReview(items, id) {
  return items.filter(item => item.id !== id);
}

module.exports = { removeReview };
