function weekStart(timestamp) {
  const date = new Date(timestamp);
  const offset = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date.getTime();
}

function sessionsForWeek(sessions, timestamp = Date.now()) {
  const start = weekStart(timestamp);
  const end = start + 7 * 24 * 60 * 60 * 1000;
  return (sessions || []).filter(session => Number(session.endedAt) >= start && Number(session.endedAt) < end);
}

function sumBy(sessions, key, fallback, skipEmpty) {
  const totals = {};
  (sessions || []).forEach(session => {
    const name = String(session[key] || fallback).trim();
    if (skipEmpty && !name) return;
    totals[name || fallback] = (totals[name || fallback] || 0) + Number(session.minutes || 0);
  });
  return Object.keys(totals).map(name => ({ name, minutes: totals[name] })).sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name));
}

function summarizeSessions(sessions) {
  return {
    totalMinutes: (sessions || []).reduce((sum, session) => sum + Number(session.minutes || 0), 0),
    subjects: sumBy(sessions, 'subject', '未分类'),
    tasks: sumBy(sessions, 'taskTitle', '', true)
  };
}

function dayStart(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function dayLabel(timestamp) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function recentDays(timestamp = Date.now()) {
  const end = dayStart(timestamp);
  return Array.from({ length: 7 }, (_, index) => {
    const start = end - (6 - index) * 24 * 60 * 60 * 1000;
    return { start, end: start + 24 * 60 * 60 * 1000, label: dayLabel(start), minutes: 0 };
  });
}

function buildFocusDashboard(sessions, timestamp = Date.now()) {
  const daily = recentDays(timestamp);
  (sessions || []).forEach(session => {
    const endedAt = Number(session.endedAt);
    const day = daily.find(item => endedAt >= item.start && endedAt < item.end);
    if (day) day.minutes += Number(session.minutes || 0);
  });
  const maxMinutes = Math.max(...daily.map(item => item.minutes), 0);
  const activeSessions = (sessions || []).filter(session => daily.some(day => Number(session.endedAt) >= day.start && Number(session.endedAt) < day.end));
  const summary = summarizeSessions(activeSessions);
  const totalMinutes = summary.totalMinutes;
  const withPercent = items => items.map(item => ({
    ...item,
    percent: totalMinutes ? Math.round(item.minutes / totalMinutes * 100) : 0
  }));
  return {
    totalMinutes,
    daily: daily.map(item => ({
      ...item,
      height: maxMinutes ? Math.max(8, Math.round(item.minutes / maxMinutes * 100)) : 0
    })),
    subjects: withPercent(summary.subjects),
    tasks: withPercent(summary.tasks)
  };
}

module.exports = { weekStart, sessionsForWeek, summarizeSessions, buildFocusDashboard };
