export const formatTimestamp = value => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(value);
  }
};

export const formatDuration = ms => {
  if (ms == null) return '-';
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Format an epoch timestamp (seconds) into a local-time label.
 * Uses 12-hour AM/PM format to match the table's time display.
 */
export const formatEpoch = (epoch, intervalSec, rangeSec) => {
  const dt = new Date(epoch * 1000);
  const pad = n => String(n).padStart(2, '0');
  if (intervalSec >= 86400) {
    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}`;
  }
  let hours = dt.getHours();
  const minutes = dt.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const time = `${hours}:${pad(minutes)} ${ampm}`;
  if (rangeSec > 86400) {
    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())} ${time}`;
  }
  return time;
};
