// Explicit timezone: an audit time must not be read as some other zone (#7504)
// 17 Nov 2026
export const formatCoverageDate = value =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Zone name shown once in the Time column header, e.g. GMT+2
export const timeZoneLabel = () =>
  new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find(part => part.type === 'timeZoneName')?.value ?? '';

// Short cell value; the zone is in the column header and the full value in the details
export const formatTableTimestamp = value => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatTimestampWithZone = value => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return String(value);
  }
};

const formatRoles = roles => (roles && roles.length ? roles.join(', ') : '—');

export const summarizeChanges = row => {
  if (row.roles_before || row.roles_after) {
    if ((row.roles_before ?? []).join() !== (row.roles_after ?? []).join()) {
      return `${formatRoles(row.roles_before)} → ${formatRoles(row.roles_after)}`;
    }
  }
  const entries = Object.entries(row.changes ?? {});
  if (!entries.length) return '';
  return entries
    .map(([field, change]) => `${field}: ${change?.before ?? '—'} → ${change?.after ?? '—'}`)
    .join('; ');
};

// :system:project:31: is a project's service account
const SYSTEM_USER_NAME = /^:system:project:(\d+):$/;

const displayName = name => {
  const match = SYSTEM_USER_NAME.exec(name ?? '');
  return match ? `System user · project ${match[1]}` : name;
};

export const actorLabel = row =>
  displayName(row.actor_name) || row.actor_email || (row.actor_id != null ? `#${row.actor_id}` : 'Unknown');

export const userLabel = row =>
  displayName(row.user_name) || row.user_email || (row.user_id != null ? `#${row.user_id}` : '');

export const scopeLabel = row =>
  row.project_id != null ? row.project_name || `#${row.project_id}` : 'Platform';

export const formatValue = value => {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

// Params for the list and the export: a date range is always sent, so the backend prunes partitions
export const buildQueryParams = (tab, filters, search) => ({
  tab,
  date_from: filters.date_from instanceof Date ? filters.date_from.toISOString() : undefined,
  date_to: filters.date_to instanceof Date ? filters.date_to.toISOString() : undefined,
  ...(filters.event_type && { event_type: filters.event_type }),
  ...(filters.project_id && { project_id: filters.project_id }),
  ...(filters.project_name && { project_name: filters.project_name }),
  ...(filters.project_type && { project_type: filters.project_type }),
  ...(filters.user_id && { user_id: filters.user_id }),
  ...(filters.user_name && { user_name: filters.user_name }),
  ...(filters.user_email && { user_email: filters.user_email }),
  ...(filters.actor && { actor: filters.actor }),
  ...(filters.role && { role: filters.role }),
  ...(filters.admin_only && { admin_access: 'any' }),
  ...(filters.result && { result: filters.result }),
  ...(filters.source && { source: filters.source }),
  ...(search && { q: search }),
});

// UTC for the record, local time for reading; JSON-valued cells stay as the backend wrote them
export const exportColumns = () => [
  { key: 'occurred_at', header: 'Time (UTC)' },
  {
    key: 'occurred_at',
    header: `Time (${timeZoneLabel()})`,
    transform: value => (value ? formatTableTimestamp(value) : ''),
  },
  { key: 'event_type', header: 'Event type' },
  { key: 'project_id', header: 'Project ID' },
  { key: 'project_name', header: 'Project name' },
  { key: 'project_type', header: 'Project type' },
  { key: 'user_id', header: 'User ID' },
  { key: 'user_name', header: 'User name' },
  { key: 'user_email', header: 'User email' },
  { key: 'actor_type', header: 'Actor type' },
  { key: 'actor_id', header: 'Actor ID' },
  { key: 'actor_name', header: 'Performed by' },
  { key: 'actor_email', header: 'Actor email' },
  { key: 'roles_before', header: 'Roles before' },
  { key: 'roles_after', header: 'Roles after' },
  { key: 'admin_access', header: 'Administrator access' },
  { key: 'changes', header: 'Changes' },
  { key: 'details', header: 'Details' },
  { key: 'scope', header: 'Scope' },
  { key: 'source', header: 'Source' },
  { key: 'result', header: 'Result' },
  { key: 'failure_reason', header: 'Failure reason' },
  { key: 'request_id', header: 'Request ID' },
  { key: 'imported', header: 'Imported' },
  { key: 'event_id', header: 'Event ID' },
];

export const exportFileName = (tab, now = new Date()) =>
  `Lifecycle_audit_${tab}_${now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_')}Z.xlsx`;
