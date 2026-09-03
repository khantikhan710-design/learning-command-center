const collections = { tasks: 'study_tasks', records: 'study_records', reviews: 'study_reviews', focus: 'study_focus_sessions' };

function collectionFor(name) {
  if (!collections[name]) throw new Error('Unsupported data collection');
  return collections[name];
}

function snapshotFilter(ownerId) {
  return { key: 'current', ownerId };
}

function focusRecord(data, ownerId) {
  return { ...data, ownerId };
}

module.exports = { collectionFor, snapshotFilter, focusRecord };
