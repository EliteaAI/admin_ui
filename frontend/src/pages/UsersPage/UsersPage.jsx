import { memo, useCallback, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import {
  useUserListQuery,
  useLazyUserListQuery,
  useUserToggleAdminMutation,
  useUserSuspendMutation,
} from "@/api/usersApi";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { exportToExcel } from "@/utils/exportToExcel";

import UsersTable from "./UsersTable";
import DeleteUserDialog from "./DeleteUserDialog";
import UserActivityDrawer from "./UserActivityDrawer";

const USER_TYPES = ["platform", "system"];
const EXPORT_COLUMNS = [
  { header: "Name", key: "name" },
  { header: "Email", key: "email" },
  { header: "Last Login", key: "last_login" },
  { header: "Status", key: "status" },
  {
    header: "Platform Admin",
    key: "is_admin",
    transform: (v) => (v ? "Yes" : "No"),
  },
];

const UsersPage = memo(() => {
  usePageTitle("Users");

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);

  // Activity drawer state
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityUser, setActivityUser] = useState(null);

  const userType = USER_TYPES[activeTab];

  const [toggleAdmin] = useUserToggleAdminMutation();
  const [suspendUser] = useUserSuspendMutation();
  const [fetchUsers] = useLazyUserListQuery();
  const [exporting, setExporting] = useState(false);

  const { data, isFetching, isError } = useUserListQuery(
    {
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
      user_type: userType,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
    { refetchOnMountOrArgChange: true },
  );

  const users = data?.rows ?? [];
  const total = data?.total ?? 0;
  const counts = data?.counts ?? {};

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearch("");
    setSelectedIds([]);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0);
    setSelectedIds([]);
  }, []);

  const handleSort = useCallback((field) => {
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

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    setSelectedIds([]);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(0);
    setSelectedIds([]);
  }, []);

  const handleDelete = useCallback((ids) => {
    setDeleteIds(ids);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setDeleteIds([]);
    setSelectedIds([]);
  }, []);

  const handleToggleAdmin = useCallback(
    (userId, isAdmin) => {
      toggleAdmin({ userId, isAdmin });
    },
    [toggleAdmin],
  );

  // Suspend handler
  const handleSuspend = useCallback(
    async (user) => {
      const newSuspended = user.status !== "suspended";
      try {
        await suspendUser({
          userId: user.id,
          suspended: newSuspended,
        }).unwrap();
      } catch (err) {
        // Error handling via RTK Query cache invalidation
      }
    },
    [suspendUser],
  );

  // Export handler
  const handleExport = useCallback(async () => {
    setExporting(true);

    try {
      const fetchAll = async (userType) => {
        const first = await fetchUsers({
          limit: 1,
          offset: 0,
          user_type: userType,
        }).unwrap();
        const total = first?.total ?? 0;

        if (total === 0) return [];

        const result = await fetchUsers({
          limit: total,
          offset: 0,
          user_type: userType,
        }).unwrap();
        return result?.rows ?? [];
      };

      const [platformRows, systemRows] = await Promise.all([
        fetchAll("platform"),
        fetchAll("system"),
      ]);

      exportToExcel("Users.xlsx", [
        {
          sheetName: "Platform Users",
          columns: EXPORT_COLUMNS,
          rows: platformRows,
        },
        {
          sheetName: "System Users",
          columns: EXPORT_COLUMNS,
          rows: systemRows,
        },
      ]);
    } catch {
      // Export failed silently
    } finally {
      setExporting(false);
    }
  }, [fetchUsers]);

  // Activity drawer handlers
  const handleActivity = useCallback((user) => {
    setActivityUser(user);
    setActivityOpen(true);
  }, []);

  const handleActivityClose = useCallback(() => {
    setActivityOpen(false);
    setActivityUser(null);
  }, []);

  const isSystemTab = activeTab === 1;

  const extraContent = (
    <>
      {!isSystemTab && selectedIds.length > 0 && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => handleDelete(selectedIds)}
        >
          Delete ({selectedIds.length})
        </Button>
      )}
      <Tooltip title="Export to Excel" placement="top">
        <Box component="span">
          <IconButton
            disabled={exporting}
            disableRipple
            onClick={handleExport}
            sx={styles.exportButton}
          >
            {exporting ? (
              <CircularProgress size={16} sx={{ color: "icon.fill.send" }} />
            ) : (
              <FileDownloadOutlined sx={styles.exportIcon} />
            )}
          </IconButton>
        </Box>
      </Tooltip>
    </>
  );

  const platformLabel = `Platform Users${counts.platform != null ? ` (${counts.platform})` : ""}`;
  const systemLabel = `System Users${counts.system != null ? ` (${counts.system})` : ""}`;

  const tabsElement = (
    <Tabs value={activeTab} onChange={handleTabChange} sx={styles.tabs}>
      <Tab label={platformLabel} sx={styles.tab} />
      <Tab label={systemLabel} sx={styles.tab} />
    </Tabs>
  );

  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="Users"
          tabs={tabsElement}
          showSearchInput
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by name or email"
          extraContent={extraContent}
        />

        <Box sx={styles.tableContainer}>
          {isError ? (
            <Box sx={styles.errorContainer}>Failed to load users.</Box>
          ) : (
            <UsersTable
              users={users}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              sortConfig={{ field: sortBy, direction: sortOrder }}
              onSort={handleSort}
              isFetching={isFetching}
              selectedIds={isSystemTab ? [] : selectedIds}
              onSelectionChange={isSystemTab ? undefined : setSelectedIds}
              onDelete={isSystemTab ? undefined : handleDelete}
              onToggleAdmin={isSystemTab ? undefined : handleToggleAdmin}
              onSuspend={isSystemTab ? undefined : handleSuspend}
              onActivity={isSystemTab ? undefined : handleActivity}
              showCheckbox={!isSystemTab}
              showActions={!isSystemTab}
              showAdminToggle={!isSystemTab}
            />
          )}
        </Box>
      </DrawerPage>

      <DeleteUserDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        userIds={deleteIds}
      />
      <UserActivityDrawer
        open={activityOpen}
        onClose={handleActivityClose}
        user={activityUser}
      />
    </>
  );
});

UsersPage.displayName = "UsersPage";

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
  exportButton: ({ palette }) => ({
    minWidth: "1.75rem",
    width: "1.75rem",
    height: "1.75rem",
    padding: ".5rem",
    backgroundColor: palette.background.button.primary.default,
    borderRadius: "50%",
    "&:hover": {
      backgroundColor: palette.background.button.primary.hover,
    },
    "&.Mui-disabled": {
      backgroundColor: palette.background.button.primary.default,
      opacity: 0.6,
    },
  }),
  exportIcon: ({ palette }) => ({
    width: "1rem",
    height: "1rem",
    fill: palette.icon.fill.send,
  }),
};

export default UsersPage;
