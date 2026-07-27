import { useCallback, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCheckPermission } from "@/hooks/useCheckPermission";
import { PERMISSIONS } from "@/constants/permissions";

import {
  useProjectBudgetListQuery,
  useProjectBudgetUpdateMutation,
  useUserBudgetUpdateMutation,
} from "@/api/budgetsApi";

import BudgetsTable from "./BudgetsTable";
import BudgetEditDialog from "./BudgetEditDialog";
import UserBudgetsDrawer from "./UserBudgetsDrawer";

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

  const [editTarget, setEditTarget] = useState(null);
  const [drawerProject, setDrawerProject] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { data, isFetching, isError } = useProjectBudgetListQuery(
    {
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
    },
    { refetchOnMountOrArgChange: true },
  );

  const [updateProjectBudget, { isLoading: isSavingProject }] =
    useProjectBudgetUpdateMutation();
  const [updateUserBudget, { isLoading: isSavingUser }] =
    useUserBudgetUpdateMutation();

  const rows = data?.rows || [];
  const total = data?.total || 0;

  const handleSearchChange = useCallback((event) => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setPage(0);
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
          : "Budget removed — this scope is now unlimited.",
        severity: "success",
      });
    },
    [editTarget, updateProjectBudget, updateUserBudget],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const periodNote = (
    <Typography variant="bodySmall" color="text.secondary">
      Current month, updated within a minute of each call.
    </Typography>
  );

  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="Budgets"
          showSearchInput
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by project name"
          searchInputSx={{ "& input::placeholder": { fontSize: "0.75rem" } }}
          extraContent={periodNote}
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
              isFetching={isFetching}
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
        autoHideDuration={5000}
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
