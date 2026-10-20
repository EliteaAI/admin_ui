import { CHECK_LABELS } from '@/pages/GovernancePage/components/OverviewTab/constants/governance.constants';

// The backend answers with { error, code } (plus extras such as failed_checks); a network failure has only `error`
export const toGovernanceError = (err, fallback = 'Request failed.') => ({
  message: err?.data?.error ?? err?.data?.message ?? err?.error ?? fallback,
  code: err?.data?.code ?? null,
  failedChecks: Array.isArray(err?.data?.failed_checks) ? err.data.failed_checks : [],
});

export const checkLabel = id => CHECK_LABELS[id] ?? String(id).replace(/_/g, ' ');

export const formatDateTime = value => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};
