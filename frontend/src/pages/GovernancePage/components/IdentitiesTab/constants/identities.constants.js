export const PAGE_SIZE_OPTIONS = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_SORT = { field: 'updated_at', direction: 'desc' };

// The backend accepts exactly these letters, digits and . _ : / @ - (1 to 128 characters)
export const REFERENCE_PATTERN = /^[A-Za-z0-9._:/@-]{1,128}$/;

export const STATE_LABELS = {
  draft: 'Draft',
  provisioning: 'Provisioning',
  pending_approval: 'Pending approval',
  active: 'Active',
  suspended: 'Suspended',
  retiring: 'Retiring',
  retired: 'Retired',
};

// Chip colour by state: in use is green, on its way in is blue, taken out of use is amber, finished is grey
export const STATE_COLORS = {
  draft: 'info',
  provisioning: 'info',
  pending_approval: 'info',
  active: 'success',
  suspended: 'warning',
  retiring: 'warning',
  retired: 'default',
};

export const MODE_LABELS = {
  elitea_native: 'Elitea native',
  dedicated_agent: 'Dedicated agent',
  runtime_domain_binding: 'Runtime domain binding',
};
export const MODE_OPTIONS = Object.keys(MODE_LABELS);
export const RUNTIME_DOMAIN_MODE = 'runtime_domain_binding';
export const DEFAULT_MODE = 'elitea_native';

export const DIGEST_STATUS = {
  match: {
    label: 'Match',
    color: 'success',
    hint: 'The agent is the same as when this binding was approved.',
  },
  changed: {
    label: 'Changed',
    color: 'warning',
    hint: 'The agent was edited after this binding was created or approved. Rebind it to approve the new definition.',
  },
  unknown: { label: 'Unknown', color: 'default', hint: 'The current definition could not be read.' },
};

// The actions that are valid from each state. This mirrors the lifecycle in the backend, which decides for real.
export const ACTIONS_BY_STATE = {
  draft: ['submit', 'retire'],
  provisioning: ['retire'],
  pending_approval: ['activate', 'retire'],
  active: ['suspend', 'rebind', 'retire'],
  suspended: ['resume', 'rebind', 'retire'],
  retiring: ['retire'],
  retired: [],
};

// What each action is called, what it does, and what the operator is told when it worked
export const ACTIONS = {
  submit: {
    label: 'Submit for approval',
    confirmLabel: 'Submit',
    description: 'Moves the identity to pending approval. A second operator then approves and activates it.',
    success: 'submitted for approval',
  },
  activate: {
    label: 'Approve & activate',
    confirmLabel: 'Approve & activate',
    description: 'Makes the agent version usable under governance.',
    success: 'activated',
  },
  suspend: {
    label: 'Suspend',
    confirmLabel: 'Suspend',
    description: 'Runs admitted earlier with it are stopped at their next check. You can resume it later.',
    success: 'suspended',
  },
  resume: {
    label: 'Resume',
    confirmLabel: 'Resume',
    description:
      'Puts the identity back in use. It is refused if the agent changed since it was approved; rebind it first.',
    success: 'resumed',
  },
  rebind: {
    label: 'Rebind',
    confirmLabel: 'Rebind',
    description:
      'Approves the agent again as it is now. The identity goes back to pending approval, the earlier approval is cleared and runs admitted earlier are stopped at their next check. Another operator then activates it.',
    success: 'sent back for approval',
  },
  retire: {
    label: 'Retire',
    confirmLabel: 'Retire',
    description:
      'Retiring is permanent: the identity can not be used again. Runs admitted earlier are stopped at their next check.',
    success: 'retired',
    destructive: true,
  },
};

// A change that raced another operator, or a view that is out of date. The list is read again and the operator is told.
export const STALE_CODES = ['CONCURRENT_CHANGE', 'INVALID_STATE'];

export const SELF_APPROVAL_HINT =
  'You created or last changed this identity; another operator must approve it.';
