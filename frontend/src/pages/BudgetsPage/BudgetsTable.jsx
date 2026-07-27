import { memo, useCallback, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutline";

import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
  GridTablePagination,
} from "@/components/GridTable";

import { formatMoney, formatLimit, usageColor } from "./format";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const SOURCE_CONFIG = {
  explicit: {
    label: "Explicit",
    color: "primary",
    hint: "Set directly for this project",
  },
  default: {
    label: "Default",
    color: "info",
    hint: "Inherited from the platform default, not set for this project",
  },
  unlimited: {
    label: "Unlimited",
    color: "default",
    hint: "No limit applies to this project",
  },
};

const BUDGETS_COLUMNS = [
  { field: "name", label: "Project / User", width: "1.2fr", sortable: true },
  {
    field: "is_personal",
    label: "Type",
    width: "6rem",
    sortable: false,
    hideBelow: 900,
  },
  { field: "effective_limit", label: "Limit", width: "8rem", sortable: true },
  { field: "spend", label: "Spend", width: "8rem", sortable: true },
  { field: "percent_used", label: "Used", width: "10rem", sortable: true },
  {
    field: "limit_source",
    label: "Source",
    width: "7rem",
    sortable: false,
    hideBelow: 1100,
  },
  { field: "actions", label: "Actions", width: "8rem", sortable: false },
];

const BudgetsTable = memo(function BudgetsTable(props) {
  const {
    rows = [],
    total = 0,
    page = 0,
    pageSize = 20,
    onPageChange,
    onPageSizeChange,
    sortConfig,
    onSort,
    isFetching,
    canEdit,
    onEdit,
    onUsers,
  } = props;

  const [hoveredRowId, setHoveredRowId] = useState(null);

  const { visibleColumns, dataColumns, gridTemplateColumns } =
    useResponsiveColumns({
      columns: BUDGETS_COLUMNS,
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
    if (column.field === "name") {
      // Personal projects are really a user's own budget, so show who it belongs to
      const label = row?.display_name || value;
      return (
        <Tooltip title={row?.is_personal ? `Personal project: ${value}` : ""} placement="top">
          <Typography variant="bodyMedium" sx={styles.cellText}>
            {label || "-"}
          </Typography>
        </Tooltip>
      );
    }

    if (column.field === "is_personal") {
      return (
        <Tooltip
          title={
            value
              ? "This user's own budget — API and token calls without a project land here"
              : "A shared team project"
          }
          placement="top"
        >
          <Chip
            label={value ? "User" : "Team"}
            size="small"
            variant="outlined"
            color={value ? "secondary" : "primary"}
          />
        </Tooltip>
      );
    }

    if (column.field === "limit_source") {
      const cfg = SOURCE_CONFIG[value] || SOURCE_CONFIG.unlimited;
      return (
        <Tooltip title={cfg.hint} placement="top">
          <Chip
            label={cfg.label}
            size="small"
            color={cfg.color}
            variant="outlined"
          />
        </Tooltip>
      );
    }

    if (column.field === "effective_limit") {
      return (
        <Typography variant="bodyMedium" sx={styles.cellText}>
          {formatLimit(value, row?.currency)}
        </Typography>
      );
    }

    if (column.field === "spend") {
      return (
        <Typography variant="bodyMedium" sx={styles.cellText}>
          {formatMoney(value, row?.currency)}
        </Typography>
      );
    }

    if (column.field === "percent_used") {
      if (value === null || value === undefined) {
        return (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.cellText}
          >
            -
          </Typography>
        );
      }
      const color = usageColor(value);
      return (
        <Box sx={styles.usageCell}>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, value)}
            color={color}
            sx={styles.usageBar}
          />
          <Typography variant="bodySmall" color={`${color}.main`}>
            {value}%
          </Typography>
        </Box>
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
        <Tooltip title="Per-user limits">
          <IconButton size="small" onClick={() => onUsers(row)}>
            <PeopleOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={canEdit ? "Edit budget" : "No permission to edit"}>
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
      </Box>
    ),
    [canEdit, onEdit, onUsers],
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
        emptyMessage="No projects"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={onSort}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {rows.map((row) => (
            <GridTableRow
              key={row.project_id}
              row={row}
              columns={dataColumns}
              isHovered={hoveredRowId === row.project_id}
              onMouseEnter={() => setHoveredRowId(row.project_id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox={false}
              renderCell={(column, value) => renderCell(column, value, row)}
              renderActions={renderActions}
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
  usageCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
  },
  usageBar: {
    flexGrow: 1,
    height: "0.375rem",
    borderRadius: "0.25rem",
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
};

export default BudgetsTable;
