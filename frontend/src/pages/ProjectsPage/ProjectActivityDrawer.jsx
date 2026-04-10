import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import {
  useAuditTrailListQuery,
  useAuditHeatmapQuery,
  useAuditTraceListQuery,
  useAuditTraceHeatmapQuery,
} from '@/api/auditTrailApi';
import { useDebounceValue } from '@/hooks/useDebounceValue';

import AuditHeatmap from '@/pages/AuditTrailPage/AuditHeatmap';
import AuditTrailTable from '@/pages/AuditTrailPage/AuditTrailTable';
import AuditTraceTable from '@/pages/AuditTrailPage/AuditTraceTable';
import UserActivityHeatmap from './UserActivityHeatmap';

const DATE_PRESETS = [
  { label: '30m', getRange: () => {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 60 * 1000);
    return { from, to };
  }},
  { label: '1h', getRange: () => {
    const to = new Date();
    const from = new Date(to.getTime() - 60 * 60 * 1000);
    return { from, to };
  }},
  { label: 'Today', getRange: () => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }},
  { label: 'Yesterday', getRange: () => {
    const from = new Date();
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() - 1);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }},
  { label: '7d', getRange: () => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }},
  { label: '30d', getRange: () => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }},
];

function getDefaultDateRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function ProjectActivityDrawer({ open, onClose, project }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('start_time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('traces');
  const [traceFilter, setTraceFilter] = useState(null);
  const [cellFilter, setCellFilter] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Date range state (draft values + applied values)
  const [dateFrom, setDateFrom] = useState(() => getDefaultDateRange().from);
  const [dateTo, setDateTo] = useState(() => getDefaultDateRange().to);
  const [appliedDateFrom, setAppliedDateFrom] = useState(() => getDefaultDateRange().from);
  const [appliedDateTo, setAppliedDateTo] = useState(() => getDefaultDateRange().to);
  const [activePreset, setActivePreset] = useState('Today');

  const appliedDateFromISO = appliedDateFrom?.toISOString();
  const appliedDateToISO = appliedDateTo?.toISOString();

  const projectId = project?.id;

  // --- Apply filters ---
  const handleApply = useCallback(() => {
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setPage(0);
    setCellFilter(null);
  }, [dateFrom, dateTo]);

  // --- Preset click ---
  const handlePresetClick = useCallback((presetLabel) => {
    const preset = DATE_PRESETS.find((p) => p.label === presetLabel);
    if (!preset) return;
    const { from, to } = preset.getRange();
    setDateFrom(from);
    setDateTo(to);
    setAppliedDateFrom(from);
    setAppliedDateTo(to);
    setActivePreset(presetLabel);
    setPage(0);
    setCellFilter(null);
  }, []);

  // --- Query params for spans ---
  const spanQueryParams = useMemo(() => ({
    limit: pageSize,
    offset: page * pageSize,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    project_id: projectId,
    date_from: cellFilter ? cellFilter.dateFrom.toISOString() : appliedDateFromISO,
    date_to: cellFilter ? cellFilter.dateTo.toISOString() : appliedDateToISO,
    trace_id: traceFilter || undefined,
    duration_min: cellFilter ? cellFilter.durationMin : undefined,
    duration_max: cellFilter ? cellFilter.durationMax : undefined,
    _refresh: refreshKey,
  }), [
    pageSize, page, debouncedSearch, sortBy, sortOrder,
    projectId, appliedDateFromISO, appliedDateToISO, traceFilter, cellFilter, refreshKey,
  ]);

  // --- Query params for traces ---
  const traceQueryParams = useMemo(() => ({
    limit: pageSize,
    offset: page * pageSize,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    project_id: projectId,
    date_from: cellFilter ? cellFilter.dateFrom.toISOString() : appliedDateFromISO,
    date_to: cellFilter ? cellFilter.dateTo.toISOString() : appliedDateToISO,
    trace_id: traceFilter || undefined,
    duration_min: cellFilter ? cellFilter.durationMin : undefined,
    duration_max: cellFilter ? cellFilter.durationMax : undefined,
    _refresh: refreshKey,
  }), [
    pageSize, page, debouncedSearch, sortBy, sortOrder,
    projectId, appliedDateFromISO, appliedDateToISO, traceFilter, cellFilter, refreshKey,
  ]);

  // --- Heatmap params ---
  const heatmapParams = useMemo(() => ({
    date_from: appliedDateFromISO,
    date_to: appliedDateToISO,
    search: debouncedSearch || undefined,
    project_id: projectId,
    trace_id: traceFilter || undefined,
    _refresh: refreshKey,
  }), [appliedDateFromISO, appliedDateToISO, debouncedSearch, projectId, traceFilter, refreshKey]);

  // --- Data fetching ---
  const {
    data: spanData,
    isFetching: spanFetching,
    isError: spanError,
  } = useAuditTrailListQuery(
    spanQueryParams,
    { refetchOnMountOrArgChange: true, skip: !open || !projectId || viewMode !== 'spans' },
  );

  const {
    data: traceData,
    isFetching: traceFetching,
    isError: traceError,
  } = useAuditTraceListQuery(
    traceQueryParams,
    { refetchOnMountOrArgChange: true, skip: !open || !projectId || viewMode !== 'traces' },
  );

  const {
    data: spanHeatmapData,
    isFetching: spanHeatmapFetching,
  } = useAuditHeatmapQuery(
    heatmapParams,
    { refetchOnMountOrArgChange: true, skip: !open || !projectId || viewMode !== 'spans' },
  );

  const {
    data: traceHeatmapData,
    isFetching: traceHeatmapFetching,
  } = useAuditTraceHeatmapQuery(
    heatmapParams,
    { refetchOnMountOrArgChange: true, skip: !open || !projectId || viewMode !== 'traces' },
  );

  const activeData = viewMode === 'traces' ? traceData : spanData;
  const activeFetching = viewMode === 'traces' ? traceFetching : spanFetching;
  const activeError = viewMode === 'traces' ? traceError : spanError;
  const activeHeatmapData = viewMode === 'traces' ? traceHeatmapData : spanHeatmapData;
  const activeHeatmapFetching = viewMode === 'traces' ? traceHeatmapFetching : spanHeatmapFetching;

  const rows = activeData?.rows ?? [];
  const total = activeData?.total ?? 0;

  // --- Handlers ---
  const handleViewModeChange = useCallback((_, newValue) => {
    if (newValue == null) return;
    setViewMode(newValue);
    setPage(0);
    setCellFilter(null);
    setSortBy(newValue === 'traces' ? 'start_time' : 'timestamp');
    setSortOrder('desc');
  }, []);

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('desc');
      return field;
    });
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage) => setPage(newPage), []);
  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleTraceClick = useCallback((traceId) => {
    setTraceFilter(traceId);
    setPage(0);
  }, []);

  const handleClearTrace = useCallback(() => {
    setTraceFilter(null);
    setPage(0);
  }, []);

  const handleCellClick = useCallback((cellInfo) => {
    setCellFilter(cellInfo);
    setPage(0);
  }, []);

  const handleClearCell = useCallback(() => {
    setCellFilter(null);
    setPage(0);
  }, []);

  const handleDateFromChange = useCallback((value) => {
    setDateFrom(value);
    setActivePreset(null);
  }, []);

  const handleDateToChange = useCallback((value) => {
    setDateTo(value);
    setActivePreset(null);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSearch('');
    setPage(0);
    setViewMode('traces');
    setTraceFilter(null);
    setCellFilter(null);
    const { from, to } = getDefaultDateRange();
    setDateFrom(from);
    setDateTo(to);
    setAppliedDateFrom(from);
    setAppliedDateTo(to);
    setActivePreset('Today');
    onClose();
  }, [onClose]);

  return (
    <Drawer anchor="right" open={open} onClose={handleDrawerClose} sx={styles.drawer}>
      <Box sx={styles.root}>
        {/* Header */}
        <Box sx={styles.header}>
          <Box sx={styles.headerLeft}>
            <Typography variant="h6" sx={styles.title}>
              Project Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project?.name} (ID: {project?.id})
            </Typography>
          </Box>
          <Box sx={styles.headerRight}>
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleDrawerClose}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Search bar */}
        <Box sx={styles.searchBar}>
          <Box
            component="input"
            type="text"
            placeholder="Search actions, tools, users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={styles.searchInput}
          />
          {(traceFilter || cellFilter) && (
            <Box sx={styles.chips}>
              {traceFilter && (
                <Chip
                  label={`trace: ${traceFilter.substring(0, 12)}...`}
                  size="small"
                  onDelete={handleClearTrace}
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              {cellFilter && (
                <Chip
                  label={`${cellFilter.timeLabel} · ${cellFilter.bandLabel}`}
                  size="small"
                  color="primary"
                  onDelete={handleClearCell}
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Date filters */}
        <Box sx={styles.filtersBar}>
          <Box sx={styles.presetsRow}>
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
          </Box>
          <DateTimePicker
            label="From"
            value={dateFrom}
            onChange={handleDateFromChange}
            slotProps={{
              textField: { size: 'small', sx: styles.dateField },
              actionBar: { actions: ['clear', 'accept'] },
            }}
            maxDateTime={dateTo || undefined}
            ampm={false}
          />
          <DateTimePicker
            label="To"
            value={dateTo}
            onChange={handleDateToChange}
            slotProps={{
              textField: { size: 'small', sx: styles.dateField },
              actionBar: { actions: ['clear', 'accept'] },
            }}
            minDateTime={dateFrom || undefined}
            ampm={false}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<SearchOutlined />}
            onClick={handleApply}
            sx={styles.applyButton}
          >
            Apply
          </Button>
        </Box>

        {/* User Activity Heatmap (collapsible accordion) */}
        {projectId && (
          <UserActivityHeatmap
            projectId={projectId}
            dateFrom={appliedDateFromISO}
            dateTo={appliedDateToISO}
          />
        )}

        {/* Event Duration Heatmap */}
        <AuditHeatmap
          data={activeHeatmapData?.data}
          metadata={activeHeatmapData?.metadata}
          isFetching={activeHeatmapFetching}
          onCellClick={handleCellClick}
          viewMode={viewMode}
        />

        {/* View mode tabs */}
        <Box sx={styles.tabsContainer}>
          <Tabs value={viewMode} onChange={handleViewModeChange} sx={styles.tabs}>
            <Tab label="Traces" value="traces" sx={styles.tab} />
            <Tab label="Spans" value="spans" sx={styles.tab} />
          </Tabs>
        </Box>

        {/* Table */}
        <Box sx={styles.tableContainer}>
          {activeError ? (
            <Box sx={styles.errorContainer}>
              Failed to load audit {viewMode === 'traces' ? 'traces' : 'events'}.
            </Box>
          ) : viewMode === 'traces' ? (
            <AuditTraceTable
              rows={rows}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              sortConfig={{ field: sortBy, direction: sortOrder }}
              onSort={handleSort}
              isFetching={activeFetching}
              onTraceClick={handleTraceClick}
            />
          ) : (
            <AuditTrailTable
              rows={rows}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              sortConfig={{ field: sortBy, direction: sortOrder }}
              onSort={handleSort}
              isFetching={activeFetching}
              onTraceClick={handleTraceClick}
            />
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

const styles = {
  drawer: {
    '& .MuiDrawer-paper': {
      width: '75vw',
      maxWidth: '75vw',
    },
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  headerRight: {
    display: 'flex',
    gap: '0.25rem',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  filtersBar: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    flexWrap: 'wrap',
  }),
  presetsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  presetChip: {
    fontSize: '0.6875rem',
    height: '1.5rem',
  },
  dateField: {
    width: '13rem',
    '& input': { fontSize: '0.8125rem' },
    '& label': { fontSize: '0.8125rem' },
  },
  applyButton: {
    fontSize: '0.75rem',
    textTransform: 'none',
    minWidth: 'auto',
    padding: '0.25rem 0.75rem',
  },
  searchBar: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  searchInput: ({ palette }) => ({
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    padding: '0.375rem 0',
    '&::placeholder': {
      color: palette.text.default,
      opacity: 1,
    },
  }),
  chips: {
    display: 'flex',
    gap: '0.375rem',
    flexShrink: 0,
  },
  tabsContainer: ({ palette }) => ({
    padding: '0 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  tabs: ({ palette }) => ({
    minHeight: '2.5rem',
    '& .MuiTabs-indicator': {
      backgroundColor: palette.text.secondary,
    },
  }),
  tab: ({ palette }) => ({
    textTransform: 'none',
    minHeight: '2.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: palette.text.metrics,
    '&.Mui-selected': {
      color: palette.text.secondary,
    },
  }),
  tableContainer: {
    flex: 1,
    minHeight: '20rem',
    display: 'flex',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    padding: '3rem',
    color: 'error.main',
  },
};

ProjectActivityDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

export default ProjectActivityDrawer;
