import { memo, useCallback, useState } from "react";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const RejectRequestDialog = memo(function RejectRequestDialog({
  open,
  onClose,
  onSubmit,
  request,
}) {
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(() => {
    if (!comments.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }
    onSubmit(request?.id, comments.trim());
    setComments("");
    setError("");
  }, [comments, onSubmit, request]);

  const handleClose = useCallback(() => {
    setComments("");
    setError("");
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reject Request</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Rejection reason"
          placeholder="Explain why the request is rejected and what is missing or needs to be corrected"
          multiline
          rows={4}
          fullWidth
          value={comments}
          onChange={(e) => {
            setComments(e.target.value);
            if (error) setError("");
          }}
          error={!!error}
          helperText={error}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="error">
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default RejectRequestDialog;
