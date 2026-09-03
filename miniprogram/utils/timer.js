function toSeconds(minutes, seconds) {
  return Number(minutes) * 60 + Number(seconds);
}

function fromSeconds(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  return { minutes: Math.floor(safe / 60), seconds: safe % 60 };
}

module.exports = { toSeconds, fromSeconds };
