import { useCallback, useState } from "react";
import PropTypes from "prop-types";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { useModelPriceResetMutation } from "@/api/modelPricesApi";

function ResetPriceDialog({ open, target, onClose, onDone }) {
  const [error, setError] = useState("");
  const [resetPrice, { isLoading }] = useModelPriceResetMutation();

  const handleReset = useCallback(async () => {
    setError("");
    try {
      const result = await resetPrice({
        modelName: target.model_name,
      }).unwrap();
      onDone?.(
        (result?.action === "deleted"
          ? "Custom-only price removed."
          : "Price reset to the imported default.") +
          " Restart the pylons to apply the change to cost estimation.",
      );
      onClose();
    } catch (err) {
      setError(
        err?.data?.error ??
          err?.data?.message ??
          err?.error ??
          "Failed to reset price.",
      );
    }
  }, [target, resetPrice, onDone, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reset price</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <DialogContentText>
          Reset the custom price for <strong>{target?.model_name}</strong> back
          to the imported default? If this model was never imported, the row is
          removed.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleReset}
          variant="contained"
          color="warning"
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ResetPriceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  target: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onDone: PropTypes.func,
};

export default ResetPriceDialog;
