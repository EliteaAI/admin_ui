// The classes a reference can be registered as
export const CREATE_CLASSES = ['project_shared', 'service', 'technical', 'personal'];

export const STORE_LABELS = {
  database: 'Database',
  managed_vault: 'Managed Vault',
  corporate_vault: 'Corporate Vault',
};
export const CREATE_STORES = ['database', 'corporate_vault'];
export const CORPORATE_VAULT_STORE = 'corporate_vault';

// The states a reference goes through, in lifecycle order (the filter lists them)
export const STATES = ['pending', 'validated', 'active', 'suspended', 'retired'];

// States in which a personal value can be written (the backend decides for real)
export const VALUE_STATES = ['pending', 'validated', 'suspended'];
// States a personal credential can be tested against its provider in
export const CHECK_STATES = ['pending', 'validated', 'active'];

export const PERSONAL_NOTICE =
  'Recorded and checked for every run. While this personal credential is not active, runs of its owner on agents that use this configuration are refused; once active, those runs use it instead of the shared credential.';

export const SELF_APPROVAL_HINT =
  'You created this reference or wrote its value; another operator must approve it.';

export const OWNER_ONLY_HINT = 'Only the owner sets a personal value, from their own Credentials page.';

const MIGRATION_TASK = 'create_credential_governance_tables';
export const MIGRATION_HINT = `Personal credentials need a database update first. Run the admin task ${MIGRATION_TASK} under System → Tasks, then try again.`;

// The row-menu actions in the order they are offered, and what each does and says when it worked.
export const ACTION_ORDER = [
  'setValue',
  'import',
  'probe',
  'approve',
  'activate',
  'suspend',
  'resume',
  'retire',
];

export const ACTIONS = {
  setValue: { label: 'Set personal value' },
  import: {
    label: 'Import from configuration',
    confirmLabel: 'Import',
    description:
      'Copies the credential of the configuration into the store as a new generation. The reference goes back to pending: it has to be probed and approved again.',
    success: 'imported',
  },
  probe: {
    label: 'Probe',
    confirmLabel: 'Probe',
    description:
      'Checks that the stored credential is complete and readable. A successful probe moves the reference to validated.',
    success: 'probed',
  },
  approve: {
    label: 'Approve',
    confirmLabel: 'Approve',
    description:
      'Records that the stored credential was reviewed. A second administrator must approve it: the operator who created the reference, or who wrote its value, cannot.',
    success: 'approved; activate it next',
  },
  activate: {
    label: 'Activate',
    confirmLabel: 'Activate',
    description: 'Makes the credential usable under governance. Grants can then let agents use it.',
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
    description: 'Puts the credential back in use.',
    success: 'resumed',
  },
  retire: {
    label: 'Retire',
    confirmLabel: 'Retire',
    description:
      'Retiring is permanent: the credential can not be used again. Runs admitted earlier are stopped at their next check.',
    success: 'retired',
    destructive: true,
  },
};
