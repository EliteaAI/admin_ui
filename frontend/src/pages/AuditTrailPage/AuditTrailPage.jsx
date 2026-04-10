import { useCallback, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

import {
  useAuditTrailListQuery,
  useAuditHeatmapQuery,
  useAuditTraceListQuery,
  useAuditTraceHeatmapQuery,
} from "@/api/auditTrailApi";
import { useDebounceValue } from "@/hooks/useDebounceValue";

import AuditHeatmap from "./AuditHeatmap";
import AuditTrailFilters from "./AuditTrailFilters";
import AuditTrailTable from "./AuditTrailTable";
import AuditTraceTable from "./AuditTraceTable";

const USER_EVENT_TYPES = ["api", "socketio", "rpc", "agent", "tool", "llm"];
const SYSTEM_EVENT_TYPES = ["schedule", "admin_task"];

const USER_EVENT_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "api", label: "API" },
  { value: "socketio", label: "Socket.IO" },
  { value: "rpc", label: "RPC" },
  { value: "agent", label: "Agent" },
  { value: "tool", label: "Tool" },
  { value: "llm", label: "LLM" },
];

const SYSTEM_EVENT_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "schedule", label: "Schedule" },
  { value: "admin_task", label: "Admin Task" },
];

function getTodayRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

const DEFAULT_PRESET = "Today";

function getDefaultFilters() {
  const { from, to } = getTodayRange();
  return {
    event_type: "",
    is_error: false,
    date_from: from,
    date_to: to,
    project_id: "",
    user_id: "",
  };
}

function AuditTrailPage() {
  usePageTitle("Audit Trail");

  const [auditTab, setAuditTab] = useState("user");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState("start_time");
  const [sortOrder, setSortOrder] = useState("desc");
  const [traceFilter, setTraceFilter] = useState(null);
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET);
  // Heatmap cell drill-down filter
  const [cellFilter, setCellFilter] = useState(null);
  // View mode: 'traces' (grouped) or 'spans' (individual)
  const [viewMode, setViewMode] = useState("traces");

  // Draft filters (changed in UI but not yet applied)
  const [draftFilters, setDraftFilters] = useState(getDefaultFilters);
  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  // Refresh counter to force re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  // Derive effective event_type based on the active audit tab
  const tabEventTypes =
    auditTab === "user" ? USER_EVENT_TYPES : SYSTEM_EVENT_TYPES;
  const effectiveEventType =
    appliedFilters.event_type || tabEventTypes.join(",");
  const eventTypeOptions =
    auditTab === "user" ? USER_EVENT_TYPE_OPTIONS : SYSTEM_EVENT_TYPE_OPTIONS;

  // Shared filter params (used by both table and heatmap)
  const dateFromISO =
    appliedFilters.date_from instanceof Date
      ? appliedFilters.date_from.toISOString()
      : undefined;
  const dateToISO =
    appliedFilters.date_to instanceof Date
      ? appliedFilters.date_to.toISOString()
      : undefined;

  // --- Query params for spans (individual view) ---
  const spanQueryParams = useMemo(
    () => ({
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      event_type: effectiveEventType,
      is_error: appliedFilters.is_error || undefined,
      date_from: cellFilter ? cellFilter.dateFrom.toISOString() : dateFromISO,
      date_to: cellFilter ? cellFilter.dateTo.toISOString() : dateToISO,
      project_id: appliedFilters.project_id || undefined,
      user_id: appliedFilters.user_id || undefined,
      trace_id: traceFilter || undefined,
      duration_min: cellFilter ? cellFilter.durationMin : undefined,
      duration_max: cellFilter ? cellFilter.durationMax : undefined,
      _refresh: refreshKey,
    }),
    [
      pageSize,
      page,
      debouncedSearch,
      sortBy,
      sortOrder,
      appliedFilters,
      dateFromISO,
      dateToISO,
      traceFilter,
      cellFilter,
      refreshKey,
      effectiveEventType,
    ],
  );

  // --- Query params for traces (grouped view) ---
  const traceQueryParams = useMemo(
    () => ({
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      event_type: effectiveEventType,
      is_error: appliedFilters.is_error || undefined,
      date_from: cellFilter ? cellFilter.dateFrom.toISOString() : dateFromISO,
      date_to: cellFilter ? cellFilter.dateTo.toISOString() : dateToISO,
      project_id: appliedFilters.project_id || undefined,
      user_id: appliedFilters.user_id || undefined,
      trace_id: traceFilter || undefined,
      duration_min: cellFilter ? cellFilter.durationMin : undefined,
      duration_max: cellFilter ? cellFilter.durationMax : undefined,
      _refresh: refreshKey,
    }),
    [
      pageSize,
      page,
      debouncedSearch,
      sortBy,
      sortOrder,
      appliedFilters,
      dateFromISO,
      dateToISO,
      traceFilter,
      cellFilter,
      refreshKey,
      effectiveEventType,
    ],
  );

  // --- Heatmap params (shared filters, no pagination) ---
  const heatmapParams = useMemo(
    () => ({
      date_from: dateFromISO,
      date_to: dateToISO,
      search: debouncedSearch || undefined,
      event_type: effectiveEventType,
      is_error: appliedFilters.is_error || undefined,
      project_id: appliedFilters.project_id || undefined,
      user_id: appliedFilters.user_id || undefined,
      trace_id: traceFilter || undefined,
      _refresh: refreshKey,
    }),
    [
      dateFromISO,
      dateToISO,
      debouncedSearch,
      appliedFilters,
      traceFilter,
      refreshKey,
      effectiveEventType,
    ],
  );

  // --- Conditional data fetching (inactive view is skipped) ---
  const {
    data: spanData,
    isFetching: spanFetching,
    isError: spanError,
  } = useAuditTrailListQuery(spanQueryParams, {
    refetchOnMountOrArgChange: true,
    skip: viewMode !== "spans",
  });

  const {
    data: traceData,
    isFetching: traceFetching,
    isError: traceError,
  } = useAuditTraceListQuery(traceQueryParams, {
    refetchOnMountOrArgChange: true,
    skip: viewMode !== "traces",
  });

  const { data: spanHeatmapData, isFetching: spanHeatmapFetching } =
    useAuditHeatmapQuery(heatmapParams, {
      refetchOnMountOrArgChange: true,
      skip: viewMode !== "spans" || !dateFromISO || !dateToISO,
    });

  const { data: traceHeatmapData, isFetching: traceHeatmapFetching } =
    useAuditTraceHeatmapQuery(heatmapParams, {
      refetchOnMountOrArgChange: true,
      skip: viewMode !== "traces" || !dateFromISO || !dateToISO,
    });

  // Select active data based on viewMode
  const activeData = viewMode === "traces" ? traceData : spanData;
  const activeFetching = viewMode === "traces" ? traceFetching : spanFetching;
  const activeError = viewMode === "traces" ? traceError : spanError;
  const activeHeatmapData =
    viewMode === "traces" ? traceHeatmapData : spanHeatmapData;
  const activeHeatmapFetching =
    viewMode === "traces" ? traceHeatmapFetching : spanHeatmapFetching;

  const rows = activeData?.rows ?? [];
  const total = activeData?.total ?? 0;

  // --- Handlers ---
  const handleAuditTabChange = useCallback((_, newValue) => {
    setAuditTab(newValue);
    setPage(0);
    setCellFilter(null);
    setTraceFilter(null);
    // Reset event_type filter since the options differ per tab
    setDraftFilters((prev) => ({ ...prev, event_type: "" }));
    setAppliedFilters((prev) => ({ ...prev, event_type: "" }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleViewModeChange = useCallback((_, newValue) => {
    if (newValue == null) return;
    setViewMode(newValue);
    setPage(0);
    setCellFilter(null);
    setSortBy(newValue === "traces" ? "start_time" : "timestamp");
    setSortOrder("desc");
  }, []);

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("desc");
      return field;
    });
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(0);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
    setCellFilter(null);
    setPage(0);
  }, [draftFilters]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

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

  const filterChips = (
    <>
      {traceFilter && (
        <Chip
          label={`trace: ${traceFilter.substring(0, 12)}...`}
          size="small"
          onDelete={handleClearTrace}
          sx={{ fontSize: "0.75rem" }}
        />
      )}
      {cellFilter && (
        <Chip
          label={`${cellFilter.timeLabel} · ${cellFilter.bandLabel}`}
          size="small"
          color="primary"
          onDelete={handleClearCell}
          sx={{ fontSize: "0.75rem" }}
        />
      )}
    </>
  );

  const auditTabs = (
    <Tabs
      value={auditTab}
      onChange={handleAuditTabChange}
      sx={styles.headerTabs}
    >
      <Tab label="User" value="user" sx={styles.headerTab} />
      <Tab label="System" value="system" sx={styles.headerTab} />
    </Tabs>
  );

  return (
    <DrawerPage>
      <DrawerPageHeader
        title="Audit Trail"
        tabs={auditTabs}
        showSearchInput
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search actions, tools, users"
        extraContent={filterChips}
      />

      <AuditTrailFilters
        filters={draftFilters}
        onFieldChange={handleFieldChange}
        onApply={handleApply}
        onRefresh={handleRefresh}
        activePreset={activePreset}
        onPresetChange={setActivePreset}
        eventTypes={eventTypeOptions}
      />

      <AuditHeatmap
        data={activeHeatmapData?.data}
        metadata={activeHeatmapData?.metadata}
        isFetching={activeHeatmapFetching}
        onCellClick={handleCellClick}
        viewMode={viewMode}
      />

      <Box sx={styles.tabsContainer}>
        <Tabs value={viewMode} onChange={handleViewModeChange} sx={styles.tabs}>
          <Tab label="Traces" value="traces" sx={styles.tab} />
          <Tab label="Spans" value="spans" sx={styles.tab} />
        </Tabs>
      </Box>

      <Box sx={styles.tableContainer}>
        {activeError ? (
          <Box sx={styles.errorContainer}>
            Failed to load audit {viewMode === "traces" ? "traces" : "events"}.
          </Box>
        ) : viewMode === "traces" ? (
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
    </DrawerPage>
  );
}

const styles = {
  headerTabs: ({ palette }) => ({
    minHeight: "2.5rem",
    "& .MuiTabs-indicator": {
      backgroundColor: palette.text.secondary,
    },
  }),
  headerTab: ({ palette }) => ({
    textTransform: "none",
    minHeight: "2.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: palette.text.metrics,
    "&.Mui-selected": {
      color: palette.text.secondary,
    },
  }),
  tabsContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "0 1.5rem",
  },
  tabs: ({ palette }) => ({
    minHeight: "2.5rem",
    "& .MuiTabs-indicator": {
      backgroundColor: palette.text.secondary,
    },
  }),
  tab: ({ palette }) => ({
    textTransform: "none",
    minHeight: "2.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: palette.text.metrics,
    "&.Mui-selected": {
      color: palette.text.secondary,
    },
  }),
  tableContainer: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    maxWidth: "100%",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: "3rem",
    color: "error.main",
  },
};

export default AuditTrailPage;
