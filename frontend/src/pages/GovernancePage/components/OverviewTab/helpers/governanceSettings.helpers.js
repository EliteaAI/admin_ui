import {
  FALLBACK_DESCRIPTIONS,
  MODE_RANK,
} from '@/pages/GovernancePage/components/OverviewTab/constants/governanceSettings.constants';
import { checkLabel } from '@/pages/GovernancePage/helpers/governance.helpers';

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

// The settings table predates a column this build writes (#7213): read-only until the task adds it
export const isColumnMissing = data => data?.columns_present === false;

// What the development-runs switch shows: the stored choice, else the default of the mode the form holds
// (on under audit only, off otherwise). `null` in the draft means "not chosen" and is sent as such.
export const developmentRunsDefault = mode => mode === 'audit_only';

// What the switch shows when the form is changed to `mode` (#7227): a switch into enforce turns development runs on,
// unless the operator has explicitly switched them off; any other mode shows the stored choice again. The form sends
// what it shows, so the operator's own toggle always wins.
export const developmentRunsForMode = (mode, storedMode, storedChoice) => {
  if (storedMode === 'enforce') return undefined; // already enforcing: the form keeps what it holds
  if (mode !== 'enforce') return storedChoice ?? null;
  return storedChoice === false ? false : true;
};

export const developmentRunsShown = draft =>
  draft?.allow_development_runs ?? developmentRunsDefault(draft?.mode);

// What the form edits: the stored row, or the defaults while there is none. A locked environment shows the deployment's.
export const draftFromSettings = data => {
  const stored = data?.stored ?? null;
  return {
    mode: stored?.mode ?? 'off',
    policy_revision: stored?.policy_revision ?? '',
    admit_legacy_pat: Boolean(stored?.admit_legacy_pat),
    allow_runtime_domain_binding: Boolean(stored?.allow_runtime_domain_binding),
    allow_development_runs: stored?.allow_development_runs ?? null,
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
    draft.allow_development_runs !== base.allow_development_runs ||
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
    // Sent only once the operator chose: absent means the default of the mode (on under audit only, off under enforce)
    ...(draft.allow_development_runs !== null && { allow_development_runs: draft.allow_development_runs }),
    // Omitted while the deployment fixes it: the backend refuses a different value
    ...(!isEnvironmentLocked(data) && { environment: draft.environment.trim() }),
    change_note: draft.change_note.trim(),
    expected_revision: data?.stored?.revision ?? 0,
  };
};

const blockingFailedChecks = preflight =>
  (preflight?.checks ?? []).filter(check => check.status === 'fail' && check.blocking);

export const checkSeverity = check => {
  if (check.status === 'ok') return 'success';
  return check.status === 'fail' && check.blocking ? 'error' : 'warning';
};

// Why Save is disabled, or null when it is not. `unchanged` and the two notices need no extra line.
export const getSaveBlock = params => {
  const { draft, isDirty, data, descriptions, migrationRequired, columnMissing } = params;
  if (migrationRequired) return { code: 'migration', message: null };
  if (columnMissing) return { code: 'column_missing', message: null };
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
