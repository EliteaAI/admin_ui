import { memo, useCallback, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
  GridTablePagination,
} from "@/components/GridTable";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import {
  useAppRequestsListQuery,
  useAppRequestUpdateMutation,
} from "@/api/appRequestsApi";

import RejectRequestDialog from "./RejectRequestDialog";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
};

const COLUMNS = [
  { field: "entity_id", label: "Application", width: "0.5fr", sortable: true },
  {
    field: "user_email",
    label: "Requesting User",
    width: "1fr",
    sortable: false,
  },
  {
    field: "project_id",
    label: "Project ID",
    width: "0.5fr",
    sortable: false,
  },
  {
    field: "description",
    label: "Description",
    width: "1.5fr",
    sortable: false,
    hideBelow: 800,
  },
  {
    field: "status",
    label: "Status",
    width: "8rem",
    sortable: true,
  },
  {
    field: "created_at",
    label: "Requested At",
    width: "10rem",
    sortable: true,
    hideBelow: 900,
  },
  { field: "actions", label: "Actions", width: "7rem", sortable: false },
];

const AppRequestsPage = memo(() => {
  usePageTitle("App Requests");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRequest, setRejectRequest] = useState(null);

  const { data, isFetching, isError } = useAppRequestsListQuery(
    {
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
    { refetchOnMountOrArgChange: true },
  );

  const [updateRequest] = useAppRequestUpdateMutation();

  const requests = data?.rows ?? [];
  const total = data?.total ?? 0;

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("asc");
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

  const handleApprove = useCallback(
    async (request) => {
      try {
        await updateRequest({
          id: request.id,
          status: "approved",
        }).unwrap();
      } catch {
        // Error handled by RTK Query
      }
    },
    [updateRequest],
  );

  const handleRejectClick = useCallback((request) => {
    setRejectRequest(request);
    setRejectOpen(true);
  }, []);

  const handleRejectClose = useCallback(() => {
    setRejectOpen(false);
    setRejectRequest(null);
  }, []);

  const handleRejectSubmit = useCallback(
    async (requestId, comments) => {
      try {
        await updateRequest({
          id: requestId,
          status: "rejected",
          rejection_comment: comments,
        }).unwrap();
      } catch {
        // Error handled by RTK Query
      }
      setRejectOpen(false);
      setRejectRequest(null);
    },
    [updateRequest, rejectRequest],
  );

  const { visibleColumns, dataColumns, gridTemplateColumns } =
    useResponsiveColumns({
      columns: COLUMNS,
      containerWidth: window.innerWidth,
      showCheckbox: false,
      actionsColumnWidth: "7rem",
    });

  const paginationProps = useMemo(
    () => ({
      totalRows: total,
      pageSize,
      isFirstPage: page === 0,
      isLastPage: (page + 1) * pageSize >= total,
      startRow: total > 0 ? page * pageSize + 1 : 0,
      endRow: Math.min((page + 1) * pageSize, total),
      handlePrevPage: () => handlePageChange(Math.max(0, page - 1)),
      handleNextPage: () => handlePageChange(page + 1),
      handlePageSizeChange: handlePageSizeChange,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [total, page, pageSize, handlePageChange, handlePageSizeChange],
  );

  const renderCell = useCallback((column, value, row) => {
    if (column.field === "status") {
      const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.pending;

      return (
        <Chip
          label={cfg.label}
          size="small"
          color={cfg.color}
          variant="outlined"
        />
      );
    }

    if (column.field === "created_at") {
      if (!value) return "-";

      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    }

    if (column.field === "entity_id") {
      const display = value ? value.replace(/_/g, " ") : "-";

      return (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={{ ...styles.cellText, textTransform: "capitalize" }}
        >
          {display}
        </Typography>
      );
    }
    if (column.field === "description") {
      return (
        <Tooltip title={value || ""} placement="top-start">
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.cellText}
          >
            {value || "-"}
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
        {value || "-"}
      </Typography>
    );
  }, []);

  const renderActions = useCallback(
    (row) => {
      if (row.status !== "pending") return null;

      return (
        <Box sx={styles.actionsRow}>
          <Tooltip title="Approve">
            <IconButton size="small" onClick={() => handleApprove(row)}>
              <CheckCircleOutlineIcon fontSize="small" color="success" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
            <IconButton size="small" onClick={() => handleRejectClick(row)}>
              <CancelOutlinedIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    [handleApprove, handleRejectClick],
  );

  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="App Requests"
          showSearchInput
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by user email"
        />

        <Box sx={styles.tableContainer}>
          {isError ? (
            <Box sx={styles.errorContainer}>Failed to load app requests.</Box>
          ) : isFetching ? (
            <Box sx={styles.skeletonContainer}>
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  width="100%"
                  height="2.5rem"
                  sx={{ marginBottom: "0.5rem" }}
                />
              ))}
            </Box>
          ) : (
            <Box sx={styles.tableInner}>
              <GridTableContainer
                isLoading={false}
                isEmpty={requests.length === 0}
                emptyMessage="No app requests"
              >
                <GridTableHeader
                  columns={visibleColumns}
                  sortConfig={{ field: sortBy, direction: sortOrder }}
                  onSort={handleSort}
                  gridTemplateColumns={gridTemplateColumns}
                  showCheckbox={false}
                />

                <GridTableBody>
                  {requests.map((row) => (
                    <GridTableRow
                      key={row.id}
                      row={row}
                      columns={dataColumns}
                      gridTemplateColumns={gridTemplateColumns}
                      showCheckbox={false}
                      renderCell={renderCell}
                      renderActions={renderActions}
                    />
                  ))}
                </GridTableBody>

                {total > 0 && <GridTablePagination {...paginationProps} />}
              </GridTableContainer>
            </Box>
          )}
        </Box>
      </DrawerPage>

      <RejectRequestDialog
        open={rejectOpen}
        onClose={handleRejectClose}
        onSubmit={handleRejectSubmit}
        request={rejectRequest}
      />
    </>
  );
});

AppRequestsPage.displayName = "AppRequestsPage";

const styles = {
  tableContainer: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  tableInner: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  skeletonContainer: {
    width: "100%",
    padding: "1.5rem",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "text.secondary",
  },
  cellText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actionsRow: {
    display: "flex",
    gap: "0.125rem",
  },
};

export default AppRequestsPage;
