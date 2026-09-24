import { memo, useMemo } from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

import { useAuditTrailListQuery } from '@/api/auditTrail.api';
import { formatDuration, formatTimestamp } from '@/components/AuditEventViews/helpers/auditEvents.helpers';

import AuditEventTypeIcon from './AuditEventTypeIcon';

// Span columns for expanded view (no expand icon column)
const SPAN_COLUMNS = [
  { field: 'timestamp', label: 'Time', width: '9rem', sortable: false },
  { field: 'event_type', label: 'Type', width: '3rem', sortable: false },
  {
    field: 'action',
    label: 'Action',
    width: 'minmax(0, 1fr)',
    sortable: false,
  },
  {
    field: 'user_email',
    label: 'User',
    width: '10rem',
    sortable: false,
    hideBelow: 800,
  },
  {
    field: 'status_code',
    label: 'Status',
    width: '3rem',
    sortable: false,
    hideBelow: 900,
  },
  {
    field: 'duration_ms',
    label: 'Duration',
    width: '5.5rem',
    sortable: false,
    hideBelow: 900,
  },
  {
    field: 'project_id',
    label: 'Project',
    width: '4.5rem',
    sortable: false,
    hideBelow: 1000,
  },
];

/**
 * Lazy-loaded expanded spans for a single trace.
 * Uses the existing auditTrailList endpoint filtered by trace_id.
 */
const AuditTraceSpans = memo(props => {
  const { traceId } = props;

  const { data, isFetching } = useAuditTrailListQuery(
    { trace_id: traceId, limit: 200, sort_by: 'timestamp', sort_order: 'asc' },
    { skip: !traceId },
  );

  const spanColumns = useMemo(() => {
    const w = window.innerWidth;
    return SPAN_COLUMNS.filter(c => !c.hideBelow || w >= c.hideBelow);
  }, []);

  const gridTemplateColumns = useMemo(
    () => `2.5rem ${spanColumns.map(c => c.width).join(' ')}`,
    [spanColumns],
  );

  const styles = auditTraceSpansStyles(gridTemplateColumns);

  if (isFetching) {
    return (
      <Box sx={styles.spanLoadingRow}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height="2rem"
          sx={styles.skeleton}
        />
      </Box>
    );
  }

  const spans = data?.rows ?? [];
  if (spans.length === 0) {
    return (
      <Box sx={styles.spanEmptyRow}>
        <Typography
          variant="bodySmall"
          color="text.metrics"
        >
          No spans found for this trace
        </Typography>
      </Box>
    );
  }

  return spans.map(span => (
    <Box
      key={span.id}
      sx={styles.spanRow}
    >
      {/* Empty cell to align with expand icon column */}
      <Box />
      {spanColumns.map(column => {
        const value = span[column.field];

        if (column.field === 'timestamp') {
          return (
            <Box
              key={column.field}
              sx={styles.spanCell}
            >
              <Typography
                variant="bodySmall"
                color="text.metrics"
                sx={styles.cellText}
              >
                {formatTimestamp(value)}
              </Typography>
            </Box>
          );
        }

        if (column.field === 'event_type') {
          return (
            <Box
              key={column.field}
              sx={styles.spanCell}
            >
              <AuditEventTypeIcon
                eventType={value}
                size="0.9375rem"
              />
            </Box>
          );
        }

        if (column.field === 'action') {
          let display = value || '-';
          if (span.tool_name || span.model_name) {
            display = `${value} [${span.tool_name || span.model_name}]`;
          }
          return (
            <Box
              key={column.field}
              sx={styles.spanCell}
            >
              <Typography
                variant="bodySmall"
                sx={[styles.cellText, styles.spanText(span.is_error)]}
              >
                {display}
              </Typography>
            </Box>
          );
        }

        if (column.field === 'status_code') {
          if (value == null)
            return (
              <Box
                key={column.field}
                sx={styles.spanCell}
              >
                -
              </Box>
            );
          return (
            <Box
              key={column.field}
              sx={styles.spanCell}
            >
              <Typography
                variant="bodySmall"
                sx={[styles.cellText, styles.spanText(value >= 400)]}
              >
                {value}
              </Typography>
            </Box>
          );
        }

        if (column.field === 'duration_ms') {
          return (
            <Box
              key={column.field}
              sx={styles.spanCell}
            >
              <Typography
                variant="bodySmall"
                color="text.metrics"
                sx={styles.cellText}
              >
                {formatDuration(value)}
              </Typography>
            </Box>
          );
        }

        return (
          <Box
            key={column.field}
            sx={styles.spanCell}
          >
            <Typography
              variant="bodySmall"
              color="text.metrics"
              sx={styles.cellText}
            >
              {value != null ? String(value) : '-'}
            </Typography>
          </Box>
        );
      })}
    </Box>
  ));
});

AuditTraceSpans.displayName = 'AuditTraceSpans';

/** @type {MuiSx} */
const auditTraceSpansStyles = gridTemplateColumns => ({
  spanRow: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns,
    alignItems: 'center',
    width: '100%',
    minHeight: '2rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  spanLoadingRow: ({ palette }) => ({
    padding: '0.5rem 1rem 0.5rem 3.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  spanEmptyRow: ({ palette }) => ({
    padding: '0.75rem 1rem 0.75rem 3.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  skeleton: {
    borderRadius: '0.25rem',
  },
  spanCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  spanText:
    isError =>
    ({ palette }) => ({
      color: isError ? palette.error.main : palette.text.metrics,
    }),
});

export default AuditTraceSpans;
