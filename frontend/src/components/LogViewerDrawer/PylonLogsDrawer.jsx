import { memo, useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useRuntimePylonLogsMutation } from "@/api/configurationApi";
import LogViewerDrawer from "./LogViewerDrawer";

const PylonLogsDrawer = memo((props) => {
  const { open, pylonId, onClose } = props;

  const [logs, setLogs] = useState("");
  const [fetchLogs, { isLoading }] = useRuntimePylonLogsMutation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Clear logs when drawer opens with a new pylon
  useEffect(() => {
    if (open) {
      setLogs("");
    }
  }, [open, pylonId]);

  const handleFetch = useCallback(async () => {
    try {
      const result = await fetchLogs({ pylonId }).unwrap();
      if (result.ok) {
        setLogs(result.logs || "");
      } else {
        setSnackbar({
          open: true,
          message: "Error during logs retrieval",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error during logs retrieval",
        severity: "error",
      });
      console.error(err);
    }
  }, [fetchLogs, pylonId]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <>
      <LogViewerDrawer
        open={open}
        onClose={onClose}
        title="Pylon Logs"
        subtitle={pylonId}
        logs={logs}
        loading={isLoading}
        placeholder='Click "Fetch" to load pylon logs.'
        downloadFilename={pylonId || "pylon-logs"}
        footerExtra={
          <Button
            size="small"
            variant="contained"
            onClick={handleFetch}
            disabled={isLoading}
            sx={styles.actionButton}
          >
            {isLoading ? "Fetching..." : "Fetch"}
          </Button>
        }
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
});

const styles = {
  actionButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
};

export default PylonLogsDrawer;
