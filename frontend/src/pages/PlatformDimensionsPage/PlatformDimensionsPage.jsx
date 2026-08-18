import { useCallback, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import SyncOutlined from "@mui/icons-material/SyncOutlined";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
} from "@/components/GridTable";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCheckPermission } from "@/hooks/useCheckPermission";
import { PERMISSIONS } from "@/constants/permissions";

import {
  usePlatformDimensionListQuery,
  usePlatformDimensionCreateMutation,
  usePlatformDimensionUpdateMutation,
  usePlatformDimensionDeactivateMutation,
  usePlatformDimensionResyncMutation,
} from "@/api/platformDimensionsApi";

import PlatformDimensionDialog from "./PlatformDimensionDialog";
import { ENGINE_LABELS, POLARITY_LABELS, SCALE_TYPE_LABELS } from "./constants";

const COLUMNS = [
  { field: "name", label: "Name", width: "1.2fr", sortable: false },
  { field: "scale", label: "Scale", width: "10rem", sortable: false },
  {
    field: "allowed_engines",
    label: "Scored by",
    width: "9rem",
    sortable: false,
    hideBelow: 1000,
  },
  {
    field: "polarity",
    label: "Polarity",
    width: "9rem",
    sortable: false,
    hideBelow: 1100,
  },
  {
    field: "default_weight",
    label: "Weight",
    width: "6rem",
    sortable: false,
    hideBelow: 1300,
  },
  { field: "is_active", label: "Status", width: "9rem", sortable: false },
  { field: "actions", label: "Actions", width: "9rem", sortable: false },
];

// Sync is update-only, so a project that never attached the dimension is absent from both
// lists — silence about it is correct, not a missed write.
const describeSync = (result) => {
  const synced = result?.synced_projects ?? 0;
  const failures = result?.failures ?? [];
  const head =
    synced === 0
      ? "No project is using this dimension yet — nothing to sync."
      : `Synced ${synced} project(s) using this dimension.`;
  if (!failures.length) return head;
  return `${head} ${failures.length} project(s) failed: ${failures
    .map((failure) => failure.project_id)
    .join(", ")}.`;
};

export default function PlatformDimensionsPage() {
  usePageTitle("Platform dimensions");

  const { hasPermission } = useCheckPermission();
  const canCreate = hasPermission(PERMISSIONS.platformDimensions.create);
  const canEdit = hasPermission(PERMISSIONS.platformDimensions.edit);
  const canDeactivate = hasPermission(PERMISSIONS.platformDimensions.delete);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { data, isFetching, isError, refetch } = usePlatformDimensionListQuery();

  const [createDimension, { isLoading: isCreating }] =
    usePlatformDimensionCreateMutation();
  const [updateDimension, { isLoading: isUpdating }] =
    usePlatformDimensionUpdateMutation();
  const [deactivateDimension] = usePlatformDimensionDeactivateMutation();
  const [resyncDimension, { isLoading: isSyncing }] =
    usePlatformDimensionResyncMutation();

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((row) => row.name?.toLowerCase().includes(term));
  }, [data, search]);

  const { visibleColumns, dataColumns, gridTemplateColumns } =
    useResponsiveColumns({
      columns: COLUMNS,
      containerWidth: window.innerWidth,
      showCheckbox: false,
      actionsColumnWidth: "9rem",
    });

  const notify = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSave = useCallback(
    async (payload) => {
      if (editTarget) {
        await updateDimension({ uuid: editTarget.uuid, ...payload }).unwrap();
        notify("Dimension updated. Use Sync to push it to projects using it.");
      } else {
        await createDimension(payload).unwrap();
        notify("Dimension created.");
      }
    },
    [editTarget, createDimension, updateDimension, notify],
  );

  const handleToggleActive = useCallback(
    async (row) => {
      try {
        if (row.is_active) {
          await deactivateDimension({ uuid: row.uuid }).unwrap();
        } else {
          await updateDimension({ uuid: row.uuid, is_active: true }).unwrap();
        }

        notify(
          row.is_active
            ? "Dimension deactivated. Existing bindings and run history are kept."
            : "Dimension activated.",
        );
      } catch (err) {
        notify(
          err?.data?.error ?? err?.error ?? "Failed to change the status.",
          "error",
        );
      }
    },
    [deactivateDimension, updateDimension, notify],
  );

  const handleSync = useCallback(
    async (row) => {
      try {
        const result = await resyncDimension({ uuid: row.uuid }).unwrap();
        notify(
          describeSync(result),
          result?.failures?.length ? "warning" : "success",
        );
      } catch (err) {
        notify(
          err?.data?.error ?? err?.error ?? "Failed to sync the dimension.",
          "error",
        );
      }
    },
    [resyncDimension, notify],
  );

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((row) => {
    setEditTarget(row);
    setDialogOpen(true);
  }, []);

  const renderCell = useCallback((column, value, row) => {
    if (column.field === "scale") {
      return (
        <Typography variant="bodyMedium" sx={styles.cellText}>
          {`${SCALE_TYPE_LABELS[row.scale_type] ?? row.scale_type} ${row.scale_min}–${row.scale_max}`}
        </Typography>
      );
    }

    if (column.field === "allowed_engines") {
      return (
        <Typography variant="bodyMedium" sx={styles.cellText}>
          {(value ?? [])
            .map((engine) => ENGINE_LABELS[engine] ?? engine)
            .join(" · ")}
        </Typography>
      );
    }

    if (column.field === "polarity") {
      return (
        <Typography variant="bodyMedium" sx={styles.cellText}>
          {POLARITY_LABELS[value] ?? value}
        </Typography>
      );
    }

    if (column.field === "is_active") {
      return (
        <Chip
          label={value ? "Active" : "Inactive"}
          size="small"
          color={value ? "primary" : "default"}
          variant="outlined"
        />
      );
    }

    if (column.field === "name") {
      return (
        <Tooltip title={row.description || ""} placement="top">
          <Typography variant="bodyMedium" sx={styles.cellText}>
            {value || "-"}
          </Typography>
        </Tooltip>
      );
    }

    return (
      <Typography variant="bodyMedium" sx={styles.cellText}>
        {value ?? "-"}
      </Typography>
    );
  }, []);

  const renderActions = useCallback(
    (row) => (
      <Box sx={styles.actionsRow}>
        <Tooltip title={canEdit ? "Edit dimension" : "No permission to edit"}>
          <span>
            <IconButton
              size="small"
              disabled={!canEdit}
              onClick={() => openEdit(row)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip
          title={
            canEdit
              ? "Sync to projects — pushes this definition to the projects already using it"
              : "No permission to sync"
          }
        >
          <span>
            <IconButton
              size="small"
              disabled={!canEdit || isSyncing}
              onClick={() => handleSync(row)}
            >
              <SyncOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip
          title={
            !canDeactivate
              ? "No permission to change the status"
              : row.is_active
                ? "Deactivate — hides it from project pickers, keeps existing bindings"
                : "Activate"
          }
        >
          <span>
            <IconButton
              size="small"
              disabled={!canDeactivate}
              onClick={() => handleToggleActive(row)}
            >
              {row.is_active ? (
                <BlockOutlined fontSize="small" />
              ) : (
                <CheckCircleOutlined fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    ),
    [canEdit, canDeactivate, isSyncing, openEdit, handleSync, handleToggleActive],
  );

  const headerControls = (
    <Tooltip title="Reload">
      <span>
        <IconButton size="small" onClick={refetch} disabled={isFetching}>
          <RefreshOutlined fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="Platform dimensions"
          showSearchInput
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name"
          extraContent={headerControls}
          showAddButton
          onAdd={openCreate}
          addButtonTooltip={
            canCreate ? "New platform dimension" : "No permission to create"
          }
          addButtonDisabled={!canCreate}
        />

        <Box sx={styles.tableContainer}>
          {isError ? (
            <Box sx={styles.errorContainer}>
              Failed to load platform dimensions.
            </Box>
          ) : (
            <GridTableContainer
              isLoading={isFetching}
              isEmpty={rows.length === 0}
              emptyMessage="No platform dimensions yet"
            >
              <GridTableHeader
                columns={visibleColumns}
                gridTemplateColumns={gridTemplateColumns}
                showCheckbox={false}
              />
              <GridTableBody>
                {rows.map((row) => (
                  <GridTableRow
                    key={row.uuid}
                    row={row}
                    columns={dataColumns}
                    gridTemplateColumns={gridTemplateColumns}
                    showCheckbox={false}
                    idField="uuid"
                    renderCell={(column, value) =>
                      renderCell(column, value, row)
                    }
                    renderActions={renderActions}
                  />
                ))}
              </GridTableBody>
            </GridTableContainer>
          )}
        </Box>
      </DrawerPage>

      <PlatformDimensionDialog
        open={dialogOpen}
        dimension={editTarget}
        isSaving={isCreating || isUpdating}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "success" ? 5000 : 10000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
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
  cellText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
};
