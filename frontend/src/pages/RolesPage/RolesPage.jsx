import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCheckPermission } from "@/hooks/useCheckPermission";
import { PERMISSIONS } from "@/constants/permissions";
import {
  usePermissionMatrixQuery,
  usePermissionMatrixUpdateMutation,
  usePermissionMatrixSyncMutation,
  usePublicPermissionMatrixQuery,
  usePublicPermissionMatrixUpdateMutation,
} from "@/api/usersApi";

import PermissionMatrix from "./PermissionMatrix";

const ROLE_ORDER = ["system", "super_admin", "admin", "editor", "viewer"];

const RolesPage = memo(() => {
  usePageTitle("Roles");

  const adminServerRef = useRef(null);
  const stdServerRef = useRef(null);
  const pubServerRef = useRef(null);

  const { hasPermission, isSuperAdmin } = useCheckPermission();

  const [activeTab, setActiveTab] = useState("admin");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Admin roles data
  const {
    data: adminData,
    isFetching: adminFetching,
    isError: adminError,
  } = usePermissionMatrixQuery(
    { targetMode: "administration" },
    { refetchOnMountOrArgChange: true, skip: activeTab !== "admin" },
  );

  const [updateAdminMatrix, { isLoading: adminSaving }] =
    usePermissionMatrixUpdateMutation();

  const [adminRows, setAdminRows] = useState(null);

  // Standard roles data
  const {
    data: stdData,
    isFetching: stdFetching,
    isError: stdError,
  } = usePermissionMatrixQuery(
    { targetMode: "default" },
    { refetchOnMountOrArgChange: true, skip: activeTab !== "standard" },
  );

  const [updateStdMatrix, { isLoading: stdSaving }] =
    usePermissionMatrixUpdateMutation();
  const [syncStdMatrix, { isLoading: stdSyncing }] =
    usePermissionMatrixSyncMutation();

  const [stdRows, setStdRows] = useState(null);

  // Public project data
  const {
    data: pubData,
    isFetching: pubFetching,
    isError: pubError,
  } = usePublicPermissionMatrixQuery(
    { targetMode: "default" },
    { refetchOnMountOrArgChange: true, skip: activeTab !== "public" },
  );

  const [updatePubMatrix, { isLoading: pubSaving }] =
    usePublicPermissionMatrixUpdateMutation();

  const [pubRows, setPubRows] = useState(null);

  // Sync admin data
  useEffect(() => {
    if (adminData?.rows) {
      adminServerRef.current = adminData.rows;
      setAdminRows(adminData.rows);
    }
  }, [adminData]);

  // Sync standard data
  useEffect(() => {
    if (stdData?.rows) {
      stdServerRef.current = stdData.rows;
      setStdRows(stdData.rows);
    }
  }, [stdData]);

  // Sync public data
  useEffect(() => {
    if (pubData?.rows) {
      pubServerRef.current = pubData.rows;
      setPubRows(pubData.rows);
    }
  }, [pubData]);

  const tabConfig = useMemo(
    () => ({
      admin: {
        rows: adminRows,
        setRows: setAdminRows,
        serverRef: adminServerRef,
        isFetching: adminFetching,
        isError: adminError,
        isSaving: adminSaving,
        mutation: updateAdminMatrix,
        targetMode: "administration",
      },
      standard: {
        rows: stdRows,
        setRows: setStdRows,
        serverRef: stdServerRef,
        isFetching: stdFetching,
        isError: stdError,
        isSaving: stdSaving,
        mutation: updateStdMatrix,
        targetMode: "default",
      },
      public: {
        rows: pubRows,
        setRows: setPubRows,
        serverRef: pubServerRef,
        isFetching: pubFetching,
        isError: pubError,
        isSaving: pubSaving,
        mutation: updatePubMatrix,
        targetMode: "default",
      },
    }),
    [
      adminRows,
      stdRows,
      pubRows,
      adminFetching,
      stdFetching,
      pubFetching,
      adminError,
      stdError,
      pubError,
      adminSaving,
      stdSaving,
      pubSaving,
      updateAdminMatrix,
      updateStdMatrix,
      updatePubMatrix,
    ],
  );

  const {
    rows,
    setRows,
    serverRef,
    isFetching,
    isError,
    isSaving,
    mutation,
    targetMode,
  } = tabConfig[activeTab] ?? tabConfig.admin;

  const canEdit = useMemo(
    () => hasPermission(PERMISSIONS.roles.edit),
    [hasPermission],
  );

  const disabledRoles = useMemo(
    () => (isSuperAdmin ? [] : ["super_admin"]),
    [isSuperAdmin],
  );

  const roles = useMemo(() => {
    let currentOrder = ROLE_ORDER;

    if (activeTab !== "admin")
      currentOrder = currentOrder.filter((r) => r !== "super_admin");
    if (!rows || rows.length === 0) return currentOrder;

    const sample = rows[0];
    const keys = Object.keys(sample).filter((k) => k !== "name");

    return currentOrder.filter((r) => keys.includes(r));
  }, [rows, activeTab]);

  const isDirty = useMemo(() => {
    if (!rows || !serverRef.current) return false;
    return JSON.stringify(rows) !== JSON.stringify(serverRef.current);
  }, [rows, serverRef]);

  const handleChange = useCallback(
    (updater) => {
      setRows((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [setRows],
  );

  const handleDiscard = useCallback(() => {
    setRows(serverRef.current);
  }, [setRows, serverRef]);

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback((_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!rows) return;

    try {
      await mutation({ targetMode, rows: rows }).unwrap();

      showSnackbar("Permissions saved successfully", "success");
    } catch (err) {
      showSnackbar("Failed to save permissions", "error");
    }
  }, [rows, activeTab, mutation, targetMode, showSnackbar]);

  const handleApply = useCallback(async () => {
    try {
      await syncStdMatrix({ targetMode: "default" }).unwrap();
      showSnackbar("Permissions synced to projects successfully", "success");
    } catch (err) {
      showSnackbar(
        err?.data?.error || "Failed to sync permissions to projects",
        "error",
      );
    }
  }, [syncStdMatrix, showSnackbar]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
  }, []);

  const extraContent = (
    <Box sx={{ display: "flex", gap: "0.5rem" }}>
      {activeTab === "standard" && canEdit && !isDirty && (
        <Button
          variant="contained"
          size="small"
          onClick={handleApply}
          disabled={stdSyncing || isSaving}
        >
          {stdSyncing ? "Applying..." : "Apply to Projects"}
        </Button>
      )}
      {canEdit && isDirty && (
        <>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDiscard}
            disabled={isSaving}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </>
      )}
    </Box>
  );

  const tabsElement = (
    <Tabs value={activeTab} onChange={handleTabChange} sx={styles.tabs}>
      <Tab label="Admin Roles" value="admin" sx={styles.tab} />
      <Tab label="Standard Roles" value="standard" sx={styles.tab} />
      <Tab label="Public Project" value="public" sx={styles.tab} />
    </Tabs>
  );

  return (
    <DrawerPage sx={{ overflow: "hidden" }}>
      <DrawerPageHeader
        title="Roles"
        tabs={tabsElement}
        showSearchInput
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search permissions"
        extraContent={extraContent}
      />

      <Box sx={styles.content}>
        {isError && (
          <Box sx={styles.errorContainer}>Failed to load permissions.</Box>
        )}
        {isFetching && !rows && (
          <Box sx={styles.loadingContainer}>Loading permissions...</Box>
        )}
        {rows && (
          <PermissionMatrix
            rows={rows}
            roles={roles}
            search={search}
            onChange={handleChange}
            readOnly={!canEdit}
            disabledRoles={disabledRoles}
          />
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DrawerPage>
  );
});

RolesPage.displayName = "RolesPage";

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
  content: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    padding: "0 1.5rem 1rem",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "3rem",
    color: "error.main",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "3rem",
    color: "text.metrics",
  },
};

export default RolesPage;
