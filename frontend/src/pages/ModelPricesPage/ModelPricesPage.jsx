import { useCallback, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCheckPermission } from "@/hooks/useCheckPermission";
import { PERMISSIONS } from "@/constants/permissions";
import { useModelPriceListQuery } from "@/api/modelPricesApi";

import ModelPricesTable from "./ModelPricesTable";
import ModelPriceDialog from "./ModelPriceDialog";
import ResetPriceDialog from "./ResetPriceDialog";
import { MODEL_MODES } from "./constants";

export default function ModelPricesPage() {
  usePageTitle("Model Prices");

  const { hasPermission } = useCheckPermission();
  const canEdit = useMemo(
    () => hasPermission(PERMISSIONS.modelPrices.edit),
    [hasPermission],
  );

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  const [mode, setMode] = useState("");
  const [customOnly, setCustomOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const [editTarget, setEditTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { data, isFetching, isError } = useModelPriceListQuery(
    {
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
      mode: mode || undefined,
      custom_only: customOnly || undefined,
    },
    { refetchOnMountOrArgChange: true },
  );

  const rows = data?.rows || [];
  const total = data?.total || 0;

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleModeChange = useCallback((event) => {
    setMode(event.target.value);
    setPage(0);
  }, []);

  const handleCustomToggle = useCallback((event) => {
    setCustomOnly(event.target.value === "custom");
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const notify = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const headerControls = (
    <Box sx={styles.headerControls}>
      <TextField
        size="small"
        select
        label="Mode"
        value={mode}
        onChange={handleModeChange}
        sx={styles.filterSelect}
      >
        <MenuItem value="">
          <em>All modes</em>
        </MenuItem>
        {MODEL_MODES.map((m) => (
          <MenuItem key={m} value={m}>
            {m}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        select
        label="Source"
        value={customOnly ? "custom" : "all"}
        onChange={handleCustomToggle}
        sx={styles.filterSelect}
      >
        <MenuItem value="all">All prices</MenuItem>
        <MenuItem value="custom">Custom only</MenuItem>
      </TextField>
    </Box>
  );

  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="Model Prices"
          showSearchInput
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by model name"
          showAddButton={canEdit}
          onAdd={() => setCreateOpen(true)}
          addButtonTooltip="Add custom price"
          extraContent={headerControls}
        />

        <Box sx={styles.tableContainer}>
          {isError ? (
            <Box sx={styles.errorContainer}>Failed to load model prices.</Box>
          ) : (
            <ModelPricesTable
              rows={rows}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              isFetching={isFetching}
              canEdit={canEdit}
              onEdit={setEditTarget}
              onReset={setResetTarget}
            />
          )}
        </Box>
      </DrawerPage>

      <ModelPriceDialog
        open={createOpen || !!editTarget}
        target={editTarget}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
        onSaved={(message) => notify(message)}
      />

      <ResetPriceDialog
        open={!!resetTarget}
        target={resetTarget}
        onClose={() => setResetTarget(null)}
        onDone={(message) => notify(message)}
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
  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  filterSelect: {
    minWidth: "10rem",
  },
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
