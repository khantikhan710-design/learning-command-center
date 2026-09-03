const assert = require('node:assert/strict');
const { snapshotFilter, focusRecord, collectionFor } = require('../cloudfunctions/studyData/access');

assert.deepEqual(snapshotFilter('openid-a'), { key: 'current', ownerId: 'openid-a' });
assert.equal(collectionFor('tasks'), 'study_tasks');
assert.throws(() => collectionFor('anything-else'));
assert.equal(focusRecord({ minutes: 25 }, 'openid-a').ownerId, 'openid-a');
console.log('cloud data isolation tests passed');
