import {
  ACTIONS,
  ACTIONS_BY_STATE,
  MODE_LABELS,
  SELF_APPROVAL_HINT,
} from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';

export const modeLabel = mode => MODE_LABELS[mode] ?? mode;

export const rowTitle = row => `${row.application?.name ?? 'Agent'} ${row.version?.name ?? ''}`.trim();

// The backend refuses an approval by the operator who created the identity or last changed its state
const isOwnApproval = (row, userId) =>
  userId != null && [row.created_by?.id, row.state_changed_by?.id].some(id => id != null && id === userId);

/**
 * The actions the menu offers for a row: those valid from its state that the operator may run.
 * `activate` needs the approve permission, the others the manage permission. Each entry is
 * `{ action, label, disabled, hint }`; `hint` says why an entry is disabled.
 */
export const getRowActions = (row, { canManage, canApprove, userId }) =>
  (ACTIONS_BY_STATE[row.state] ?? [])
    .filter(action => (action === 'activate' ? canApprove : canManage))
    .map(action => {
      const disabled = action === 'activate' && isOwnApproval(row, userId);
      return {
        action,
        label: ACTIONS[action].label,
        disabled,
        hint: disabled ? SELF_APPROVAL_HINT : undefined,
      };
    });

export const buildListParams = ({ projectId, state, mode, search, page, pageSize, sort }) => ({
  projectId,
  limit: pageSize,
  offset: page * pageSize,
  state: state || undefined,
  identity_mode: mode || undefined,
  search: search || undefined,
  sort_by: sort.field,
  sort_order: sort.direction,
});

export const successMessage = (row, action) => `${rowTitle(row)} ${ACTIONS[action].success}.`;
