function parseGoalHours(value) {
  const hours = Number(String(value || '').trim());
  if (!Number.isFinite(hours) || hours < 0.5 || hours > 24) return null;
  return Math.round(hours * 60 / 15) * 15;
}

function formatGoalMinutes(minutes) {
  const wholeHours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  if (!wholeHours) return `${remainMinutes} 分钟`;
  if (!remainMinutes) return `${wholeHours} 小时`;
  return `${wholeHours} 小时 ${remainMinutes} 分钟`;
}

function goalMinutesFromPicker(hours, minutes) {
  const total = Number(hours) * 60 + Number(minutes);
  return Number.isFinite(total) && total >= 30 && total <= 1440 ? total : null;
}

function goalPickerValue(minutes) {
  const rounded = Math.min(1440, Math.max(30, Math.round(minutes / 15) * 15));
  return [Math.floor(rounded / 60), (rounded % 60) / 15];
}

module.exports = { parseGoalHours, formatGoalMinutes, goalMinutesFromPicker, goalPickerValue };
