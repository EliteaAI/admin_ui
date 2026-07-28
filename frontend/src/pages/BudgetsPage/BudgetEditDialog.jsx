import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { formatMoney, formatLimit } from "./format";

/**
 * Edit a project or per-user monthly limit.
 *
 * Current spend is shown next to the input because lowering a limit below what
 * has already been spent blocks the scope immediately.
 */
export default function BudgetEditDialog(props) {
  const { open, onClose, onSave, target, isSaving } = props;

  const [unlimited, setUnlimited] = useState(false);
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !target) return;
    setError("");
    setUnlimited(
      target.monthly_limit === null || target.monthly_limit === undefined,
    );
    setLimit(
      target.monthly_limit === null || target.monthly_limit === undefined
        ? ""
        : String(target.monthly_limit),
    );
  }, [open, target]);

  const spend = Number(target?.spend || 0);
  const parsed = limit.trim() === "" ? null : Number(limit);

  const validationError = useMemo(() => {
    if (unlimited) return "";
    if (limit.trim() === "") return "Enter a limit or switch to unlimited.";
    if (Number.isNaN(parsed)) return "Limit must be a number.";
    if (parsed < 0) return "Limit must be zero or more.";
    return "";
  }, [unlimited, limit, parsed]);

  const willBlockNow =
    !unlimited && !validationError && parsed !== null && spend > parsed;

  const handleSave = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    try {
      await onSave({
        monthly_limit: unlimited ? null : parsed,
        enabled: !unlimited,
      });
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.error ?? "Failed to save the budget.");
    }
  };

  const scopeLabel = target?.user_id
    ? `${target?.name || `User ${target.user_id}`}`
    : `${target?.name || `Project ${target?.project_id}`}`;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {target?.user_id ? "Edit user budget" : "Edit project budget"}
      </DialogTitle>

      <DialogContent>
        <Box sx={styles.content}>
          <Typography variant="bodyMedium" color="text.secondary">
            {scopeLabel}
          </Typography>

          <Box sx={styles.factRow}>
            <Typography variant="bodySmall" color="text.secondary">
              Spent this month
            </Typography>
            <Typography variant="bodyMedium">
              {formatMoney(spend, target?.currency)}
            </Typography>
          </Box>

          <Box sx={styles.factRow}>
            <Typography variant="bodySmall" color="text.secondary">
              Current limit
            </Typography>
            <Typography variant="bodyMedium">
              {formatLimit(target?.effective_limit, target?.currency)}
              {target?.limit_source === "default" ? " (default)" : ""}
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={unlimited}
                onChange={(event) => setUnlimited(event.target.checked)}
              />
            }
            label="Unlimited (exempt from platform defaults)"
          />

          <TextField
            label="Monthly limit (USD)"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            disabled={unlimited}
            type="number"
            size="small"
            fullWidth
            sx={styles.limitField}
            inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }}
            error={!!validationError && limit.trim() !== ""}
            helperText={
              unlimited
                ? "No limit will be enforced for this scope."
                : validationError || "Set 0 to block all shared-model usage."
            }
          />

          {willBlockNow && (
            <Alert severity="warning">
              This limit is below the {formatMoney(spend, target?.currency)}{" "}
              already spent, so shared-model calls will be blocked immediately.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !!validationError}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const styles = {
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    paddingTop: "0.5rem",
  },
  factRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Native number spinners render unstyled and clash with the dark theme
  limitField: {
    "& input[type=number]": {
      MozAppearance: "textfield",
    },
    "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
      {
        WebkitAppearance: "none",
        margin: 0,
      },
  },
};
