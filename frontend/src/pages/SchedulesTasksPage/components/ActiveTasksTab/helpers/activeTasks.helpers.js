import { STATUS_RANK } from '@/pages/SchedulesTasksPage/components/ActiveTasksTab/constants/activeTasks.constants';

export const statusRank = status => {
  const rank = STATUS_RANK[(status || '').toLowerCase()];
  return rank == null ? 2 : rank;
};

export const parseMeta = meta => {
  if (!meta) return '';
  try {
    const match = meta.match(/'task':\s*'([^']+)'/);
    if (match) return match[1];
  } catch {
    // ignore
  }
  return String(meta).length > 60 ? String(meta).substring(0, 60) + '...' : String(meta);
};

// Backend timestamp is naive UTC (server wall-clock); force UTC parse and read
// UTC components so display matches the stored time regardless of viewer tz.
export const formatUtc = value => {
  if (!value) return '—';
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return (
    `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`
  );
};

// Clock time (UTC) of an epoch ms value, for the "last refreshed" indicator.
export const formatClockUtc = ts => {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
};

// Case-insensitive match across every visible task field, including the
// UTC-formatted time so searching the value the user sees works. Hidden columns
// are excluded so search matches only what's on screen.
export const taskMatchesSearch = (task, lowerQuery, hidden) => {
  if (!lowerQuery) return true;
  const parts = [
    task.project_id,
    task.user_id,
    formatUtc(task.started_at),
    task.status,
    task.user_input_preview,
  ];
  if (!hidden?.task_id) parts.push(task.task_id);
  if (!hidden?.meta) parts.push(task.meta);
  if (!hidden?.runner) parts.push(task.runner);
  const haystack = parts
    .map(v => (v == null ? '' : String(v)))
    .join(' ')
    .toLowerCase();
  return haystack.includes(lowerQuery);
};
