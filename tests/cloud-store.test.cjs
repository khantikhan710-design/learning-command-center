const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENV_ID, collectionFor } = require('../miniprogram/utils/cloud-store');

assert.equal(ENV_ID, 'study-command-doc-d4ddzc7244fd32');
assert.equal(collectionFor('tasks'), 'study_tasks');
assert.equal(collectionFor('records'), 'study_records');
assert.equal(collectionFor('reviews'), 'study_reviews');
const source = fs.readFileSync(require.resolve('../miniprogram/utils/cloud-store'), 'utf8');
assert.match(source, /wx\.cloud\.callFunction/);
assert.doesNotMatch(source, /wx\.cloud\.database/);
console.log('cloud store configuration tests passed');
