export const POOL_COLUMNS = [
  { field: 'pool', label: 'Pool', width: '1fr', sortable: false },
  { field: 'ident', label: 'Ident', width: '1fr', sortable: false },
  { field: 'task_limit', label: 'Task Limit', width: '8rem', sortable: false },
  { field: 'running_tasks', label: 'Running', width: '8rem', sortable: false },
];

export const TASK_COLUMNS = [
  { field: 'project_id', label: 'Project ID', width: '8rem', sortable: true },
  {
    field: 'user_id',
    label: 'User ID',
    width: '8rem',
    sortable: true,
    hideBelow: 1100,
  },
  { field: 'started_at', label: 'Time', width: '13rem', sortable: true },
  { field: 'status', label: 'Status', width: '7rem', sortable: true },
  {
    field: 'user_input_preview',
    label: 'User input',
    width: '1fr',
    sortable: false,
  },
  {
    field: 'task_id',
    label: 'Task ID',
    width: '1fr',
    sortable: false,
    hideBelow: 1000,
  },
  {
    field: 'meta',
    label: 'Meta',
    width: '1fr',
    sortable: false,
    hideBelow: 1300,
  },
  {
    field: 'runner',
    label: 'Runner',
    width: '1fr',
    sortable: false,
    hideBelow: 900,
  },
  { field: 'actions', label: '', width: '9rem', sortable: false },
];

// User-toggleable columns (the wide/opaque ones). All shown by default.
export const TOGGLEABLE_COLUMNS = [
  { field: 'task_id', label: 'Task ID' },
  { field: 'meta', label: 'Meta' },
  { field: 'runner', label: 'Runner' },
];

export const STATUS_CONFIG = {
  running: { label: 'Running', color: 'success' },
  done: { label: 'Done', color: 'default' },
  error: { label: 'Error', color: 'error' },
  stopped: { label: 'Stopped', color: 'warning' },
};

// Default ordering priority: actionable Running first, Pending sunk to the
// bottom (never hidden), everything else in between. Lower = higher up.
export const STATUS_RANK = { running: 0, error: 1, done: 2, pending: 3 };
