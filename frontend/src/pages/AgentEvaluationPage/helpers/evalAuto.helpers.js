import cronstrue from 'cronstrue';

export const STATUS_CONFIG = {
  passed: { label: 'Passed', color: 'success' },
  warning: { label: 'Warning', color: 'warning' },
  failed: { label: 'Failed', color: 'error' },
  not_evaluated: { label: 'Not Evaluated', color: 'default' },
};

export const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

// Mirrors elitea_core's reason codes; an unknown code is shown as is.
const REASON_LABELS = {
  HITL_REQUIRED: 'Needs human approval',
  OAUTH_REQUIRED: 'Needs an OAuth sign-in',
  AGENT_BROKEN: 'Agent is broken',
  TIMEOUT: 'Timed out',
  OWNER_UNAVAILABLE: 'Owner cannot run it',
  BUDGET_BLOCKED: 'Budget exhausted',
  NO_DATASET: 'No dataset',
  NO_TRAFFIC: 'Not enough chat history',
  OTHER: 'Other',
};

const TIER_LABELS = {
  agent_default: 'Agent default dataset',
  agent_suite: 'Agent suite',
  agent_only_suite: 'Agent suite',
  project: 'Project default dataset',
  platform: 'Platform health check',
};

export const SCOPE_OPTIONS = [
  { value: 'all', label: 'All projects' },
  { value: 'allow', label: 'Only the listed projects' },
  { value: 'deny', label: 'All but the listed projects' },
];

export const POLICY_OPTIONS = [
  { value: 'agent_first', label: "Agent's own data first, then project, then platform" },
  { value: 'agent_only', label: "Agent's own data only" },
  { value: 'platform_only', label: 'Platform health check only' },
];

export const MODE_OPTIONS = [
  { value: 'live', label: 'Live: run the agent on its dataset' },
  { value: 'history', label: 'History: score stored chat turns, never run the agent' },
  { value: 'hybrid', label: 'Hybrid: history first, live when there is too little' },
];

export const HISTORY_VERSION_OPTIONS = [
  { value: 'default', label: 'Default version only' },
  { value: 'any', label: 'Any version' },
];

export const HISTORY_STRATEGY_OPTIONS = [
  { value: 'stratified', label: 'Spread across conversations and users' },
  { value: 'recent', label: 'Most recent first' },
];

// [key, label, min, max, step] — the bounds match the backend's clamping.
export const NUMBER_FIELDS = [
  ['max_agents_per_job', 'Max agents per job', 1, 10000, 1],
  ['max_cases_per_agent', 'Max cases per agent', 1, 1000, 1],
  ['max_concurrent_runs', 'Concurrent runs', 1, 50, 1],
  ['case_concurrency', 'Case concurrency', 1, 8, 1],
  ['reevaluate_after_days', 'Re-evaluate unchanged agents after (days)', 0, 365, 1],
  ['fail_threshold', 'Fail below score', 0, 100, 1],
  ['coverage_threshold', 'Warn below coverage (%)', 0, 100, 1],
  ['classify_threshold', 'Not Evaluated when errored cases exceed (share)', 0, 1, 0.05],
];

// Shown only when the mode reads history; the bounds match eval_auto_rules._BOUNDS. The optional sixth
// entry replaces the min–max hint when the server clamps further.
export const HISTORY_NUMBER_FIELDS = [
  ['history_window_days', 'Look back (days)', 1, 90, 1],
  ['history_max_turns', 'Max turns per agent', 1, 50, 1],
  ['history_min_turns', 'Min turns to score', 1, 50, 1, '1 – max turns per agent'],
  ['history_max_turns_per_conversation', 'Max turns per conversation', 1, 10, 1],
  ['history_max_share_per_user', 'Max share of turns from one user', 0.1, 1, 0.01],
  ['max_concurrent_history_runs', 'Concurrent history runs', 1, 20, 1],
  ['history_reevaluate_after_days', 'Re-evaluate from history after (days)', 1, 90, 1],
];

export const readsHistory = mode => mode === 'history' || mode === 'hybrid';

export const describeCron = expr => {
  if (!expr) return '';
  try {
    return cronstrue.toString(expr, { use24HourTimeFormat: true });
  } catch {
    return '';
  }
};

export const parseProjectIds = text =>
  [
    ...new Set(
      String(text ?? '')
        .split(/[\s,]+/)
        .filter(part => /^\d+$/.test(part))
        .map(Number),
    ),
  ]
    .filter(id => id > 0)
    .sort((a, b) => a - b);

export const formatScore = value =>
  value === null || value === undefined ? '-' : `${Math.round(value * 10) / 10}`;

export const formatDate = iso => (iso ? new Date(iso).toLocaleString() : '-');

/** The settings form's dirty keys only, so a save never overwrites a field nobody touched. */
export const changedSettings = (saved, draft) =>
  Object.fromEntries(
    Object.entries(draft).filter(([key, value]) => JSON.stringify(saved?.[key]) !== JSON.stringify(value)),
  );

export const toWindow = (start, end) => (start && end ? { start, end } : null);

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const buildPaginationProps = ({ total, page, pageSize, onPageChange, onPageSizeChange }) => ({
  totalRows: total,
  pageSize,
  isFirstPage: page === 0,
  isLastPage: (page + 1) * pageSize >= total,
  startRow: total > 0 ? page * pageSize + 1 : 0,
  endRow: Math.min((page + 1) * pageSize, total),
  handlePrevPage: () => onPageChange(Math.max(0, page - 1)),
  handleNextPage: () => onPageChange(page + 1),
  handlePageSizeChange: onPageSizeChange,
  pageSizeOptions: PAGE_SIZE_OPTIONS,
});

export const reasonLabel = code => (code ? (REASON_LABELS[code] ?? code) : '-');

export const tierLabel = tier => (tier ? (TIER_LABELS[tier] ?? tier) : '-');

export const REASON_OPTIONS = Object.keys(REASON_LABELS);

// An item that is still queued or running has no verdict yet, so its state stands in for the status.
const STATE_LABELS = {
  pending: 'Queued',
  running: 'Running',
};

export const stateLabel = state => STATE_LABELS[state] ?? null;

const TRIGGER_LABELS = {
  scheduled: 'Schedule',
  manual: 'Run now',
};

const MODE_LABELS = {
  live: 'Live',
  history: 'History',
};

export const modeLabel = mode => (mode ? (MODE_LABELS[mode] ?? mode) : '-');

/**
 * "12 turns · 5 chats · 28 days" for an item scored from history, else null. A hybrid item that fell back
 * to live, or one Not Evaluated for too little traffic, can still carry the history it looked at.
 */
export const historySummary = item => {
  const history = item?.history;
  if (item?.mode !== 'history' || item.status === 'not_evaluated' || !history) return null;
  const turns = history.sampled || history.eligible || 0;
  const parts = [`${turns} turn${turns === 1 ? '' : 's'}`];
  if (history.conversations)
    parts.push(`${history.conversations} chat${history.conversations === 1 ? '' : 's'}`);
  if (history.window_days) parts.push(`${history.window_days} days`);
  return parts.join(' · ');
};

export const triggerLabel = trigger => (trigger ? (TRIGGER_LABELS[trigger] ?? trigger) : '-');

export const runUrl = (baseUrl, row) =>
  row?.eval_run_id
    ? `${baseUrl}/${row.project_id}/agents/all/${row.application_id}/evaluate/history?run=${row.eval_run_id}`
    : null;

export const formatCoverage = value =>
  value === null || value === undefined ? '-' : `${Math.round(value)}%`;

// Matches eval_auto_rules.MAX_PROBES / MAX_PROBE_LENGTH; the server enforces both.
export const MAX_PROBES = 10;
export const MAX_PROBE_LENGTH = 2000;

/** The probes to save: trimmed, blanks and repeats dropped, in order. */
export const cleanProbes = probes => [...new Set(probes.map(text => text.trim()).filter(Boolean))];

export const probesChanged = (saved, probes) => {
  const cleaned = cleanProbes(probes);
  return cleaned.length !== saved.length || cleaned.some((text, index) => text !== saved[index]);
};

export const resyncMessage = ({ updated_datasets: updated = 0, failures = [] }) => {
  const base = updated
    ? `Updated ${updated} agent cop${updated === 1 ? 'y' : 'ies'}.`
    : 'Every agent copy is up to date.';
  return failures.length ? `${base} ${failures.length} project(s) failed; see the server log.` : base;
};
