const assert = require('node:assert/strict');
const { ENV_ID, collectionFor } = require('../miniprogram/utils/cloud-store');

assert.equal(ENV_ID, 'study-command-doc-d4ddzc7244fd32');
assert.equal(collectionFor('tasks'), 'study_tasks');
assert.equal(collectionFor('records'), 'study_records');
assert.equal(collectionFor('reviews'), 'study_reviews');
console.log('cloud store configuration tests passed');
