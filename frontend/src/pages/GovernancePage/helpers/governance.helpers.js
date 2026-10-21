import {
  CHECK_LABELS,
  OWNERSHIP_CLASS_LABELS,
  PAGE_SIZE_OPTIONS,
  REFERENCE_PATTERN,
  STATE_LABELS,
} from '@/pages/GovernancePage/constants/governance.constants';

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

export const stateLabel = state => STATE_LABELS[state] ?? state;

export const isValidReference = value => REFERENCE_PATTERN.test(value);

export const personName = user => user?.email ?? (user?.id != null ? `User ${user.id}` : null);

// The props GridTablePagination wants, from the page state of a server-side list
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

export const classLabel = value => OWNERSHIP_CLASS_LABELS[value] ?? value;

export const isPersonal = row => row.ownership_class === 'personal';

export const referenceTitle = row => row.configuration?.title ?? row.provider ?? 'Credential';
