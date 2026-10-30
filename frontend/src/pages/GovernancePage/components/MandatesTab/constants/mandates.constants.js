// The states a mandate can still be acted on in (expired and revoked are final)
export const LIVE_STATES = ['draft', 'pending_approval', 'active', 'suspended'];

export const OWNER_DELEGATED = 'owner_delegated';

// What a mandate's runs act with on resources that need a person (#7131)
export const IDENTITY_LABELS = {
  owner_delegated: "Owner's Microsoft sign-in",
  application: 'Application credentials',
};

export const OPERATION_OPTIONS = [
  { value: 'run:schedule', label: 'Schedules' },
  { value: 'run:webhook', label: 'Webhooks' },
];

// A toolkit mandate (#7305) covers the index schedules of one toolkit, and only those
export const INDEX_OPERATION = { value: 'run:index_schedule', label: 'Index schedules' };

export const OPERATION_LABELS = Object.fromEntries(
  [...OPERATION_OPTIONS, INDEX_OPERATION].map(option => [option.value, option.label]),
);

// What a mandate covers: an agent version, or the owner's index schedules of one toolkit
export const COVERS_AGENT = 'agent';
export const COVERS_TOOLKIT = 'toolkit';

export const DEFAULT_VALID_DAYS = 30;
export const MAX_VALID_DAYS = 180;
export const DEFAULT_RUNTIME_MINUTES = 60;

export const CONSENT_TEXT =
  'Scheduled and webhook runs of this agent version will act with your Microsoft sign-in, as you, until you withdraw ' +
  'the consent or the mandate ends. Signing out does not end it. You may be asked to sign in again first.';

export const WITHDRAW_TEXT =
  'Runs of this mandate stop acting with the owner’s Microsoft sign-in from the next run on; they are refused until ' +
  'the owner consents again.';

export const TOOLKIT_CONSENT_TEXT =
  'Scheduled index runs of this toolkit will act with your Microsoft sign-in, as you, until you withdraw the consent ' +
  'or the mandate ends. Signing out does not end it. You may be asked to sign in again first.';

// What each confirmed action does, as the operator reads it before confirming
export const ACTION_TEXT = {
  submit: { label: 'Submit for approval', description: 'The mandate goes to approval by another operator.' },
  reject: { label: 'Reject', description: 'The mandate goes back to draft.' },
  suspend: {
    label: 'Suspend',
    description: 'Its runs are refused, and running ones stop, until it is resumed.',
  },
  resume: { label: 'Resume', description: 'Its runs are admitted again.' },
  revoke: {
    label: 'Revoke',
    description: 'The mandate ends for good, with the owner’s consent; running ones stop.',
    destructive: true,
  },
  consent: { label: 'Give consent', description: CONSENT_TEXT },
  withdraw_consent: { label: 'Withdraw consent', description: WITHDRAW_TEXT, destructive: true },
};
