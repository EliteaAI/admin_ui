// Short names of the preflight checks, by their stable ids. The failure text comes from the backend.
export const CHECK_LABELS = {
  identity_verifier: 'Identity verifier',
  auth_rpc_mode: 'Authentication mode',
  security_audit: 'Security audit',
  audit_backlog: 'Audit backlog',
  credential_facts: 'Credential services',
  master_key: 'Master key',
  settings_table: 'Settings storage',
  corporate_vault: 'Corporate Vault',
  governed_worker: 'Governed worker',
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_SORT = { field: 'updated_at', direction: 'desc' };

// The backend accepts exactly these letters, digits and . _ : / @ - (1 to 128 characters)
export const REFERENCE_PATTERN = /^[A-Za-z0-9._:/@-]{1,128}$/;
export const REFERENCE_HELP = 'Letters, digits and . _ : / @ - (at most 128 characters).';

// A change that raced another operator, or a view that is out of date. The list is read again and the operator is told.
export const STALE_CODES = ['CONCURRENT_CHANGE', 'INVALID_STATE'];

// The states of identities, credential references and grants, as the operator reads them
export const STATE_LABELS = {
  draft: 'Draft',
  provisioning: 'Provisioning',
  pending: 'Pending',
  pending_approval: 'Pending approval',
  validated: 'Validated',
  active: 'Active',
  suspended: 'Suspended',
  retiring: 'Retiring',
  retired: 'Retired',
  revoked: 'Revoked',
};

// Chip colour by state: in use is green, on its way in is blue, taken out of use is amber, finished is grey
export const STATE_COLORS = {
  draft: 'info',
  provisioning: 'info',
  pending: 'info',
  pending_approval: 'info',
  validated: 'info',
  active: 'success',
  suspended: 'warning',
  retiring: 'warning',
  retired: 'default',
  revoked: 'default',
};

// Finished records are shown dimmed
export const FINISHED_STATES = ['retired', 'revoked'];

// The classes of a credential reference (a personal one belongs to one member of the project)
export const OWNERSHIP_CLASS_LABELS = {
  project_shared: 'Project shared',
  service: 'Service',
  technical: 'Technical',
  personal: 'Personal',
  scheduled: 'Scheduled',
};
