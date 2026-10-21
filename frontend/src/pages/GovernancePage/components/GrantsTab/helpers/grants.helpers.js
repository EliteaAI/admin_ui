import {
  ACTIONS,
  ACTIONS_BY_STATE,
  MAX_VALIDITY_DAYS,
  SELF_APPROVAL_HINT,
} from '@/pages/GovernancePage/components/GrantsTab/constants/grants.constants';

const DAY_MS = 24 * 60 * 60 * 1000;

export const bindingTitle = binding =>
  `${binding?.application_name ?? 'Agent'} ${binding?.version_name ?? ''}`.trim();

export const toolkitTitle = toolkit => toolkit?.name ?? (toolkit?.id != null ? `Toolkit ${toolkit.id}` : '-');

// The user a grant is for. A subject that maps to no member of the project shows its raw reference.
export const subjectLabel = subject => subject?.user?.email ?? subject?.ref ?? '-';

export const grantTitle = row => `${bindingTitle(row.binding)} · ${toolkitTitle(row.toolkit)}`;

const isOwnApproval = (row, userId) =>
  userId != null && row.created_by?.id != null && row.created_by.id === userId;

/**
 * The actions the menu offers for a row: those valid from its state that the operator may run. `approve` needs the
 * approve permission, the others the manage permission. Each entry is `{ action, label, disabled, hint }`.
 */
export const getRowActions = (row, { canManage, canApprove, userId }) =>
  (ACTIONS_BY_STATE[row.state] ?? [])
    .filter(action => (action === 'approve' ? canApprove : canManage))
    .map(action => {
      const disabled = action === 'approve' && isOwnApproval(row, userId);
      return {
        action,
        label: ACTIONS[action].label,
        disabled,
        hint: disabled ? SELF_APPROVAL_HINT : undefined,
      };
    });

export const buildListParams = ({ projectId, state, user, page, pageSize, sort }) => ({
  projectId,
  limit: pageSize,
  offset: page * pageSize,
  state: state || undefined,
  subject_user_id: user?.id,
  sort_by: sort.field,
  sort_order: sort.direction,
});

export const successMessage = (row, action) => `${grantTitle(row)} ${ACTIONS[action].success}.`;

/**
 * The `valid_until` of a form field (`YYYY-MM-DDTHH:mm`, local time) as the backend wants it: ISO-8601 with an offset.
 * Returns `{ value }`, or `{ problem }` with the reason it can not be used. An empty field means no end date.
 */
export const parseValidUntil = (text, now = Date.now()) => {
  if (!text) return { value: undefined };
  const time = new Date(text).getTime();
  if (Number.isNaN(time)) return { problem: 'Enter a valid date and time.' };
  if (time <= now) return { problem: 'The end date must be in the future.' };
  if (time > now + MAX_VALIDITY_DAYS * DAY_MS) {
    return { problem: `A grant can be valid for at most ${MAX_VALIDITY_DAYS} days.` };
  }
  return { value: new Date(time).toISOString().replace(/\.\d{3}Z$/, '+00:00') };
};
