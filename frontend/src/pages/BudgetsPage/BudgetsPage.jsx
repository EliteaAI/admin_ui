import { useCallback, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";

import { exportToExcel } from "@/utils/exportToExcel";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCheckPermission } from "@/hooks/useCheckPermission";
import { PERMISSIONS } from "@/constants/permissions";

import {
  useLazyProjectBudgetListQuery,
  useProjectBudgetListQuery,
  useProjectBudgetUpdateMutation,
  useUserBudgetUpdateMutation,
} from "@/api/budgetsApi";

import BudgetsTable from "./BudgetsTable";
import BudgetEditDialog from "./BudgetEditDialog";
import UserBudgetsDrawer from "./UserBudgetsDrawer";

// Tab index -> project_type filter
const TAB_TYPES = ["team", "personal"];

const PERIOD_NOTE =
  "Current month, updated within a minute of each call. Export to Excel to rank projects by limit, spend or usage.";

const SEARCH_PLACEHOLDERS = {
  team: "Search by Name or ID",
  personal: "Search by Name, ID, Owner, or Email",
};

const CURRENCY_FMT = '$#,##0.00####';
const PERCENT_FMT = '0.00"%"';

const SOURCE_LABELS = {
  explicit: "Explicit",
  default: "Default",
  unlimited: "Unlimited",
};

// Numeric cells stay numeric so the sheet can be summed and sorted; readability
// comes from the Excel format, not from pre-formatted strings.
const EXPORT_BUDGET_COLUMNS = [
  {
    header: "Limit (USD)",
    key: "effective_limit",
    numFmt: CURRENCY_FMT,
    transform: (value) => (value === null || value === undefined ? "Unlimited" : value),
  },
  { header: "Spent (USD)", key: "spend", numFmt: CURRENCY_FMT },
  {
    header: "Used (%)",
    key: "percent_used",
    numFmt: PERCENT_FMT,
    // Blank rather than 0: an unlimited budget has nothing to measure against, and 0
    // would read as "nothing used"
    transform: (value) => (value === null || value === undefined ? "" : value),
  },
  {
    header: "Source",
    key: "limit_source",
    transform: (value) => SOURCE_LABELS[value] || value || "",
  },
];

const TEAM_EXPORT_COLUMNS = [
  { header: "Name", key: "name" },
  { header: "ID", key: "project_id" },
  ...EXPORT_BUDGET_COLUMNS,
];

const PERSONAL_EXPORT_COLUMNS = [
  { header: "Name", key: "name" },
  { header: "ID", key: "project_id" },
  { header: "Owner", key: "owner_name" },
  { header: "Email", key: "owner_email" },
  ...EXPORT_BUDGET_COLUMNS,
];

export default function BudgetsPage() {
  usePageTitle("Budgets");

  const { hasPermission } = useCheckPermission();
  const canEdit = useMemo(
    () => hasPermission(PERMISSIONS.budgets.edit),
    [hasPermission],
  );

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeTab, setActiveTab] = useState(0);

  const [exporting, setExporting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [drawerProject, setDrawerProject] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const projectType = TAB_TYPES[activeTab];

  const { data, isFetching, isError, refetch } = useProjectBudgetListQuery(
    {
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      project_type: projectType,
    },
    { refetchOnMountOrArgChange: true },
  );

  const [fetchBudgets] = useLazyProjectBudgetListQuery();

  const [updateProjectBudget, { isLoading: isSavingProject }] =
    useProjectBudgetUpdateMutation();
  const [updateUserBudget, { isLoading: isSavingUser }] =
    useUserBudgetUpdateMutation();

  const rows = data?.rows || [];
  const total = data?.total || 0;

  // DrawerPageHeader passes the raw value, not the change event
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setPage(0);
  }, []);

  // The ID column reads row.project_id, but the API sorts on the project's own "id"
  const handleSort = useCallback((column) => {
    const field = column === "project_id" ? "id" : column;

    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("asc");
      return field;
    });
    setPage(0);
  }, []);

  const handleTabChange = useCallback((_event, value) => {
    setActiveTab(value);
    setPage(0);
    // Defensive: the drawer is modal today so a tab cannot be clicked behind it, but
    // personal projects have no member budgets and it must not survive a switch if that
    // ever changes
    setDrawerProject(null);
  }, []);

  const handleSave = useCallback(
    async (payload) => {
      const target = editTarget;

      // A user_id on the target means the dialog was opened from the drawer
      if (target?.user_id) {
        await updateUserBudget({
          projectId: target.project_id,
          userId: target.user_id,
          ...payload,
        }).unwrap();
      } else {
        await updateProjectBudget({
          projectId: target.project_id,
          ...payload,
        }).unwrap();
      }

      setSnackbar({
        open: true,
        message: payload.enabled
          ? "Budget saved."
          : "Budget removed — this scope's own limit no longer applies.",
        severity: "success",
      });
    },
    [editTarget, updateProjectBudget, updateUserBudget],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);

    try {
      const fetchAll = async (type) => {
        const probe = await fetchBudgets({ limit: 1, offset: 0, project_type: type }).unwrap();
        const total = probe?.total ?? 0;

        if (!total) return [];

        const result = await fetchBudgets({
          limit: total,
          offset: 0,
          project_type: type,
        }).unwrap();

        return result?.rows ?? [];
      };

      const [teamRows, personalRows] = await Promise.all([
        fetchAll("team"),
        fetchAll("personal"),
      ]);

      await exportToExcel("Budgets.xlsx", [
        { sheetName: "Team Projects", columns: TEAM_EXPORT_COLUMNS, rows: teamRows },
        {
          sheetName: "Personal Projects",
          columns: PERSONAL_EXPORT_COLUMNS,
          rows: personalRows,
        },
      ]);

      setSnackbar({
        open: true,
        message: "Budgets exported.",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Export failed. Please try again.",
        severity: "error",
      });
    } finally {
      setExporting(false);
    }
  }, [fetchBudgets]);

  const counts = data?.counts || {};

  const tabsElement = (
    <Tabs value={activeTab} onChange={handleTabChange} sx={styles.tabs}>
      <Tab
        label={
          counts.team ? `Team Projects (${counts.team})` : "Team Projects"
        }
        sx={styles.tab}
      />
      <Tab
        label={
          counts.personal
            ? `Personal Projects (${counts.personal})`
            : "Personal Projects"
        }
        sx={styles.tab}
      />
    </Tabs>
  );

  const headerControls = (
    <Box sx={styles.headerControls}>
      <Tooltip title={PERIOD_NOTE}>
        <InfoOutlined sx={styles.infoIcon} />
      </Tooltip>
      <Tooltip title="Reload budget data">
        <span>
          <IconButton size="small" onClick={refetch} disabled={isFetching}>
            <RefreshOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Export to Excel">
        <span>
          <IconButton size="small" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <CircularProgress size={16} />
            ) : (
              <FileDownloadOutlined fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );

  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="Budgets"
          tabs={tabsElement}
          showSearchInput
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={SEARCH_PLACEHOLDERS[projectType]}
          searchInputSx={{ "& input::placeholder": { fontSize: "0.75rem" } }}
          extraContent={headerControls}
        />

        <Box sx={styles.tableContainer}>
          {isError ? (
            <Box sx={styles.errorContainer}>Failed to load budgets.</Box>
          ) : (
            <BudgetsTable
              rows={rows}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              sortConfig={{
                field: sortBy === "id" ? "project_id" : sortBy,
                direction: sortOrder,
              }}
              onSort={handleSort}
              isFetching={isFetching}
              isPersonal={projectType === "personal"}
              canEdit={canEdit}
              onEdit={setEditTarget}
              onUsers={setDrawerProject}
            />
          )}
        </Box>
      </DrawerPage>

      <BudgetEditDialog
        open={!!editTarget}
        target={editTarget}
        isSaving={isSavingProject || isSavingUser}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />

      <UserBudgetsDrawer
        open={!!drawerProject}
        project={drawerProject}
        canEdit={canEdit}
        onClose={() => setDrawerProject(null)}
        onEdit={setEditTarget}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "success" ? 5000 : 10000}
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
    </>
  );
}

const styles = {
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
  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  infoIcon: ({ palette }) => ({
    fontSize: "1rem",
    color: palette.text.metrics,
  }),
  tableContainer: {
    flexGrow: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  errorContainer: {
    padding: "1rem",
  },
};
