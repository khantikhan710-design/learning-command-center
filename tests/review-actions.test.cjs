const assert = require('node:assert/strict');
const { removeReview } = require('../miniprogram/utils/review-actions');

assert.deepEqual(removeReview([{ id: 'a' }, { id: 'b' }], 'a'), [{ id: 'b' }]);
console.log('review action tests passed');
