function startSession(seconds, now = Date.now(), metadata = {}) {
  const initialSeconds = Math.max(1, Math.floor(Number(seconds) || 0));
  return { initialSeconds, endsAt: now + initialSeconds * 1000, running: true, ...metadata };
}

function remainingSeconds(session, now = Date.now()) {
  if (!session) return 0;
  if (!session.running) return Math.max(0, Math.ceil(Number(session.remainingSeconds) || 0));
  return Math.max(0, Math.ceil((Number(session.endsAt) - now) / 1000));
}

function pauseSession(session, now = Date.now()) {
  return { ...session, running: false, remainingSeconds: remainingSeconds(session, now) };
}

function resumeSession(session, now = Date.now()) {
  const remaining = remainingSeconds(session, now);
  return { ...session, running: true, endsAt: now + remaining * 1000, remainingSeconds: undefined };
}

function shouldFinish(session, now = Date.now()) {
  return Boolean(session && session.running && remainingSeconds(session, now) === 0);
}

module.exports = { startSession, remainingSeconds, pauseSession, resumeSession, shouldFinish };
