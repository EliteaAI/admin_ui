import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { useSurveysListQuery } from "@/api/surveysApi";

const SurveyList = memo((props) => {
  const { selectedId, onSelect, onAddNew } = props;
  const { data: surveys = [], isLoading } = useSurveysListQuery();

  const handleClick = useCallback(
    (id) => {
      onSelect(id);
    },
    [onSelect],
  );

  if (isLoading) {
    return (
      <Box sx={styles.root}>
        <Box sx={styles.loading}>
          <CircularProgress size={20} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.list}>
        {surveys.map((survey) => {
          const isActive = selectedId === survey.id;
          return (
            <Box
              key={survey.id}
              onClick={() => handleClick(survey.id)}
              sx={styles.item(isActive)}
            >
              <Typography variant="body2" sx={styles.itemName(isActive)} noWrap>
                {survey.name}
              </Typography>
              <Box sx={styles.statusDot(survey.enabled)} />
            </Box>
          );
        })}
        {surveys.length === 0 && (
          <Typography variant="body2" sx={styles.emptyText}>
            No surveys yet
          </Typography>
        )}
      </Box>
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onAddNew}
        fullWidth
        sx={styles.addButton}
      >
        Add Survey
      </Button>
    </Box>
  );
});

SurveyList.displayName = "SurveyList";

const styles = {
  root: ({ palette }) => ({
    width: "13rem",
    minWidth: "13rem",
    borderRight: `1px solid ${palette.border.table}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }),
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  loading: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  item:
    (isActive) =>
    ({ palette }) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      cursor: "pointer",
      transition: "all 0.15s ease",
      backgroundColor: isActive
        ? palette.background.userInputBackgroundActive
        : "transparent",
      "&:hover": {
        backgroundColor: isActive
          ? palette.background.userInputBackgroundActive
          : palette.background.conversation?.hover || palette.action.hover,
      },
    }),
  itemName:
    (isActive) =>
    ({ palette }) => ({
      fontSize: "0.8125rem",
      fontWeight: isActive ? 600 : 400,
      color: isActive ? palette.text.secondary : palette.text.metrics,
    }),
  statusDot:
    (enabled) =>
    ({ palette }) => ({
      width: "0.5rem",
      height: "0.5rem",
      minWidth: "0.5rem",
      borderRadius: "50%",
      backgroundColor: enabled
        ? palette.icon?.fill?.success || "#4caf50"
        : palette.text.metrics || "#9e9e9e",
    }),
  emptyText: ({ palette }) => ({
    fontSize: "0.8125rem",
    color: palette.text.metrics,
    textAlign: "center",
    padding: "1rem 0.5rem",
  }),
  addButton: {
    margin: "0.5rem",
    fontSize: "0.75rem",
    textTransform: "none",
  },
};

export default SurveyList;
