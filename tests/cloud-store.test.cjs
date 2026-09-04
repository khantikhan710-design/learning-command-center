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
assert.match(source, /function loadTaskState\(\)\s*\{\s*return callData\('load', 'tasks'\)\.then\(result => result\.items\);\s*\}/);
assert.match(source, /function saveTaskState\(state\)\s*\{\s*return callData\('save', 'tasks', \{ items: state \}\);\s*\}/);
const cloudFunctionSource = fs.readFileSync(require.resolve('../cloudfunctions/studyData/index'), 'utf8');
assert.match(cloudFunctionSource, /event\.name === 'tasks'/);
assert.match(cloudFunctionSource, /Array\.isArray\(event\.items\.tasks\)/);
assert.match(cloudFunctionSource, /Array\.isArray\(event\.items\.categories\)/);
console.log('cloud store configuration tests passed');
