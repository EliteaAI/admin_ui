import {
  ACTION_TEXT,
  IDENTITY_LABELS,
  LIVE_STATES,
  OWNER_DELEGATED,
} from '@/pages/GovernancePage/components/MandatesTab/constants/mandates.constants';

export const identityLabel = source => (source ? (IDENTITY_LABELS[source] ?? source) : 'None');

export const consentLabel = row => {
  if (row.identity_source !== OWNER_DELEGATED) return '-';
  return row.consented ? 'Consented' : 'Consent needed';
};

export const rowTitle = row => `${row.application?.name ?? 'Agent'} ${row.version?.name ?? ''}`.trim();

const SELF_APPROVAL_HINT = 'The creator or the owner of a mandate cannot approve or resume it.';

// The actions valid for the row's state and allowed for the operator. Consent is the owner's own, in their own session.
export const getRowActions = (row, { canManage, canApprove, userId }) => {
  const own = userId != null && row.owner?.id === userId;
  const created = userId != null && row.created_by?.id === userId;
  const live = LIVE_STATES.includes(row.state);
  const actions = [];
  if (canManage && row.state === 'draft') actions.push({ action: 'submit', label: ACTION_TEXT.submit.label });
  if (canManage && row.state === 'pending_approval')
    actions.push({ action: 'reject', label: ACTION_TEXT.reject.label });
  if (canApprove && row.state === 'pending_approval')
    actions.push({
      action: 'approve',
      label: 'Approve',
      disabled: own || created,
      hint: own || created ? SELF_APPROVAL_HINT : null,
    });
  if (canManage && row.state === 'active')
    actions.push({ action: 'suspend', label: ACTION_TEXT.suspend.label });
  if (canApprove && row.state === 'suspended')
    actions.push({
      action: 'resume',
      label: ACTION_TEXT.resume.label,
      disabled: own,
      hint: own ? SELF_APPROVAL_HINT : null,
    });
  if (row.identity_source === OWNER_DELEGATED && live && own)
    actions.push({ action: 'consent', label: row.consented ? 'Consent again' : ACTION_TEXT.consent.label });
  if (row.identity_source === OWNER_DELEGATED && row.consented && canManage)
    actions.push({ action: 'withdraw_consent', label: ACTION_TEXT.withdraw_consent.label });
  if (canManage && live) actions.push({ action: 'revoke', label: ACTION_TEXT.revoke.label });
  return actions;
};

const DONE = {
  submit: 'submitted for approval',
  reject: 'sent back to draft',
  approve: 'approved',
  suspend: 'suspended',
  resume: 'resumed',
  revoke: 'revoked',
  consent: 'consented: its runs act with your Microsoft sign-in',
  withdraw_consent: 'no longer acts with the owner’s sign-in',
};

export const successMessage = (row, action) => `Mandate for ${rowTitle(row)} ${DONE[action] ?? 'changed'}.`;

// The ISO date-time (end of that day, UTC) the backend wants for a yyyy-mm-dd picked in the form
export const validUntilOf = day => (day ? `${day}T23:59:00+00:00` : null);

export const dayFromNow = days => {
  const date = new Date(Date.now() + days * 86400000);
  return date.toISOString().slice(0, 10);
};
