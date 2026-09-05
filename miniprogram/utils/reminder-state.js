function buildReminderState({ dueCount = 0, missedDays = 0, subscriptionTemplateIds = [] }) {
  const configured = Array.isArray(subscriptionTemplateIds) && subscriptionTemplateIds.length > 0;
  if (dueCount) {
    return {
      dueCount,
      title: `有 ${dueCount} 条复盘已到期`,
      message: missedDays ? `已间隔 ${missedDays} 天，先处理最早的一条。` : '先完成最早的一条；订阅消息仍待配置。',
      subscription: configured ? '待授权' : '未配置'
    };
  }
  return {
    dueCount: 0,
    title: '今天没有到期复盘',
    message: configured ? '订阅消息可在授权后使用。' : '本机提醒已启用；微信订阅消息待配置。',
    subscription: configured ? '待授权' : '未配置'
  };
}

module.exports = { buildReminderState };
