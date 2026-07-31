import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";

import { useUserBudgetListQuery } from "@/api/budgetsApi";

import { formatMoney, formatLimit, usageColor } from "./format";

// Only inherited limits get a chip — an explicit one is already visible as the number
const SOURCE_CHIPS = {
  default: {
    label: "Default",
    hint: "Inherited from the platform default",
  },
  project_default: {
    label: "Project default",
    hint: "Inherited from this project's member default",
  },
};

/**
 * Member limits within one project. A member sub-limit stops a single member
 * consuming the whole project budget.
 */
export default function UserBudgetsDrawer(props) {
  const { open, onClose, project, canEdit, onEdit } = props;

  const { data, isFetching, error } = useUserBudgetListQuery(
    { projectId: project?.project_id },
    { skip: !open || !project?.project_id, refetchOnMountOrArgChange: true },
  );

  const rows = data?.rows || [];
  const memberDefault = data?.member_default_limit;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: styles.paper }}
    >
      <Box sx={styles.header}>
        <Box sx={styles.headerText}>
          <Typography variant="titleMedium" component="div">
            Member budgets
          </Typography>
          <Typography
            variant="bodySmall"
            component="div"
            color="text.secondary"
          >
            {project?.display_name || project?.name}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={styles.body}>
        <Alert severity="info" sx={styles.note}>
          A call is blocked when either the project budget or the member&apos;s
          budget is exceeded.
          {memberDefault !== null && memberDefault !== undefined && (
            <>
              {" "}
              Members with no budget of their own inherit this project&apos;s
              default of {formatMoney(memberDefault, rows[0]?.currency)}, set on
              the project&apos;s budget.
            </>
          )}
        </Alert>

        {error && <Alert severity="error">Failed to load member budgets.</Alert>}

        {isFetching &&
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height="3rem" />
          ))}

        {!isFetching && rows.length === 0 && !error && (
          <Typography variant="bodyMedium" color="text.secondary">
            No members found for this project.
          </Typography>
        )}

        {!isFetching &&
          rows.map((row) => (
            <Box key={row.user_id} sx={styles.row}>
              <Box sx={styles.rowMain}>
                <Typography variant="bodyMedium" sx={styles.name}>
                  {row.name || `User ${row.user_id}`}
                </Typography>
                <Box sx={styles.rowMeta}>
                  <Typography variant="bodySmall" color="text.secondary">
                    {formatMoney(row.spend, row.currency)} of{" "}
                    {formatLimit(row.effective_limit, row.currency)}
                  </Typography>
                  {SOURCE_CHIPS[row.limit_source] && (
                    <Tooltip title={SOURCE_CHIPS[row.limit_source].hint}>
                      <Chip
                        label={SOURCE_CHIPS[row.limit_source].label}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    </Tooltip>
                  )}
                </Box>
                {row.percent_used !== null &&
                  row.percent_used !== undefined && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, row.percent_used)}
                      color={usageColor(row.percent_used)}
                      sx={styles.bar}
                    />
                  )}
              </Box>

              <Tooltip
                title={canEdit ? "Edit member budget" : "No permission to edit"}
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={!canEdit}
                    onClick={() =>
                      onEdit({ ...row, project_member_default: memberDefault })
                    }
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))}
      </Box>
    </Drawer>
  );
}

const styles = {
  paper: {
    width: { xs: "100%", sm: "28rem" },
    padding: "1rem",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
    minWidth: 0,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  note: {
    marginBottom: "0.25rem",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid",
    borderColor: "divider",
  },
  rowMain: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    flexGrow: 1,
    minWidth: 0,
  },
  rowMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  name: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  bar: {
    height: "0.375rem",
    borderRadius: "0.25rem",
    marginTop: "0.25rem",
  },
};
