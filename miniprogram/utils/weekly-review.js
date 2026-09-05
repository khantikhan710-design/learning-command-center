const { dueReviews, parseChineseDate } = require('./review-status');

const DAY = 24 * 60 * 60 * 1000;

function dayStart(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NaN;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isInLastSevenDays(value, now) {
  const day = dayStart(value);
  const end = dayStart(now) + DAY;
  return Number.isFinite(day) && day >= end - 7 * DAY && day < end;
}

function buildWeeklyReview({ tasks = [], sessions = [], reviews = [], activityDates = [], now = new Date() }) {
  const weekTasks = tasks.filter(task => isInLastSevenDays(task.createdAt, now));
  const completed = weekTasks.filter(task => task.completedAt && isInLastSevenDays(task.completedAt, now)).length;
  const totals = sessions.filter(session => isInLastSevenDays(session.endedAt, now)).reduce((map, session) => {
    const name = String(session.subject || '未分类').trim() || '未分类';
    map[name] = (map[name] || 0) + Number(session.minutes || 0);
    return map;
  }, {});
  const totalMinutes = Object.values(totals).reduce((sum, minutes) => sum + minutes, 0);
  const subjects = Object.entries(totals).map(([name, minutes]) => ({
    name,
    minutes,
    percent: totalMinutes ? Math.round(minutes / totalMinutes * 100) : 0
  })).sort((left, right) => right.minutes - left.minutes || left.name.localeCompare(right.name));
  const weak = dueReviews(reviews, now).reduce((map, item) => {
    const name = String(item.type || '未分类').trim() || '未分类';
    map[name] = (map[name] || 0) + 1;
    return map;
  }, {});
  const weakTopics = Object.entries(weak).map(([name, dueCount]) => ({ name, dueCount })).sort((left, right) => right.dueCount - left.dueCount || left.name.localeCompare(right.name));
  const activeDays = new Set(activityDates.map(parseChineseDate).filter(Boolean).map(dayStart));
  let streak = 0;
  for (let day = dayStart(now); activeDays.has(day); day -= DAY) streak += 1;

  return {
    plan: { total: weekTasks.length, completed, percent: weekTasks.length ? Math.round(completed / weekTasks.length * 100) : 0 },
    totalMinutes,
    subjects,
    weakTopics,
    streak
  };
}

function buildWeeklyReport(summary) {
  const subjects = summary.subjects.length ? summary.subjects.map(item => `${item.name} ${item.minutes} 分钟（${item.percent}%）`).join('；') : '暂无专注记录';
  const weak = summary.weakTopics.length ? summary.weakTopics.map(item => `${item.name}（${item.dueCount} 条到期）`).join('、') : '暂无到期薄弱项';
  const next = summary.weakTopics[0] ? `优先复盘“${summary.weakTopics[0].name}”的到期内容。` : summary.subjects[0] ? `延续“${summary.subjects[0].name}”的学习节奏，并补一条复盘。` : '先安排一项 25 分钟的最小学习任务。';
  return `本周学习复盘\n计划完成：${summary.plan.completed}/${summary.plan.total}（${summary.plan.percent}%）\n专注投入：${summary.totalMinutes} 分钟\n科目投入：${subjects}\n薄弱知识点：${weak}\n连续复习：${summary.streak} 天\n下周第一步：${next}`;
}

module.exports = { buildWeeklyReview, buildWeeklyReport };
