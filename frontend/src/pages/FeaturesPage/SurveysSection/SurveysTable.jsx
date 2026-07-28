import { memo, useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";

import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
} from "@/components/GridTable";

const SURVEYS_COLUMNS = [
  { field: "name", label: "Name", width: "1fr", sortable: false },
  {
    field: "description",
    label: "Description",
    width: "1.5fr",
    sortable: false,
    hideBelow: 800,
  },
  {
    field: "enabled",
    label: "Status",
    width: "8rem",
    sortable: false,
  },
  {
    field: "questions_count",
    label: "Questions",
    width: "7rem",
    sortable: false,
    hideBelow: 900,
  },
  { field: "actions", label: "Actions", width: "5.5rem", sortable: false },
];

const SurveysTable = memo((props) => {
  const { surveys = [], isFetching = false, onRowClick, onDelete } = props;

  const [hoveredRowId, setHoveredRowId] = useState(null);

  const rows = useMemo(
    () =>
      surveys.map((s) => ({
        ...s,
        questions_count: s.questions?.length ?? 0,
      })),
    [surveys],
  );

  const { visibleColumns, dataColumns, gridTemplateColumns } =
    useResponsiveColumns({
      columns: SURVEYS_COLUMNS,
      containerWidth: window.innerWidth,
      showCheckbox: false,
      actionsColumnWidth: "5.5rem",
    });

  const renderCell = useCallback((column, value) => {
    if (column.field === "enabled") {
      return (
        <Chip
          label={value ? "Enabled" : "Disabled"}
          size="small"
          color={value ? "success" : "default"}
          variant="outlined"
        />
      );
    }
    if (column.field === "questions_count") {
      return String(value ?? 0);
    }
    // Return string so GridTableRow wraps it in Tooltip automatically
    return String(value || "-");
  }, []);

  const renderActions = useCallback(
    (row) => (
      <Box sx={styles.actionsRow}>
        {onDelete && (
          <Tooltip title="Delete survey">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    ),
    [onDelete],
  );

  if (isFetching) {
    return (
      <Box sx={styles.skeletonContainer}>
        {Array.from({ length: 5 }).map((_, index) => (
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
        isEmpty={rows.length === 0}
        emptyMessage="No surveys yet. Click '+' to create one."
      >
        <GridTableHeader
          columns={visibleColumns}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {rows.map((row) => (
            <Box
              key={row.id}
              onClick={() => onRowClick?.(row)}
              sx={styles.clickableRow}
            >
              <GridTableRow
                row={row}
                columns={dataColumns}
                isHovered={hoveredRowId === row.id}
                onMouseEnter={() => setHoveredRowId(row.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                gridTemplateColumns={gridTemplateColumns}
                showCheckbox={false}
                renderCell={renderCell}
                renderActions={renderActions}
              />
            </Box>
          ))}
        </GridTableBody>
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
    marginTop: "1.5rem",
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
  skeletonContainer: {
    width: "100%",
    padding: "1.5rem",
  },
  clickableRow: ({ palette }) => ({
    cursor: "pointer",
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    "&:last-of-type": {
      borderBottom: "none",
    },
  }),
};

export default SurveysTable;
