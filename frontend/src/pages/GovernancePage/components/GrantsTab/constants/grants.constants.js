// The states a grant goes through, in lifecycle order (the filter lists them)
export const STATES = ['pending_approval', 'active', 'suspended', 'revoked'];

// A grant can not be valid for longer than this (the backend refuses a later date)
export const MAX_VALIDITY_DAYS = 365;

export const SELF_APPROVAL_HINT = 'You created this grant; another operator must approve it.';

// The actions that are valid from each state. This mirrors the lifecycle in the backend, which decides for real.
export const ACTIONS_BY_STATE = {
  pending_approval: ['approve', 'revoke'],
  active: ['suspend', 'revoke'],
  suspended: ['resume', 'revoke'],
  revoked: [],
};

export const ACTIONS = {
  approve: {
    label: 'Approve',
    confirmLabel: 'Approve',
    description:
      'Lets the agent use the credential for this user. A second administrator must approve it: the operator who created the grant cannot.',
    success: 'approved',
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
    description: 'Lets the agent use the credential for this user again.',
    success: 'resumed',
  },
  revoke: {
    label: 'Revoke',
    confirmLabel: 'Revoke',
    description:
      'Revoking is permanent: the agent can not use the credential for this user again. Runs admitted earlier are stopped at their next check.',
    success: 'revoked',
    destructive: true,
  },
};
