const assert = require('node:assert/strict');
const { buildReminderState } = require('../miniprogram/utils/reminder-state');

assert.deepEqual(buildReminderState({ dueCount: 2, missedDays: 1, subscriptionTemplateIds: [] }), {
  dueCount: 2,
  title: '有 2 条复盘已到期',
  message: '已间隔 1 天，先处理最早的一条。',
  subscription: '未配置'
});
assert.deepEqual(buildReminderState({ dueCount: 0, missedDays: 0, subscriptionTemplateIds: ['template-id'] }), {
  dueCount: 0,
  title: '今天没有到期复盘',
  message: '订阅消息可在授权后使用。',
  subscription: '待授权'
});
console.log('reminder state tests passed');
