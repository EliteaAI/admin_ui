import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  usePermissionMatrixQuery,
  usePermissionMatrixUpdateMutation,
  usePublicPermissionMatrixQuery,
  usePublicPermissionMatrixUpdateMutation,
} from "@/api/usersApi";

import PermissionMatrix from "./PermissionMatrix";

const ROLE_ORDER = ["system", "admin", "editor", "viewer"];

function RolesPage() {
  usePageTitle("Roles");

  const [activeTab, setActiveTab] = useState("standard");
  const [search, setSearch] = useState("");

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
  const [stdRows, setStdRows] = useState(null);
  const stdServerRef = useRef(null);

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
  const pubServerRef = useRef(null);

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

  // Active tab's data
  const localRows = activeTab === "standard" ? stdRows : pubRows;
  const setLocalRows = activeTab === "standard" ? setStdRows : setPubRows;
  const serverRef = activeTab === "standard" ? stdServerRef : pubServerRef;
  const isFetching = activeTab === "standard" ? stdFetching : pubFetching;
  const isError = activeTab === "standard" ? stdError : pubError;
  const isSaving = activeTab === "standard" ? stdSaving : pubSaving;

  const roles = useMemo(() => {
    if (!localRows || localRows.length === 0) return ROLE_ORDER;
    const sample = localRows[0];
    const keys = Object.keys(sample).filter((k) => k !== "name");
    return ROLE_ORDER.filter((r) => keys.includes(r));
  }, [localRows]);

  const isDirty = useMemo(() => {
    if (!localRows || !serverRef.current) return false;
    return JSON.stringify(localRows) !== JSON.stringify(serverRef.current);
  }, [localRows, serverRef]);

  const handleChange = useCallback(
    (updater) => {
      setLocalRows((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [setLocalRows],
  );

  const handleDiscard = useCallback(() => {
    setLocalRows(serverRef.current);
  }, [setLocalRows, serverRef]);

  const handleSave = useCallback(async () => {
    if (!localRows) return;
    const mutation =
      activeTab === "standard" ? updateStdMatrix : updatePubMatrix;
    await mutation({ targetMode: "default", rows: localRows }).unwrap();
  }, [localRows, activeTab, updateStdMatrix, updatePubMatrix]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
  }, []);

  const extraContent = isDirty ? (
    <Box sx={{ display: "flex", gap: "0.5rem" }}>
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
    </Box>
  ) : null;

  const tabsElement = (
    <Tabs value={activeTab} onChange={handleTabChange} sx={styles.tabs}>
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
        {isFetching && !localRows && (
          <Box sx={styles.loadingContainer}>Loading permissions...</Box>
        )}
        {localRows && (
          <PermissionMatrix
            rows={localRows}
            roles={roles}
            search={search}
            onChange={handleChange}
          />
        )}
      </Box>
    </DrawerPage>
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
