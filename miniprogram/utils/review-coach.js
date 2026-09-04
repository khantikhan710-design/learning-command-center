const { parseChineseDate } = require('./review-status');

function dayStart(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatLocalDate(now = new Date()) {
  return new Date(now).toLocaleDateString('zh-CN');
}

function normalizeDates(dates) {
  return [...new Set((dates || []).filter(value => parseChineseDate(value)))].sort((left, right) => dayStart(parseChineseDate(left)) - dayStart(parseChineseDate(right)));
}

function recordReviewDay(dates, now = new Date()) {
  return normalizeDates([...(dates || []), formatLocalDate(now)]);
}

function streakEndingOn(dates, endDay) {
  const days = new Set(dates.map(value => dayStart(parseChineseDate(value))));
  let streak = 0;
  let day = endDay;
  while (days.has(day)) {
    streak += 1;
    day -= 24 * 60 * 60 * 1000;
  }
  return streak;
}

function buildReviewCoach({ activityDates = [], dueCount = 0, reviewCount = 0, now = new Date() }) {
  const today = dayStart(now);
  const dates = normalizeDates(activityDates).filter(value => dayStart(parseChineseDate(value)) <= today);
  const dayValues = dates.map(value => dayStart(parseChineseDate(value)));
  const hasToday = dayValues.includes(today);
  const lastDay = dayValues.length ? dayValues[dayValues.length - 1] : null;
  const streak = hasToday ? streakEndingOn(dates, today) : (lastDay === today - 24 * 60 * 60 * 1000 ? streakEndingOn(dates, lastDay) : 0);
  const missedDays = !hasToday && lastDay ? Math.max(0, Math.round((today - lastDay) / (24 * 60 * 60 * 1000)) - 1) : 0;

  if (!reviewCount) return { title: '从第一条开始', message: '添加一条错题或概念，建立自己的复习队列。', streak: 0, missedDays: 0 };
  if (!dates.length && dueCount) return { title: '从今天开始复习', message: '今天先完成一条到期复习，建立自己的节奏。', streak: 0, missedDays: 0 };
  if (dueCount >= 4) {
    const gap = missedDays ? `已间隔 ${missedDays} 天，今天不补量。` : '';
    return { title: '先清复习积压', message: `现在有 ${dueCount} 条待复习，先完成最早 3 条，再做新内容。${gap}`, streak, missedDays };
  }
  if (hasToday && streak === 1) return { title: '连续复习第 1 天', message: '今天先完成一条，先把节奏建立起来。', streak, missedDays: 0 };
  if (hasToday && streak <= 3) return { title: '节奏已建立', message: `连续复习 ${streak} 天，优先完成今天到期内容。`, streak, missedDays: 0 };
  if (hasToday) return { title: '记忆在加固', message: `连续复习 ${streak} 天，保持小步稳定即可。`, streak, missedDays: 0 };
  if (lastDay === today - 24 * 60 * 60 * 1000) return { title: '别让节奏断掉', message: `昨天已连续复习 ${streak} 天，今天完成一条即可续上。`, streak, missedDays: 0 };
  if (missedDays) return { title: '重新衔接', message: `已间隔 ${missedDays} 天，今天先处理最早到期的一条，不补量。`, streak: 0, missedDays };
  return { title: '今天很从容', message: '今天没有到期复盘，可补充一条新的错题或概念。', streak: 0, missedDays: 0 };
}

module.exports = { formatLocalDate, recordReviewDay, buildReviewCoach };
