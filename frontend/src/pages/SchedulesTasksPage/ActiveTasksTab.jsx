import { memo, useCallback, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopOutlined from "@mui/icons-material/StopOutlined";
import HubOutlined from "@mui/icons-material/HubOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import ViewColumnOutlined from "@mui/icons-material/ViewColumnOutlined";

import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { useTableSort } from "@/hooks/useTableSort";
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
} from "@/components/GridTable";

import {
  useActiveTasksListQuery,
  useActiveTasksRefreshMutation,
  useActiveTasksStopMutation,
} from "@/api/tasksApi";

import { TaskLogDrawer } from "@/components/LogViewerDrawer";

const POOL_COLUMNS = [
  { field: "pool", label: "Pool", width: "1fr", sortable: false },
  { field: "ident", label: "Ident", width: "1fr", sortable: false },
  { field: "task_limit", label: "Task Limit", width: "8rem", sortable: false },
  { field: "running_tasks", label: "Running", width: "8rem", sortable: false },
];

const TASK_COLUMNS = [
  { field: "project_id", label: "Project ID", width: "8rem", sortable: true },
  {
    field: "user_id",
    label: "User ID",
    width: "8rem",
    sortable: true,
    hideBelow: 1100,
  },
  { field: "started_at", label: "Time", width: "13rem", sortable: true },
  { field: "status", label: "Status", width: "7rem", sortable: true },
  {
    field: "user_input_preview",
    label: "User input",
    width: "1fr",
    sortable: false,
  },
  {
    field: "task_id",
    label: "Task ID",
    width: "1fr",
    sortable: false,
    hideBelow: 1000,
  },
  { field: "meta", label: "Meta", width: "1fr", sortable: false, hideBelow: 1300 },
  {
    field: "runner",
    label: "Runner",
    width: "1fr",
    sortable: false,
    hideBelow: 900,
  },
  { field: "actions", label: "", width: "7rem", sortable: false },
];

// User-toggleable columns (the wide/opaque ones). All shown by default.
const TOGGLEABLE_COLUMNS = [
  { field: "task_id", label: "Task ID" },
  { field: "meta", label: "Meta" },
  { field: "runner", label: "Runner" },
];

const STATUS_CONFIG = {
  running: { label: "Running", color: "success" },
  done: { label: "Done", color: "default" },
  error: { label: "Error", color: "error" },
  stopped: { label: "Stopped", color: "warning" },
};

// Default ordering priority: actionable Running first, Pending sunk to the
// bottom (never hidden), everything else in between. Lower = higher up.
const STATUS_RANK = { running: 0, error: 1, done: 2, pending: 3 };
const statusRank = (status) => {
  const rank = STATUS_RANK[(status || "").toLowerCase()];
  return rank == null ? 2 : rank;
};

function parseMeta(meta) {
  if (!meta) return "";
  try {
    const match = meta.match(/'task':\s*'([^']+)'/);
    if (match) return match[1];
  } catch {
    // ignore
  }
  return String(meta).length > 60
    ? String(meta).substring(0, 60) + "..."
    : String(meta);
}

// Backend timestamp is naive UTC (server wall-clock); force UTC parse and read
// UTC components so display matches the stored time regardless of viewer tz.
function formatUtc(value) {
  if (!value) return "—";
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return (
    `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`
  );
}

// Clock time (UTC) of an epoch ms value, for the "last refreshed" indicator.
function formatClockUtc(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
}

// Case-insensitive match across every visible task field, including the
// UTC-formatted time so searching the value the user sees works. Hidden columns
// are excluded so search matches only what's on screen.
function taskMatchesSearch(task, lowerQuery, hidden) {
  if (!lowerQuery) return true;
  const parts = [
    task.project_id,
    task.user_id,
    formatUtc(task.started_at),
    task.status,
    task.user_input_preview,
  ];
  if (!hidden?.task_id) parts.push(task.task_id);
  if (!hidden?.meta) parts.push(task.meta);
  if (!hidden?.runner) parts.push(task.runner);
  const haystack = parts
    .map((v) => (v == null ? "" : String(v)))
    .join(" ")
    .toLowerCase();
  return haystack.includes(lowerQuery);
}

// Cell that shows truncated text with a click-to-copy affordance for the full
// value (Task ID / Meta / Runner). Copy feedback swaps the icon for ~1.2s.
function CopyableCell({ display, full, mono }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!full) return;
      try {
        await navigator.clipboard.writeText(String(full));
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        // clipboard unavailable (e.g. insecure context) — no-op
      }
    },
    [full],
  );
  return (
    <Box sx={styles.copyCell}>
      <Tooltip title={full || ""}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={mono ? styles.cellTextMono : styles.cellText}
        >
          {display}
        </Typography>
      </Tooltip>
      {full ? (
        <Tooltip title={copied ? "Copied" : "Copy"}>
          <IconButton
            size="small"
            onClick={handleCopy}
            className="copy-btn"
            sx={styles.copyButton}
          >
            {copied ? (
              <CheckOutlined sx={styles.copyIcon} color="success" />
            ) : (
              <ContentCopyOutlined sx={styles.copyIcon} />
            )}
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}

function NodeCard({
  node,
  onStop,
  onOpenLogs,
  searching,
  hiddenColumns,
}) {
  const [expanded, setExpanded] = useState(true);
  const [poolExpanded, setPoolExpanded] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(true);

  // Default view: Running first, Pending last, newest within a group first.
  // Sorting Status uses the same rank; other columns sort naturally.
  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: "status",
    defaultDirection: "asc",
    comparators: {
      status: (_a, _b, rowA, rowB) => {
        const byRank = statusRank(rowA.status) - statusRank(rowB.status);
        if (byRank !== 0) return byRank;
        return String(rowB.started_at || "").localeCompare(
          String(rowA.started_at || ""),
        );
      },
    },
  });
  const sortedTasks = useMemo(
    () => sortData(node.tasks || []),
    [sortData, node.tasks],
  );

  const totalRunning = node.tasks?.length || 0;
  const totalCapacity = (node.pools || []).reduce(
    (sum, p) => sum + (p.task_limit || 0),
    0,
  );

  const poolColumns = useResponsiveColumns({
    columns: POOL_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: "0",
  });

  const visibleTaskColumns = useMemo(
    () => TASK_COLUMNS.filter((c) => !hiddenColumns?.[c.field]),
    [hiddenColumns],
  );

  const taskColumns = useResponsiveColumns({
    columns: visibleTaskColumns,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: "7rem",
  });

  const renderPoolCell = useCallback((column, value) => {
    if (column.field === "running_tasks") {
      const limit = null; // we show limit in its own column
      return (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.cellText}
        >
          {value ?? "\u2014"}
        </Typography>
      );
    }
    return (
      <Typography
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.cellText}
      >
        {value ?? "\u2014"}
      </Typography>
    );
  }, []);

  const renderTaskCell = useCallback((column, value, row) => {
    if (column.field === "task_id") {
      return (
        <CopyableCell
          display={value ? value.substring(0, 12) + "..." : "\u2014"}
          full={value}
          mono
        />
      );
    }
    if (column.field === "status") {
      const statusLower = (value || "").toLowerCase();
      const cfg = STATUS_CONFIG[statusLower] || {
        label: value || "Unknown",
        color: "default",
      };
      return (
        <Chip
          label={cfg.label}
          size="small"
          color={cfg.color}
          variant="outlined"
        />
      );
    }
    if (column.field === "meta") {
      return <CopyableCell display={parseMeta(value)} full={value} />;
    }
    if (column.field === "runner") {
      return (
        <CopyableCell
          display={
            value
              ? value.length > 20
                ? value.substring(0, 20) + "..."
                : value
              : "\u2014"
          }
          full={value}
        />
      );
    }
    if (column.field === "started_at") {
      return (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.cellText}
        >
          {formatUtc(value)}
        </Typography>
      );
    }
    if (column.field === "user_input_preview") {
      return (
        <Tooltip title={value || ""}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.cellText}
          >
            {value || "\u2014"}
          </Typography>
        </Tooltip>
      );
    }
    return (
      <Typography
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.cellText}
      >
        {value ?? "\u2014"}
      </Typography>
    );
  }, []);

  const renderTaskActions = useCallback(
    (row) => {
      const status = (row.status || "").toLowerCase();
      return (
        <Box sx={{ display: "flex", gap: "0.125rem" }}>
          <Tooltip title="View logs">
            <IconButton size="small" onClick={() => onOpenLogs(row.task_id)}>
              <DescriptionOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {status === "running" && (
            <Tooltip title="Stop task">
              <IconButton
                size="small"
                onClick={() => onStop(node.node, row.task_id)}
              >
                <StopOutlined fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    },
    [node.node, onStop, onOpenLogs],
  );

  return (
    <Box sx={styles.nodeCard}>
      <Box sx={styles.nodeHeader} onClick={() => setExpanded((v) => !v)}>
        <Box sx={styles.nodeHeaderLeft}>
          <ExpandMoreIcon
            sx={[styles.expandIcon, !expanded && styles.expandIconCollapsed]}
          />
          <Typography variant="body2" sx={styles.nodeTitle}>
            {node.plugin}
          </Typography>
          <Chip
            label={`${totalRunning} task${totalRunning !== 1 ? "s" : ""}`}
            size="small"
            color={totalRunning > 0 ? "success" : "default"}
            variant="outlined"
            sx={styles.countChip}
          />
          {totalCapacity > 0 && (
            <Typography variant="caption" sx={styles.capacityText}>
              capacity: {totalCapacity}
            </Typography>
          )}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={styles.nodeBody}>
          {/* Active Tasks */}
          <Box sx={styles.tableSection}>
            <Box sx={styles.subSectionHeader}>
              <Box
                sx={styles.subSectionToggle}
                onClick={() => setTasksExpanded((v) => !v)}
              >
                <ExpandMoreIcon
                  sx={[
                    styles.subExpandIcon,
                    !tasksExpanded && styles.expandIconCollapsed,
                  ]}
                />
                <Typography variant="caption" sx={styles.tableSectionTitle}>
                  Active Tasks
                </Typography>
                <Chip
                  label={totalRunning}
                  size="small"
                  color={totalRunning > 0 ? "success" : "default"}
                  variant="outlined"
                  sx={styles.subCountChip}
                />
              </Box>
            </Box>
            <Collapse in={tasksExpanded}>
              {sortedTasks.length > 0 ? (
                <GridTableContainer isLoading={false} isEmpty={false}>
                  <GridTableHeader
                    columns={taskColumns.visibleColumns}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    gridTemplateColumns={taskColumns.gridTemplateColumns}
                    showCheckbox={false}
                  />
                  <GridTableBody minHeight="0" sx={styles.tableBodyScroll}>
                    {sortedTasks.map((task) => (
                      <GridTableRow
                        key={task.task_id}
                        row={task}
                        columns={taskColumns.dataColumns}
                        gridTemplateColumns={taskColumns.gridTemplateColumns}
                        showCheckbox={false}
                        renderCell={renderTaskCell}
                        renderActions={renderTaskActions}
                      />
                    ))}
                  </GridTableBody>
                </GridTableContainer>
              ) : (
                <Typography variant="caption" sx={styles.emptyTasks}>
                  {searching ? "No matching active tasks" : "No active tasks"}
                </Typography>
              )}
            </Collapse>
          </Box>

          {/* Pool State */}
          {node.pools?.length > 0 && (
            <Box sx={styles.tableSection}>
              <Box sx={styles.subSectionHeader}>
                <Box
                  sx={styles.subSectionToggle}
                  onClick={() => setPoolExpanded((v) => !v)}
                >
                  <ExpandMoreIcon
                    sx={[
                      styles.subExpandIcon,
                      !poolExpanded && styles.expandIconCollapsed,
                    ]}
                  />
                  <Typography variant="caption" sx={styles.tableSectionTitle}>
                    Pool State
                  </Typography>
                  <Chip
                    label={node.pools.length}
                    size="small"
                    variant="outlined"
                    sx={styles.subCountChip}
                  />
                </Box>
              </Box>
              <Collapse in={poolExpanded}>
                <Box sx={styles.tableScroll}>
                  <GridTableContainer isLoading={false} isEmpty={false}>
                    <GridTableHeader
                      columns={poolColumns.visibleColumns}
                      gridTemplateColumns={poolColumns.gridTemplateColumns}
                      showCheckbox={false}
                    />
                    <GridTableBody>
                      {node.pools.map((pool, idx) => (
                        <GridTableRow
                          key={pool.ident || idx}
                          row={pool}
                          columns={poolColumns.dataColumns}
                          gridTemplateColumns={poolColumns.gridTemplateColumns}
                          showCheckbox={false}
                          renderCell={renderPoolCell}
                        />
                      ))}
                    </GridTableBody>
                  </GridTableContainer>
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

const ActiveTasksTab = memo(function ActiveTasksTab({ search = "" }) {
  const { data, isLoading, isFetching, isError, error, refetch, fulfilledTimeStamp } =
    useActiveTasksListQuery(undefined, {
      pollingInterval: 15000,
    });
  const [refreshNode] = useActiveTasksRefreshMutation();
  const [stopTask] = useActiveTasksStopMutation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [logTaskId, setLogTaskId] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState({});
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  const nodes = useMemo(() => {
    const all = data?.nodes || [];
    const lower = search.trim().toLowerCase();
    if (!lower) return all;
    return all.map((node) => ({
      ...node,
      tasks: (node.tasks || []).filter((t) =>
        taskMatchesSearch(t, lower, hiddenColumns),
      ),
    }));
  }, [data, search, hiddenColumns]);

  const toggleColumn = useCallback((field) => {
    setHiddenColumns((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Global refresh: ask every node to re-broadcast pool + task state (the real
  // refresh, not just a cache re-read), then let the list refetch. Guarded
  // against overlap by globalRefreshing.
  const [globalRefreshing, setGlobalRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    if (globalRefreshing) return;
    const targets = (data?.nodes || []).map((n) => n.node);
    if (targets.length === 0) {
      refetch();
      return;
    }
    setGlobalRefreshing(true);
    try {
      for (const nodeStr of targets) {
        await refreshNode({ node: nodeStr, scope: "pool" }).unwrap();
        await refreshNode({ node: nodeStr, scope: "task" }).unwrap();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Refresh failed: ${err?.message || "Unknown error"}`,
        severity: "error",
      });
    } finally {
      setGlobalRefreshing(false);
    }
  }, [globalRefreshing, data, refreshNode, refetch]);

  const handleOpenLogs = useCallback((taskId) => {
    setLogTaskId(taskId);
  }, []);

  const handleCloseLogs = useCallback(() => {
    setLogTaskId(null);
  }, []);

  const handleStop = useCallback(
    async (nodeStr, taskId) => {
      try {
        await stopTask({ node: nodeStr, taskId }).unwrap();
        setSnackbar({
          open: true,
          message: `Stop signal sent for task ${taskId.substring(0, 12)}...`,
          severity: "info",
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Stop failed: ${err?.message || "Unknown error"}`,
          severity: "error",
        });
      }
    },
    [stopTask],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  if (isLoading) {
    return (
      <Box sx={styles.loading}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (nodes.length === 0) {
    return (
      <Box sx={styles.emptyState}>
        <HubOutlined sx={styles.emptyIcon} />
        <Typography variant="bodyMedium" color="text.disabled">
          {isError
            ? "Could not load active tasks"
            : "No task nodes available"}
        </Typography>
        <Button
          size="small"
          startIcon={
            isFetching ? (
              <CircularProgress size={12} />
            ) : (
              <RefreshIcon sx={{ fontSize: "1rem" }} />
            )
          }
          onClick={() => refetch()}
          disabled={isFetching}
          sx={styles.columnsButton}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const hiddenCount = TOGGLEABLE_COLUMNS.filter(
    (c) => hiddenColumns[c.field],
  ).length;

  const lastRefreshed = formatClockUtc(fulfilledTimeStamp);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.toolbar}>
        {lastRefreshed && (
          <Typography variant="caption" sx={styles.lastRefreshed}>
            Last refreshed {lastRefreshed}
          </Typography>
        )}
        <Tooltip title="Refresh all nodes">
          <span>
            <Button
              size="small"
              startIcon={
                globalRefreshing ? (
                  <CircularProgress size={12} />
                ) : (
                  <RefreshIcon sx={{ fontSize: "1rem" }} />
                )
              }
              onClick={handleManualRefresh}
              disabled={globalRefreshing}
              sx={styles.columnsButton}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
        <Button
          size="small"
          startIcon={<ViewColumnOutlined sx={{ fontSize: "1rem" }} />}
          onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
          sx={styles.columnsButton}
        >
          Columns{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}
        </Button>
        <Menu
          anchorEl={columnMenuAnchor}
          open={Boolean(columnMenuAnchor)}
          onClose={() => setColumnMenuAnchor(null)}
        >
          {TOGGLEABLE_COLUMNS.map((col) => (
            <MenuItem
              key={col.field}
              onClick={() => toggleColumn(col.field)}
              dense
            >
              <Checkbox
                size="small"
                checked={!hiddenColumns[col.field]}
                disableRipple
              />
              <ListItemText primary={col.label} />
            </MenuItem>
          ))}
        </Menu>
      </Box>
      {isError && (
        <Alert severity="error" sx={styles.errorBanner}>
          Could not refresh active tasks
          {error?.status ? ` (${error.status})` : ""}. Showing last known data.
        </Alert>
      )}
      <Box sx={styles.scrollArea}>
        {nodes.map((node) => (
          <NodeCard
            key={node.node}
            node={node}
            onStop={handleStop}
            onOpenLogs={handleOpenLogs}
            searching={Boolean(search.trim())}
            hiddenColumns={hiddenColumns}
          />
        ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <TaskLogDrawer
        open={logTaskId != null}
        taskId={logTaskId}
        onClose={handleCloseLogs}
      />
    </Box>
  );
});

const styles = {
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.5rem",
    padding: "0.5rem 1.5rem 0",
  },
  lastRefreshed: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.6875rem",
    marginRight: "auto",
  }),
  errorBanner: {
    margin: "0.5rem 1.5rem 0",
  },
  columnsButton: {
    textTransform: "none",
    fontSize: "0.75rem",
    minWidth: "auto",
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  loading: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
  },
  emptyIcon: {
    fontSize: "3rem",
    color: "text.disabled",
  },
  nodeCard: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  nodeHeader: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.625rem 1rem",
    cursor: "pointer",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
    "&:hover": {
      backgroundColor:
        palette.background.conversation?.hover || palette.action.hover,
    },
  }),
  nodeHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  expandIcon: {
    fontSize: "1.25rem",
    transition: "transform 0.2s",
    color: "text.metrics",
  },
  expandIconCollapsed: {
    transform: "rotate(-90deg)",
  },
  nodeTitle: {
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  countChip: {
    fontSize: "0.6875rem",
    height: "1.25rem",
    "& .MuiChip-label": {
      padding: "0 0.375rem",
    },
  },
  capacityText: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.6875rem",
  }),
  nodeBody: ({ palette }) => ({
    borderTop: `1px solid ${palette.border.table}`,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    padding: "0.75rem",
  }),
  tableSection: {
    display: "flex",
    flexDirection: "column",
  },
  subSectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.25rem 0",
  },
  subSectionToggle: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    cursor: "pointer",
    userSelect: "none",
  },
  subExpandIcon: {
    fontSize: "1rem",
    transition: "transform 0.2s",
    color: "text.metrics",
  },
  subCountChip: {
    fontSize: "0.625rem",
    height: "1rem",
    "& .MuiChip-label": {
      padding: "0 0.25rem",
    },
  },
  tableScroll: {
    maxHeight: "18rem",
    overflowY: "auto",
  },
  tableBodyScroll: {
    maxHeight: "18rem",
    overflowY: "auto",
  },
  tableSectionTitle: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  }),
  emptyTasks: ({ palette }) => ({
    color: palette.text.disabled,
    fontSize: "0.75rem",
    padding: "0.75rem 0.25rem",
  }),
  cellText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cellTextMono: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: "monospace",
    fontSize: "0.75rem",
  },
  copyCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    minWidth: 0,
    "&:hover .copy-btn": { opacity: 1 },
  },
  copyButton: {
    padding: "0.125rem",
    opacity: 0.35,
    transition: "opacity 0.15s",
    flexShrink: 0,
  },
  copyIcon: {
    fontSize: "0.875rem",
  },
};

export default ActiveTasksTab;
