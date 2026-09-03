const assert = require('node:assert/strict');
const { buildPrompts } = require('../miniprogram/utils/review-prompts');

const prompts = buildPrompts('错题', '节点电压法求解电阻网络');
assert.equal(prompts.length, 3);
assert.match(prompts[0], /条件/);
assert.match(prompts.join(' '), /节点电压法求解电阻网络/);
console.log('review prompt tests passed');
