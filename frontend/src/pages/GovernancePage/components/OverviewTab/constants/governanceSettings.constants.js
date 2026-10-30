export const MODES = ['off', 'audit_only', 'enforce'];

export const MODE_RANK = { off: 0, audit_only: 1, enforce: 2 };

export const MAX_POLICY_REVISION = 128;
export const MAX_ENVIRONMENT = 64;
export const MAX_CHANGE_NOTE = 256;

// Shown while the backend sends no `descriptions`; the backend text always wins when present
export const FALLBACK_DESCRIPTIONS = {
  modes: {
    off: {
      label: 'Off',
      tooltip:
        'Agents run exactly as they do without governance: no identity checks, no agent bindings, no credential decisions. Use this until bindings and credentials are prepared, or to roll back.',
    },
    audit_only: {
      label: 'Audit only',
      tooltip:
        "Every run is checked as if governance were enforced, and the result is recorded, but nothing is refused. Users see no refusals; runs take as long to start as under enforce, so you can measure the cost. Use it to find agents and credentials that are not ready before you enforce. Runs of schedules on the Schedules page are checked against their owner's mandate and leave 'would deny' records, and so are scheduled index runs, against the index-schedule mandate of the schedule's owner on the toolkit; sub-agent runs are evaluated with an interactive parent run. Webhook runs and legacy cron triggers are not evaluated in this mode.",
    },
    enforce: {
      label: 'Enforce',
      tooltip:
        "Runs are refused unless the user's identity is verified, the agent version has an active binding, and every credential it uses is approved and granted to that user. Users see a short refusal message. Turn this on only after audit-only shows no unexpected refusals.",
    },
  },
  fields: {
    policy_revision: {
      label: 'Policy revision',
      tooltip:
        'A label for the rules you approved, for example a change ticket or date. It is recorded on every run and approval. Changing it does not stop runs already started. Required for audit-only and enforce.',
    },
    environment: {
      label: 'Environment label',
      tooltip:
        "Names this deployment in audit records, for example 'prod-eu'. It changes no behaviour. Use it so security reviews can tell environments apart.",
    },
    admit_legacy_pat: {
      label: 'Admit legacy API tokens',
      tooltip:
        'When on, runs started with a personal API token pass the identity check. They still cannot act for a user without a mandate. Leave it off unless integrations that use tokens must keep running under governance.',
    },
    allow_runtime_domain_binding: {
      label: 'Allow runtime domain bindings',
      tooltip:
        'When on, agents may use a binding whose identity is resolved by the identity provider at run time. Leave it off unless your identity team has set up runtime agent identities.',
    },
    allow_development_runs: {
      label: 'Allow development runs',
      tooltip:
        "When on, the agent and pipeline editor's test chat may run a version that has no identity binding yet. Such a run acts as the signed-in author only and may use only the author's own credentials: personal ones, and project credentials already granted to that person. Nothing it produces can be shared, published or scheduled. Default: on under audit only, off under enforce; choose explicitly when you enforce.",
    },
    change_note: {
      label: 'Change note',
      placeholder: 'Why are you changing this? (recorded in the history)',
    },
  },
  locks: {
    max_mode:
      "This deployment allows governance up to '<max>'. Raising the limit is a deployment change (`ELITEA_CREDENTIAL_GOVERNANCE_MAX_MODE`).",
    environment:
      'Set by the deployment (`ELITEA_CREDENTIAL_GOVERNANCE_ENVIRONMENT`). Change it in the deployment configuration; it cannot be changed here.',
    capped:
      "The deployment limits governance to '<max>', so the saved mode '<stored>' is not in effect. Raise `ELITEA_CREDENTIAL_GOVERNANCE_MAX_MODE` or choose a lower mode.",
  },
  preflight: {
    ready: 'Ready: everything audit-only and enforce depend on is in place.',
    not_ready:
      'Not ready: governance can stay off, but cannot be turned on until the failed checks below are fixed.',
    ready_with_warnings:
      'Ready, with warnings: governance can be turned on; the items below limit some features.',
    unavailable:
      'Governance is on but a required service is unavailable. Governed runs are being refused. Fix the failed check or switch to Off.',
    table_missing:
      'Settings storage is not set up. Run the task create_governance_settings_tables under System → Tasks.',
    column_missing:
      'Settings storage needs an update. Run the task create_governance_settings_tables under System → Tasks.',
  },
  checks: {
    identity_verifier: 'The user identity verifier is not configured.',
    auth_rpc_mode: 'Authentication must run in RPC mode.',
    security_audit: 'The security audit trail is not available.',
    audit_backlog: 'The security audit backlog is over its limit; new governed runs would be refused.',
    credential_facts: 'Credential services are not loaded.',
    master_key: 'The secrets master key is not set.',
    settings_table:
      'Settings storage is not set up. Run the task create_governance_settings_tables under System → Tasks.',
    corporate_vault: 'Corporate Vault is not configured; only database-stored credentials can be registered.',
    governed_worker: 'No worker that can run governed agents is online right now.',
  },
  switch_dialog: {
    title: 'Switch governance to <Mode>?',
    enforce:
      'In the last 24 hours, audit-only recorded <n> runs that would have been refused (top reasons below). Those runs will now be refused.',
    off: 'Identity, binding and credential checks stop for new runs. Runs already admitted keep their admission.',
  },
};

export const READ_ERROR_TEXT = 'The settings could not be read right now. Try again.';
