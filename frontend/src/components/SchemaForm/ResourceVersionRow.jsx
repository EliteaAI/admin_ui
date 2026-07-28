import { memo } from "react";
import { Box, TextField, Typography } from "@mui/material";

const ResourceVersionRow = memo((props) => {
  const { row, onChange } = props;

  const handleValueChange = (event) => {
    if (!row.valueKey) return;
    onChange(row.valueKey, event.target.value);
  };

  // Editable value: label (static) + outlined input for value
  if (row.valueKey) {
    return (
      <Box sx={styles.editableRow}>
        <Typography variant="body2" sx={styles.editableLabel}>
          {row.label}
        </Typography>
        <TextField
          size="small"
          value={row.value}
          onChange={handleValueChange}
          sx={styles.valueField}
          slotProps={{ htmlInput: { style: { fontSize: "0.8125rem" } } }}
        />
      </Box>
    );
  }

  // Read-only rows (plugin versions): label + monospace value
  return (
    <Box sx={styles.readOnlyRow}>
      <Typography variant="body2" sx={styles.readOnlyLabel}>
        {row.label}
      </Typography>
      <Typography variant="body2" sx={styles.readOnlyValue}>
        {row.value}
      </Typography>
    </Box>
  );
});

ResourceVersionRow.displayName = "ResourceVersionRow";

const styles = {
  editableRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  editableLabel: {
    width: "12rem",
    flexShrink: 0,
    fontWeight: 600,
    fontSize: "0.8125rem",
  },
  valueField: {
    flex: 1,
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
  },
  readOnlyRow: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    borderBottom: `1px solid ${palette.border.table}`,
    "&:last-child": { borderBottom: "none" },
  }),
  readOnlyLabel: {
    fontWeight: 600,
    fontSize: "0.8125rem",
  },
  readOnlyValue: ({ palette }) => ({
    fontSize: "0.8125rem",
    color: palette.text.metrics,
    fontFamily: "monospace",
  }),
};

export default ResourceVersionRow;
