import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';

import { useAuditTrailListQuery } from '@/api/auditTrailApi';

const PAGE_SIZE = 50;

const DATE_PRESETS = [
  { label: 'Today', getRange: () => {
    const from = new Date(); from.setHours(0, 0, 0, 0);
    const to = new Date(); to.setHours(23, 59, 59, 999);
    return { from, to };
  }},
  { label: '7d', getRange: () => {
    const to = new Date(); to.setHours(23, 59, 59, 999);
    const from = new Date(); from.setDate(from.getDate() - 7); from.setHours(0, 0, 0, 0);
    return { from, to };
  }},
  { label: '30d', getRange: () => {
    const to = new Date(); to.setHours(23, 59, 59, 999);
    const from = new Date(); from.setDate(from.getDate() - 30); from.setHours(0, 0, 0, 0);
    return { from, to };
  }},
];

function getDefaultRange() {
  return DATE_PRESETS[1].getRange(); // 7d default
}

const ScheduleHistoryDrawer = memo(function ScheduleHistoryDrawer({
  open,
  onClose,
  schedule,
}) {
  const [activePreset, setActivePreset] = useState('7d');
  const [dateRange, setDateRange] = useState(getDefaultRange);
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const searchTerm = schedule ? `Schedule: ${schedule.name}` : '';

  const queryParams = useMemo(() => ({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: searchTerm || undefined,
    event_type: 'schedule',
    sort_by: 'timestamp',
    sort_order: 'desc',
    date_from: dateRange.from.toISOString(),
    date_to: dateRange.to.toISOString(),
    _refresh: refreshKey,
  }), [searchTerm, page, dateRange, refreshKey]);

  const { data, isFetching } = useAuditTrailListQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    skip: !open || !schedule,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const handlePresetClick = useCallback((label) => {
    const preset = DATE_PRESETS.find((p) => p.label === label);
    if (!preset) return;
    setDateRange(preset.getRange());
    setActivePreset(label);
    setPage(0);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleClose = useCallback(() => {
    setPage(0);
    setActivePreset('7d');
    setDateRange(getDefaultRange());
    onClose();
  }, [onClose]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} sx={styles.drawer}>
      <Box sx={styles.root}>
        {/* Header */}
        <Box sx={styles.header}>
          <Box sx={styles.headerLeft}>
            <Typography variant="h6" sx={styles.title}>
              Execution History
            </Typography>
            {schedule && (
              <Typography variant="bodySmall" color="text.metrics">
                {schedule.name}
              </Typography>
            )}
          </Box>
          <Box sx={styles.headerRight}>
            <IconButton size="small" onClick={handleRefresh} sx={{ color: 'text.secondary' }}>
              <RefreshOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleClose}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Schedule info */}
        {schedule && (
          <Box sx={styles.infoBar}>
            <Chip label={schedule.cron} size="small" variant="outlined" sx={styles.infoChip} />
            <Chip
              label={schedule.rpc_func}
              size="small"
              variant="outlined"
              sx={styles.infoChip}
            />
            <Chip
              label={schedule.active ? 'Active' : 'Inactive'}
              size="small"
              color={schedule.active ? 'success' : 'default'}
              sx={styles.infoChip}
            />
          </Box>
        )}

        {/* Date presets */}
        <Box sx={styles.presetsBar}>
          {DATE_PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              label={preset.label}
              size="small"
              variant={activePreset === preset.label ? 'filled' : 'outlined'}
              color={activePreset === preset.label ? 'primary' : 'default'}
              onClick={() => handlePresetClick(preset.label)}
              sx={styles.presetChip}
            />
          ))}
          <Typography variant="bodySmall" color="text.metrics" sx={{ ml: 'auto' }}>
            {total} execution{total !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Execution list */}
        <Box sx={styles.listContainer}>
          {rows.length === 0 && !isFetching && (
            <Box sx={styles.emptyState}>
              <Typography variant="bodyMedium" color="text.metrics">
                No executions found in this period.
              </Typography>
            </Box>
          )}

          {rows.map((row, idx) => (
            <Box key={row.span_id || idx} sx={styles.executionRow}>
              <Box sx={styles.executionIcon}>
                {row.is_error ? (
                  <ErrorOutline sx={{ fontSize: '1rem', color: 'error.main' }} />
                ) : (
                  <CheckCircleOutline sx={{ fontSize: '1rem', color: 'success.main' }} />
                )}
              </Box>
              <Box sx={styles.executionContent}>
                <Typography variant="bodySmall" color="text.secondary">
                  {row.timestamp ? new Date(row.timestamp).toLocaleString() : '\u2014'}
                </Typography>
                <Typography variant="bodySmall" color="text.metrics">
                  {row.duration_ms != null
                    ? row.duration_ms < 1
                      ? '<1ms'
                      : row.duration_ms < 1000
                        ? `${Math.round(row.duration_ms)}ms`
                        : `${(row.duration_ms / 1000).toFixed(1)}s`
                    : '\u2014'}
                </Typography>
              </Box>
              {row.is_error && (
                <Chip label="Error" size="small" color="error" variant="outlined" sx={styles.errorChip} />
              )}
            </Box>
          ))}

          {isFetching && rows.length === 0 && (
            <Box sx={styles.emptyState}>
              <Typography variant="bodyMedium" color="text.metrics">
                Loading...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={styles.pagination}>
            <Typography variant="bodySmall" color="text.metrics">
              Page {page + 1} of {totalPages}
            </Typography>
            <Box sx={styles.paginationButtons}>
              <Chip
                label="Prev"
                size="small"
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                sx={styles.pageChip}
              />
              <Chip
                label="Next"
                size="small"
                variant="outlined"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                sx={styles.pageChip}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
});

const styles = {
  drawer: {
    '& .MuiDrawer-paper': {
      width: '36rem',
      maxWidth: '90vw',
    },
  },
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: palette.background.default,
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: `1px solid ${palette.border.table}`,
  }),
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  infoBar: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1.25rem',
    borderBottom: `1px solid ${palette.border.table}`,
    flexWrap: 'wrap',
  }),
  infoChip: {
    fontSize: '0.6875rem',
    height: '1.375rem',
    fontFamily: 'monospace',
  },
  presetsBar: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1.25rem',
    borderBottom: `1px solid ${palette.border.table}`,
  }),
  presetChip: {
    fontSize: '0.6875rem',
    height: '1.5rem',
  },
  listContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '0.5rem 0',
  },
  executionRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 1.25rem',
    '&:hover': {
      backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    },
  }),
  executionIcon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  executionContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 0,
  },
  errorChip: {
    fontSize: '0.625rem',
    height: '1.25rem',
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
  },
  pagination: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 1.25rem',
    borderTop: `1px solid ${palette.border.table}`,
  }),
  paginationButtons: {
    display: 'flex',
    gap: '0.375rem',
  },
  pageChip: {
    fontSize: '0.6875rem',
    height: '1.5rem',
  },
};

export default ScheduleHistoryDrawer;
