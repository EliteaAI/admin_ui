import { memo, useCallback, useMemo } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import EditOutlined from "@mui/icons-material/EditOutlined";
import RestartAltOutlined from "@mui/icons-material/RestartAltOutlined";

import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
  GridTablePagination,
} from "@/components/GridTable";

import { formatPerMillion } from "./constants";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const COLUMNS = [
  { field: "model_name", label: "Model", width: "1.6fr", sortable: false },
  { field: "provider", label: "Provider", width: "1fr", sortable: false },
  { field: "mode", label: "Mode", width: "8rem", sortable: false },
  { field: "input_cost_per_token", label: "Input", width: "9rem", sortable: false },
  { field: "output_cost_per_token", label: "Output", width: "9rem", sortable: false },
  { field: "is_custom", label: "Source", width: "7rem", sortable: false },
  { field: "actions", label: "Actions", width: "8rem", sortable: false },
];

const ModelPricesTable = memo(function ModelPricesTable({
  rows = [],
  total = 0,
  page = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  isFetching,
  canEdit,
  onEdit,
  onReset,
}) {
  const { visibleColumns, dataColumns, gridTemplateColumns } =
    useResponsiveColumns({
      columns: COLUMNS,
      containerWidth: window.innerWidth,
      showCheckbox: false,
      actionsColumnWidth: "8rem",
    });

  const paginationProps = useMemo(
    () => ({
      totalRows: total,
      pageSize,
      isFirstPage: page === 0,
      isLastPage: (page + 1) * pageSize >= total,
      startRow: total > 0 ? page * pageSize + 1 : 0,
      endRow: Math.min((page + 1) * pageSize, total),
      handlePrevPage: () => onPageChange(Math.max(0, page - 1)),
      handleNextPage: () => onPageChange(page + 1),
      handlePageSizeChange: onPageSizeChange,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [total, page, pageSize, onPageChange, onPageSizeChange],
  );

  const renderCell = useCallback((column, value, row) => {
    if (column.field === "model_name") {
      return (
        <Tooltip title={value || ""} placement="top">
          <Typography variant="bodyMedium" sx={styles.cellTextMono}>
            {value || "-"}
          </Typography>
        </Tooltip>
      );
    }

    if (
      column.field === "input_cost_per_token" ||
      column.field === "output_cost_per_token"
    ) {
      return (
        <Typography variant="bodyMedium" sx={styles.cellText}>
          {formatPerMillion(value)}
        </Typography>
      );
    }

    if (column.field === "is_custom") {
      return value ? (
        <Chip label="Custom" size="small" color="primary" variant="outlined" />
      ) : (
        <Chip
          label={row?.source || "imported"}
          size="small"
          color="default"
          variant="outlined"
        />
      );
    }

    return (
      <Typography variant="bodyMedium" sx={styles.cellText}>
        {value || "-"}
      </Typography>
    );
  }, []);

  const renderActions = useCallback(
    (row) => (
      <Box sx={styles.actionsRow}>
        <Tooltip title={canEdit ? "Edit price" : "No permission to edit"}>
          <span>
            <IconButton
              size="small"
              disabled={!canEdit}
              onClick={() => onEdit(row)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip
          title={
            !canEdit
              ? "No permission to edit"
              : row?.is_custom
                ? "Reset to imported default"
                : "Only custom prices can be reset"
          }
        >
          <span>
            <IconButton
              size="small"
              disabled={!canEdit || !row?.is_custom}
              onClick={() => onReset(row)}
            >
              <RestartAltOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    ),
    [canEdit, onEdit, onReset],
  );

  if (isFetching) {
    return (
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
    );
  }

  return (
    <Box sx={styles.tableContainer}>
      <GridTableContainer
        isLoading={false}
        isEmpty={rows.length === 0}
        emptyMessage="No model prices"
      >
        <GridTableHeader
          columns={visibleColumns}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {rows.map((row) => (
            <GridTableRow
              key={row.model_name}
              row={row}
              columns={dataColumns}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox={false}
              renderCell={(column, value) => renderCell(column, value, row)}
              renderActions={renderActions}
              idField="model_name"
            />
          ))}
        </GridTableBody>

        {total > 0 && <GridTablePagination {...paginationProps} />}
      </GridTableContainer>
    </Box>
  );
});

const styles = {
  tableContainer: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  skeletonContainer: {
    padding: "1rem",
  },
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
    fontSize: "0.8125rem",
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
};

ModelPricesTable.propTypes = {
  rows: PropTypes.array,
  total: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  canEdit: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default ModelPricesTable;
