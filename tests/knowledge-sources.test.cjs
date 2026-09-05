const assert = require('node:assert/strict');
const { KNOWLEDGE_SOURCES } = require('../miniprogram/utils/knowledge-sources');

assert.equal(KNOWLEDGE_SOURCES[0].subject, '电路');
assert.equal(KNOWLEDGE_SOURCES[0].url.startsWith('https://'), true);
assert.equal(KNOWLEDGE_SOURCES.some(item => item.subject === '高数' && item.usage.includes('本人上传')), true);
console.log('knowledge sources tests passed');
