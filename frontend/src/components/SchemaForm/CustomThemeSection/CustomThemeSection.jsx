import { memo, useState, useCallback, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  ImageOutlined,
  SaveOutlined as SaveOutlinedIcon,
} from "@mui/icons-material";

import CollapsibleSection from "@/components/CollapsibleSection";
import ColorCategoryGroup from "./ColorCategoryGroup";
import LogoUploader from "./LogoUploader";
import ImportExportButtons from "./ImportExportButtons";
import { COLOR_CATEGORIES, PALETTE_MODES, setNestedValue } from "./constants";
import {
  useCustomThemeAdminQuery,
  useCustomThemeSaveMutation,
  useCustomThemeDeleteMutation,
  useCustomThemeLogoUploadMutation,
  useCustomThemeLogoDeleteMutation,
} from "@/api/customThemeApi";

const CustomThemeSection = memo(() => {
  // API hooks
  const {
    data: themeData,
    isLoading,
    error: loadError,
    refetch,
  } = useCustomThemeAdminQuery();

  const [saveTheme, { isLoading: isSaving }] = useCustomThemeSaveMutation();
  const [deleteTheme, { isLoading: isDeleting }] =
    useCustomThemeDeleteMutation();
  const [uploadLogo, { isLoading: isUploading }] =
    useCustomThemeLogoUploadMutation();
  const [deleteLogo, { isLoading: isDeletingLogo }] =
    useCustomThemeLogoDeleteMutation();

  // Local state
  const [mode, setMode] = useState("dark");
  const [palette, setPalette] = useState({});
  const [logoUrl, setLogoUrl] = useState(null); // Actual URL for saving
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null); // Preview URL for display
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ logo: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // Determine if theme exists
  const themeExists = themeData?.exists && themeData?.theme;

  // Sync local state from server data
  useEffect(() => {
    if (themeData?.theme) {
      setMode(themeData.theme.mode || "dark");
      setPalette(themeData.theme.palette || {});
      // logo_url is the public static URL - works for both preview and storage
      setLogoUrl(themeData.theme.logo_url || null);
      setLogoPreviewUrl(themeData.theme.logo_url || null);
      setHasChanges(false);
    }
  }, [themeData]);

  // Handlers
  const handleModeChange = useCallback((event) => {
    setMode(event.target.value);
    setHasChanges(true);
  }, []);

  const handleColorChange = useCallback((colorKey, value) => {
    setPalette((prev) => setNestedValue(prev, colorKey, value));
    setHasChanges(true);
  }, []);

  const handleImport = useCallback((json) => {
    if (json.mode) {
      setMode(json.mode);
    }

    // Remove mode and logo_url from palette data (logo must be uploaded separately)
    const { mode: _jsonMode, logo_url: _logoUrl, ...paletteData } = json;
    setPalette(paletteData);
    setHasChanges(true);

    setSnackbar({
      open: true,
      message: "Palette imported successfully",
      severity: "success",
    });
  }, []);

  const handleLogoUpload = useCallback(
    async (file) => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadLogo(formData).unwrap();
        // Update logo URL - same URL works for both preview and storage
        // No refetch needed, preserves any unsaved palette changes
        setLogoPreviewUrl(result.logo_url);
        setLogoUrl(result.logo_url);
        setHasChanges(true);

        setSnackbar({
          open: true,
          message: "Logo uploaded successfully",
          severity: "success",
        });
      } catch (err) {
        console.error("Logo upload error:", err);
        setSnackbar({
          open: true,
          message: err?.data?.error || "Failed to upload logo",
          severity: "error",
        });
      }
    },
    [uploadLogo],
  );

  const handleLogoDelete = useCallback(async () => {
    try {
      await deleteLogo().unwrap();
      setLogoUrl(null);
      setLogoPreviewUrl(null);
      setHasChanges(true);

      setSnackbar({
        open: true,
        message: "Logo deleted successfully",
        severity: "success",
      });
    } catch (err) {
      console.error("Logo delete error:", err);
      setSnackbar({
        open: true,
        message: err?.data?.error || "Failed to delete logo",
        severity: "error",
      });
    }
  }, [deleteLogo]);

  const handleSave = useCallback(async () => {
    try {
      await saveTheme({
        mode,
        palette,
        logo_url: logoUrl,
      }).unwrap();

      setHasChanges(false);
      refetch();

      setSnackbar({
        open: true,
        message: "Theme saved successfully",
        severity: "success",
      });
    } catch (err) {
      console.error("Save error:", err);
      setSnackbar({
        open: true,
        message: err?.data?.error || "Failed to save theme",
        severity: "error",
      });
    }
  }, [mode, palette, logoUrl, saveTheme, refetch]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteDialogOpen(false);

    try {
      await deleteTheme().unwrap();

      // Reset local state
      setMode("dark");
      setPalette({});
      setLogoUrl(null);
      setHasChanges(false);
      refetch();

      setSnackbar({
        open: true,
        message: "Theme deleted successfully",
        severity: "success",
      });
    } catch (err) {
      console.error("Delete error:", err);
      setSnackbar({
        open: true,
        message: err?.data?.error || "Failed to delete theme",
        severity: "error",
      });
    }
  }, [deleteTheme, refetch]);

  const handleCreate = useCallback(() => {
    // Initialize with empty palette - user will fill in colors
    setPalette({});
    setMode("dark");
    setHasChanges(true);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress />
        <Typography variant="body2">Loading theme configuration...</Typography>
      </Box>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Box sx={styles.root}>
        <Alert severity="error">
          Failed to load custom theme configuration. Please try refreshing the
          page.
        </Alert>
      </Box>
    );
  }

  // No theme exists and no changes - show create button
  if (!themeExists && !hasChanges) {
    return (
      <Box sx={styles.root}>
        <Box sx={styles.emptyState}>
          <Typography variant="body1" sx={styles.emptyTitle}>
            No Custom Theme Configured
          </Typography>
          <Typography variant="body2" sx={styles.emptyDescription}>
            Create a custom theme to personalize the platform appearance with
            your brand colors and logo.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create
          </Button>
        </Box>
      </Box>
    );
  }

  // Theme editor
  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Customize the platform appearance with your brand colors and logo. All
        changes are applied to users when they select "Custom" theme mode in
        their preferences.
      </Typography>

      {/* Actions bar */}
      <Box sx={styles.actionsBar}>
        <Box sx={styles.actionsLeft}>
          <FormControl sx={styles.modeSelect}>
            <InputLabel>Base Mode</InputLabel>
            <Select value={mode} onChange={handleModeChange} label="Base Mode">
              {PALETTE_MODES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ImportExportButtons
            palette={palette}
            mode={mode}
            onImport={handleImport}
            disabled={isSaving}
          />
        </Box>

        <Box sx={styles.actionsRight}>
          {themeExists && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDeleteClick}
              disabled={isDeleting || isSaving}
              sx={styles.actionButton}
            >
              {isDeleting ? "Deleting..." : "Delete Theme"}
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            onClick={handleSave}
            disabled={isSaving || (!hasChanges && themeExists)}
            sx={styles.actionButton}
          >
            {isSaving
              ? "Saving..."
              : themeExists
                ? "Save Changes"
                : "Create Theme"}
          </Button>
        </Box>
      </Box>

      {/* Logo uploader */}
      <CollapsibleSection
        icon={ImageOutlined}
        title="Platform Logo"
        count={1}
        expanded={expandedSections.logo}
        onToggle={() => toggleSection("logo")}
      >
        <LogoUploader
          logoUrl={logoPreviewUrl}
          onUpload={handleLogoUpload}
          onDelete={handleLogoDelete}
          isUploading={isUploading}
          isDeleting={isDeletingLogo}
        />
      </CollapsibleSection>

      {/* Color categories */}
      {COLOR_CATEGORIES.map((category) => (
        <ColorCategoryGroup
          key={category.id}
          category={category}
          palette={palette}
          onChange={handleColorChange}
          defaultExpanded={false}
        />
      ))}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Custom Theme</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the custom theme? This will remove
            all colors and the logo.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="text"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

CustomThemeSection.displayName = "CustomThemeSection";

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "3rem",
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.8125rem",
    lineHeight: 1.6,
    marginBottom: "0.5rem",
  }),
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "3rem",
    textAlign: "center",
  },
  emptyTitle: {
    fontWeight: 600,
  },
  emptyDescription: ({ palette }) => ({
    color: palette.text.secondary,
    maxWidth: "24rem",
  }),
  actionsBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
  },
  actionsLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  actionsRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  modeSelect: {
    minWidth: "8rem",
    "& .MuiInputBase-root": {
      height: "2.25rem",
      fontSize: "0.875rem",
    },
  },
  actionButton: {
    height: "2.25rem",
    fontSize: "0.875rem",
  },
};

export default CustomThemeSection;
