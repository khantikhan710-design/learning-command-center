function parseGoalHours(value) {
  const hours = Number(String(value || '').trim());
  if (!Number.isFinite(hours) || hours < 0.5 || hours > 24) return null;
  return Math.round(hours * 60 / 5) * 5;
}

function formatGoalMinutes(minutes) {
  const wholeHours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  if (!wholeHours) return `${remainMinutes} 分钟`;
  if (!remainMinutes) return `${wholeHours} 小时`;
  return `${wholeHours} 小时 ${remainMinutes} 分钟`;
}

module.exports = { parseGoalHours, formatGoalMinutes };
