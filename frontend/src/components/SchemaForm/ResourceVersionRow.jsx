import { memo } from "react";
import { Box, TextField, Typography } from "@mui/material";

const ResourceVersionRow = memo((props) => {
  const { row, onChange } = props;

  const handleLabelChange = (event) => {
    if (!row.labelKey) return;
    onChange(row.labelKey, event.target.value);
  };

  return (
    <Box sx={styles.versionRow}>
      {row.labelKey ? (
        <TextField
          variant="standard"
          value={row.label}
          onChange={handleLabelChange}
          sx={styles.versionLabelInput}
          slotProps={{ htmlInput: { style: { fontWeight: 400, fontSize: "0.8125rem" } } }}
        />
      ) : (
        <Typography variant="body2" sx={styles.versionLabel}>
          {row.label}
        </Typography>
      )}
      <Typography variant="body2" sx={styles.versionValue}>
        {row.value}
      </Typography>
    </Box>
  );
});

ResourceVersionRow.displayName = "ResourceVersionRow";

const styles = {
  versionRow: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    borderBottom: `1px solid ${palette.border.table}`,
    "&:last-child": { borderBottom: "none" },
  }),
  versionLabel: {
    fontWeight: 600,
    fontSize: "0.8125rem",
  },
  versionLabelInput: ({ palette }) => ({
    flex: 1,
    "& .MuiInput-root": {
      color: palette.text.primary,
      "&:before": { borderBottom: "none" },
      "&:after": { borderBottom: `1px solid ${palette.primary.main}` },
      "&:hover:not(.Mui-disabled):before": {
        borderBottom: `1px solid ${palette.border.table}`,
      },
    },
    "& .MuiInput-input": { padding: "1px 0" },
  }),
  versionValue: ({ palette }) => ({
    fontSize: "0.8125rem",
    color: palette.text.metrics,
    fontFamily: "monospace",
  }),
};

export default ResourceVersionRow;
