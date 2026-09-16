import { memo, useCallback, useRef } from "react";
import { Box, Button } from "@mui/material";
import { FileUploadOutlined, FileDownloadOutlined } from "@mui/icons-material";
import PropTypes from "prop-types";

const ImportExportButtons = memo((props) => {
  const { palette, mode, onImport, disabled } = props;
  const fileInputRef = useRef(null);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          onImport(json);
        } catch (error) {
          alert("Invalid JSON file. Please check the file format.");
          console.error("JSON parse error:", error);
        }
      };
      reader.onerror = () => {
        alert("Failed to read file.");
      };
      reader.readAsText(file);

      // Reset input so same file can be selected again
      event.target.value = "";
    },
    [onImport],
  );

  const handleExport = useCallback(() => {
    if (!palette) {
      alert("No palette to export.");
      return;
    }

    const exportData = {
      mode: mode || "dark",
      ...palette,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `custom-theme-${mode || "dark"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [palette, mode]);

  return (
    <Box sx={styles.root}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <Button
        variant="outlined"
        startIcon={<FileDownloadOutlined />}
        onClick={handleImportClick}
        disabled={disabled}
        sx={styles.button}
      >
        Import JSON
      </Button>

      <Button
        variant="outlined"
        startIcon={<FileUploadOutlined />}
        onClick={handleExport}
        disabled={disabled || !palette}
        sx={styles.button}
      >
        Export JSON
      </Button>
    </Box>
  );
});

ImportExportButtons.displayName = "ImportExportButtons";

ImportExportButtons.propTypes = {
  palette: PropTypes.object,
  mode: PropTypes.string,
  onImport: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const styles = {
  root: {
    display: "flex",
    gap: "0.5rem",
  },
  button: {
    height: "2.25rem",
    fontSize: "0.875rem",
  },
};

export default ImportExportButtons;
