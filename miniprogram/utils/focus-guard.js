function useBreak(remaining) {
  if (Number(remaining) <= 0) return { allowed: false, remaining: 0, seconds: 0 };
  return { allowed: true, remaining: Number(remaining) - 1, seconds: 300 };
}

function beginExit(running, remaining) {
  if (!running) return { paused: false, ...useBreak(remaining) };
  return { paused: true, ...useBreak(remaining) };
}

function returnFromBreak() {
  return { onBreak: false, breakSeconds: 0 };
}

function formatElapsed(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return minutes ? `${minutes} 分 ${remain} 秒` : `${remain} 秒`;
}

module.exports = { useBreak, beginExit, returnFromBreak, formatElapsed };
