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
