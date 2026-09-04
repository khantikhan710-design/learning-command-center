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

module.exports = { weekStart, sessionsForWeek, summarizeSessions };
