import { memo, useCallback, useMemo, useState } from 'react';

import { Alert, Box, Tab, Tabs, Typography } from '@mui/material';

import { fetchLifecycleAuditExport, useLifecycleAuditListQuery } from '@/api/lifecycleAudit.api';
import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { exportToExcel } from '@/helpers/exportToExcel.helpers';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';

import LifecycleAuditFilters from './components/LifecycleAuditFilters';
import LifecycleAuditTable from './components/LifecycleAuditTable';
import {
  DATE_PRESETS,
  DEFAULT_PRESET,
  LIFECYCLE_AUDIT_TABS,
  PROJECT_EVENT_TYPES,
  USER_EVENT_TYPES,
} from './constants/lifecycleAudit.constants';
import {
  buildQueryParams,
  exportColumns,
  exportFileName,
  formatCoverageDate,
} from './helpers/lifecycleAudit.helpers';

const getDefaultFilters = () => {
  const { from, to } = DATE_PRESETS.find(preset => preset.label === DEFAULT_PRESET).getRange();
  return {
    date_from: from,
    date_to: to,
    event_type: '',
    project_id: '',
    project_name: '',
    project_type: '',
    user_id: '',
    user_name: '',
    user_email: '',
    actor: '',
    role: '',
    admin_only: false,
    result: '',
    source: '',
  };
};

const LifecycleAuditPage = memo(() => {
  usePageTitle('Audit');

  const styles = lifecycleAuditPageStyles();

  const [tab, setTab] = useState('projects');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET);
  const [draftFilters, setDraftFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportError, setExportError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const filterParams = useMemo(
    () => buildQueryParams(tab, appliedFilters, debouncedSearch),
    [tab, appliedFilters, debouncedSearch],
  );

  const { data, isFetching, isError } = useLifecycleAuditListQuery(
    {
      ...filterParams,
      limit: pageSize,
      offset: page * pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
      _refresh: refreshKey,
    },
    { refetchOnMountOrArgChange: true },
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const handleTabChange = useCallback((_, value) => {
    setTab(value);
    setPage(0);
    // Event types and some fields exist on one tab only
    const tabReset = { event_type: '', project_name: '', project_type: '', user_name: '' };
    setDraftFilters(prev => ({ ...prev, ...tabReset }));
    setAppliedFilters(prev => ({ ...prev, ...tabReset }));
  }, []);

  const handleSearchChange = useCallback(value => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setDraftFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
    setPage(0);
  }, [draftFilters]);

  const handleClear = useCallback(() => {
    const defaults = getDefaultFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setActivePreset(DEFAULT_PRESET);
    setSearch('');
    setPage(0);
  }, []);

  const handleRefresh = useCallback(() => setRefreshKey(key => key + 1), []);

  const handleSort = useCallback(field => {
    setSortBy(prev => {
      if (prev === field) {
        setSortOrder(order => (order === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('desc');
      return field;
    });
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback(size => {
    setPageSize(size);
    setPage(0);
  }, []);

  const handleExport = useCallback(async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      const { rows: exportRows } = await fetchLifecycleAuditExport({
        ...filterParams,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      await exportToExcel(exportFileName(tab), [
        { sheetName: tab === 'projects' ? 'Projects' : 'Users', columns: exportColumns(), rows: exportRows },
      ]);
    } catch (error) {
      console.error(error);
      setExportError(error.message);
    } finally {
      setIsExporting(false);
    }
  }, [filterParams, sortBy, sortOrder, tab]);

  const tabs = (
    <Tabs
      value={tab}
      onChange={handleTabChange}
      sx={styles.headerTabs}
    >
      {LIFECYCLE_AUDIT_TABS.map(item => (
        <Tab
          key={item.value}
          label={item.label}
          value={item.value}
          sx={styles.headerTab}
        />
      ))}
    </Tabs>
  );

  const coverage = data?.live_coverage_since ? (
    <Typography
      variant="bodySmall"
      sx={styles.coverage}
    >
      Coverage since {formatCoverageDate(data.live_coverage_since)}
    </Typography>
  ) : null;

  return (
    <DrawerPage>
      <DrawerPageHeader
        title="Audit"
        tabs={tabs}
        showSearchInput
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search names, IDs, emails"
      />

      <LifecycleAuditFilters
        tab={tab}
        filters={draftFilters}
        eventTypes={tab === 'projects' ? PROJECT_EVENT_TYPES : USER_EVENT_TYPES}
        activePreset={activePreset}
        isExporting={isExporting}
        onFieldChange={handleFieldChange}
        onPresetChange={setActivePreset}
        onApply={handleApply}
        onClear={handleClear}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {exportError && (
        <Alert
          severity="error"
          onClose={() => setExportError(null)}
          sx={styles.alert}
        >
          {exportError}
        </Alert>
      )}

      <Box sx={styles.tableContainer}>
        {isError ? (
          <Box sx={styles.errorContainer}>
            <Typography
              variant="bodyMedium"
              color="error"
            >
              Failed to load audit events.
            </Typography>
          </Box>
        ) : (
          <LifecycleAuditTable
            tab={tab}
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            sortConfig={{ field: sortBy, direction: sortOrder }}
            isFetching={isFetching}
            onSort={handleSort}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            footerContent={coverage}
          />
        )}
      </Box>
    </DrawerPage>
  );
});

LifecycleAuditPage.displayName = 'LifecycleAuditPage';

/** @type {MuiSx} */
const lifecycleAuditPageStyles = () => ({
  headerTabs: ({ palette }) => ({
    minHeight: '2.5rem',
    '& .MuiTabs-indicator': {
      backgroundColor: palette.background.tabIndicator,
    },
  }),
  headerTab: ({ palette }) => ({
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
  alert: {
    margin: '0.5rem 1.5rem 0',
  },
  tableContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    maxWidth: '100%',
  },
  coverage: ({ palette }) => ({
    alignSelf: 'flex-end',
    padding: '0.5rem 1.5rem',
    color: palette.text.metrics,
  }),
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '3rem',
  },
});

export default LifecycleAuditPage;
