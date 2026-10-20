import { checkLabel } from '@/pages/GovernancePage/helpers/governance.helpers';

import { FALLBACK_DESCRIPTIONS, MODE_RANK } from '../constants/governanceSettings.constants';

// The backend text wins; a section it leaves out falls back to the design copy
export const mergeDescriptions = descriptions => {
  const merged = {};
  Object.keys(FALLBACK_DESCRIPTIONS).forEach(section => {
    merged[section] = { ...FALLBACK_DESCRIPTIONS[section], ...(descriptions?.[section] ?? {}) };
  });
  Object.keys(FALLBACK_DESCRIPTIONS.modes).forEach(mode => {
    merged.modes[mode] = { ...FALLBACK_DESCRIPTIONS.modes[mode], ...(descriptions?.modes?.[mode] ?? {}) };
  });
  return merged;
};

export const fillPlaceholders = (text, values) =>
  Object.entries(values).reduce((result, [key, value]) => result.split(`<${key}>`).join(value), text ?? '');

export const modeLabel = (descriptions, mode) => descriptions.modes[mode]?.label ?? mode;

// The first sentence is the short description under a mode; the whole text is its tooltip
export const firstSentence = text => {
  const match = /^.*?[.!?](?=\s|$)/.exec(text ?? '');
  return match ? match[0] : (text ?? '');
};

export const isEnvironmentLocked = data => Boolean(data?.locks?.environment);

export const isMigrationRequired = data => data?.table_present === false || data?.read === 'missing_table';

// What the form edits: the stored row, or the defaults while there is none. A locked environment shows the deployment's.
export const draftFromSettings = data => {
  const stored = data?.stored ?? null;
  return {
    mode: stored?.mode ?? 'off',
    policy_revision: stored?.policy_revision ?? '',
    admit_legacy_pat: Boolean(stored?.admit_legacy_pat),
    allow_runtime_domain_binding: Boolean(stored?.allow_runtime_domain_binding),
    environment: isEnvironmentLocked(data)
      ? (data?.effective?.environment ?? '')
      : (stored?.environment ?? ''),
    change_note: '',
  };
};

// The change note is not a setting: typing one alone is not a change
export const isDraftDirty = (draft, base) => {
  if (!draft || !base) return false;
  return (
    draft.mode !== base.mode ||
    draft.policy_revision.trim() !== base.policy_revision.trim() ||
    draft.admit_legacy_pat !== base.admit_legacy_pat ||
    draft.allow_runtime_domain_binding !== base.allow_runtime_domain_binding ||
    draft.environment.trim() !== base.environment.trim()
  );
};

export const buildUpdateBody = (draft, data) => {
  const policyRevision = draft.policy_revision.trim();
  return {
    mode: draft.mode,
    // Omitted when blank: the backend stores none, and only audit-only and enforce require one
    ...(policyRevision && { policy_revision: policyRevision }),
    admit_legacy_pat: draft.admit_legacy_pat,
    allow_runtime_domain_binding: draft.allow_runtime_domain_binding,
    // Omitted while the deployment fixes it: the backend refuses a different value
    ...(!isEnvironmentLocked(data) && { environment: draft.environment.trim() }),
    change_note: draft.change_note.trim(),
    expected_revision: data?.stored?.revision ?? 0,
  };
};

export const blockingFailedChecks = preflight =>
  (preflight?.checks ?? []).filter(check => check.status === 'fail' && check.blocking);

export const checkSeverity = check => {
  if (check.status === 'ok') return 'success';
  return check.status === 'fail' && check.blocking ? 'error' : 'warning';
};

// Why Save is disabled, or null when it is not. `unchanged` and the two notices need no extra line.
export const getSaveBlock = params => {
  const { draft, isDirty, data, descriptions, migrationRequired } = params;
  if (migrationRequired) return { code: 'migration', message: null };
  if (data?.read === 'error') return { code: 'read_error', message: null };

  const ceiling = data?.ceiling?.max_mode ?? 'enforce';
  if (MODE_RANK[draft.mode] > MODE_RANK[ceiling]) {
    return {
      code: 'mode_above_ceiling',
      message: `The deployment allows governance up to '${modeLabel(descriptions, ceiling)}'. Choose a lower mode.`,
    };
  }

  if (draft.mode !== 'off') {
    const failed = blockingFailedChecks(data?.preflight);
    if (failed.length > 0 || data?.preflight?.ok === false) {
      const names = failed.map(check => checkLabel(check.id)).join(', ');
      return {
        code: 'preflight',
        message: `Governance cannot be turned on while the preflight fails${names ? ` (${names})` : ''}. Fix the failed checks or choose Off.`,
      };
    }
    if (!draft.policy_revision.trim()) {
      return {
        code: 'policy_revision_required',
        message: 'A policy revision is required for audit-only and enforce.',
      };
    }
  }

  if (!isDirty) return { code: 'unchanged', message: null };
  if (!draft.change_note.trim()) return { code: 'note_required', message: 'Add a change note to save.' };
  return null;
};

// The would-deny rows of the audit summary: how many runs, and the most frequent reasons
export const summarizeWouldDeny = (summary, limit = 5) => {
  const rows = Array.isArray(summary) ? summary.filter(row => row.would_deny) : [];
  const byReason = new Map();
  rows.forEach(row => {
    const reason = row.reason_code ?? 'UNKNOWN';
    byReason.set(reason, (byReason.get(reason) ?? 0) + (row.count ?? 0));
  });
  const reasons = [...byReason.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return { total: rows.reduce((sum, row) => sum + (row.count ?? 0), 0), reasons };
};
