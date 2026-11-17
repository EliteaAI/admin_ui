export const LIFECYCLE_AUDIT_TABS = [
  { value: 'projects', label: 'Projects' },
  { value: 'users', label: 'Users' },
];

export const PROJECT_EVENT_TYPES = [
  { value: 'project.created', label: 'Project created' },
  { value: 'project.renamed', label: 'Project renamed' },
  { value: 'project.deleted', label: 'Project deleted' },
  { value: 'project.suspended', label: 'Project suspended' },
  { value: 'project.unsuspended', label: 'Project unsuspended' },
  { value: 'project.member_added', label: 'User added to project' },
  { value: 'project.member_removed', label: 'User removed from project' },
  { value: 'project.member_role_changed', label: 'Project role changed' },
];

export const USER_EVENT_TYPES = [
  { value: 'user.created', label: 'User created' },
  { value: 'user.first_login', label: 'First successful login' },
  { value: 'project.member_added', label: 'Added to project' },
  { value: 'project.member_removed', label: 'Removed from project' },
  { value: 'project.member_role_changed', label: 'Project role changed' },
  { value: 'user.platform_role_changed', label: 'Platform role changed' },
  { value: 'user.name_changed', label: 'Name changed' },
  { value: 'user.email_changed', label: 'Email changed' },
  { value: 'user.suspended', label: 'User suspended' },
  { value: 'user.unsuspended', label: 'User unsuspended' },
  { value: 'user.deleted', label: 'User deleted' },
];

export const EVENT_LABELS = Object.fromEntries(
  [...PROJECT_EVENT_TYPES, ...USER_EVENT_TYPES].map(item => [item.value, item.label]),
);

export const SOURCE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ui', label: 'UI' },
  { value: 'api', label: 'API' },
  { value: 'provisioning', label: 'Provisioning' },
  { value: 'system', label: 'System' },
];

export const RESULT_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
];

export const PROJECT_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'team', label: 'Team' },
  { value: 'private', label: 'Private' },
];

// Same presets as Audit Trail
export const DATE_PRESETS = [
  {
    label: 'Today',
    getRange: () => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
  {
    label: 'Yesterday',
    getRange: () => {
      const from = new Date();
      from.setDate(from.getDate() - 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setDate(to.getDate() - 1);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
  {
    label: '7d',
    getRange: () => {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const from = new Date();
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    },
  },
  {
    label: '30d',
    getRange: () => {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const from = new Date();
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    },
  },
];

export const DEFAULT_PRESET = '30d';

export const PAGE_SIZE_OPTIONS = [25, 50, 100];
