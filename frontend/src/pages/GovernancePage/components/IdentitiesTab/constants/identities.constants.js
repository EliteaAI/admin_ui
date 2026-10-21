// The states an identity goes through, in lifecycle order (the filter lists them)
export const STATES = [
  'draft',
  'provisioning',
  'pending_approval',
  'active',
  'suspended',
  'retiring',
  'retired',
];

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

export const SELF_APPROVAL_HINT =
  'You created or last changed this identity; another operator must approve it.';
