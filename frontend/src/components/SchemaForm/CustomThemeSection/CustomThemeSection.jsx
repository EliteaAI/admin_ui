import { memo, useCallback, useEffect, useState } from 'react';

import {
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  ImageOutlined,
  SaveOutlined as SaveOutlinedIcon,
} from '@mui/icons-material';
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
} from '@mui/material';

import {
  useCustomThemeAdminQuery,
  useCustomThemeDeleteMutation,
  useCustomThemeLogoDeleteMutation,
  useCustomThemeLogoUploadMutation,
  useCustomThemeSaveMutation,
} from '@/api/customThemeApi';
import CollapsibleSection from '@/components/CollapsibleSection';
import { setNestedValue, unsetNestedValue } from '@/utils/nestedValue';

import ColorCategoryGroup from './ColorCategoryGroup';
import ImportExportButtons from './ImportExportButtons';
import LogoUploader from './LogoUploader';
import { COLOR_CATEGORIES, PALETTE_MODES } from './constants';

const CustomThemeSection = memo(() => {
  // API hooks
  // Mutations invalidate the CustomTheme tag, so the query refetches on its own
  const { data: themeData, isLoading, error: loadError } = useCustomThemeAdminQuery();

  const [saveTheme, { isLoading: isSaving }] = useCustomThemeSaveMutation();
  const [deleteTheme, { isLoading: isDeleting }] = useCustomThemeDeleteMutation();
  const [uploadLogo, { isLoading: isUploading }] = useCustomThemeLogoUploadMutation();
  const [deleteLogo, { isLoading: isDeletingLogo }] = useCustomThemeLogoDeleteMutation();

  // Local state
  const [mode, setMode] = useState('dark');
  const [palette, setPalette] = useState({});
  const [logoUrl, setLogoUrl] = useState(null); // Actual URL for saving
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null); // Preview URL for display
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ logo: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const toggleSection = useCallback(sectionId => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // Determine if theme exists
  const themeExists = Boolean(themeData?.exists && themeData?.theme);

  // Sync local state from server data
  useEffect(() => {
    if (themeData?.theme) {
      setMode(themeData.theme.mode || 'dark');
      setPalette(themeData.theme.palette || {});
      // logo_url is the public static URL - works for both preview and storage
      setLogoUrl(themeData.theme.logo_url || null);
      setLogoPreviewUrl(themeData.theme.logo_url || null);
      setHasChanges(false);
    }
  }, [themeData]);

  // Handlers
  const handleModeChange = useCallback(event => {
    setMode(event.target.value);
    setHasChanges(true);
  }, []);

  const showError = useCallback(message => {
    setSnackbar({ open: true, message, severity: 'error' });
  }, []);

  const handleColorChange = useCallback((colorKey, value) => {
    // An empty field means the token is unset, storing "" would hand the
    // consuming theme a color string it cannot parse
    setPalette(prev =>
      value === '' ? unsetNestedValue(prev, colorKey) : setNestedValue(prev, colorKey, value),
    );
    setHasChanges(true);
  }, []);

  const handleImport = useCallback(
    json => {
      const isPaletteObject = json !== null && typeof json === 'object' && !Array.isArray(json);

      if (!isPaletteObject) {
        showError('Invalid palette file: expected a JSON object');
        return;
      }

      if (PALETTE_MODES.some(option => option.value === json.mode)) {
        setMode(json.mode);
      }

      // Remove mode and logo_url from palette data (logo must be uploaded separately)
      const paletteData = { ...json };
      delete paletteData.mode;
      delete paletteData.logo_url;
      setPalette(paletteData);
      setHasChanges(true);

      setSnackbar({
        open: true,
        message: 'Palette imported successfully',
        severity: 'success',
      });
    },
    [showError],
  );

  const handleLogoUpload = useCallback(
    async file => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadLogo(formData).unwrap();
        // Update logo URL - same URL works for both preview and storage
        // No refetch needed, preserves any unsaved palette changes
        setLogoPreviewUrl(result.logo_url);
        setLogoUrl(result.logo_url);
        setHasChanges(true);

        setSnackbar({
          open: true,
          message: 'Logo uploaded successfully',
          severity: 'success',
        });
      } catch (err) {
        console.error('Logo upload error:', err);
        showError(err?.data?.error || 'Failed to upload logo');
      }
    },
    [uploadLogo, showError],
  );

  const handleLogoDelete = useCallback(async () => {
    try {
      await deleteLogo().unwrap();
      setLogoUrl(null);
      setLogoPreviewUrl(null);
      setHasChanges(true);

      setSnackbar({
        open: true,
        message: 'Logo deleted successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Logo delete error:', err);
      showError(err?.data?.error || 'Failed to delete logo');
    }
  }, [deleteLogo, showError]);

  const handleSave = useCallback(async () => {
    try {
      await saveTheme({
        mode,
        palette,
        logo_url: logoUrl,
      }).unwrap();

      setHasChanges(false);

      setSnackbar({
        open: true,
        message: 'Theme saved successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Save error:', err);
      showError(err?.data?.error || 'Failed to save theme');
    }
  }, [mode, palette, logoUrl, saveTheme, showError]);

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
      setMode('dark');
      setPalette({});
      setLogoUrl(null);
      setLogoPreviewUrl(null);
      setHasChanges(false);

      setSnackbar({
        open: true,
        message: 'Theme deleted successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Delete error:', err);
      showError(err?.data?.error || 'Failed to delete theme');
    }
  }, [deleteTheme, showError]);

  const handleCreate = useCallback(() => {
    // Initialize with empty palette - user will fill in colors
    setPalette({});
    setMode('dark');
    setLogoUrl(null);
    setLogoPreviewUrl(null);
    setHasChanges(true);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
          Failed to load custom theme configuration. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  // No theme exists and no changes - show create button
  if (!themeExists && !hasChanges) {
    return (
      <Box sx={styles.root}>
        <Box sx={styles.emptyState}>
          <Typography
            variant="body1"
            sx={styles.emptyTitle}
          >
            No Custom Theme Configured
          </Typography>
          <Typography
            variant="body2"
            sx={styles.emptyDescription}
          >
            Create a custom theme to personalize the platform appearance with your brand colors and logo.
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
      <Typography
        variant="body2"
        sx={styles.description}
      >
        Customize the platform appearance with your brand colors and logo. All changes are applied to users
        when they select &quot;Custom&quot; theme mode in their preferences.
      </Typography>

      {/* Actions bar */}
      <Box sx={styles.actionsBar}>
        <Box sx={styles.actionsLeft}>
          <FormControl sx={styles.modeSelect}>
            <InputLabel>Base Mode</InputLabel>
            <Select
              value={mode}
              onChange={handleModeChange}
              label="Base Mode"
            >
              {PALETTE_MODES.map(option => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ImportExportButtons
            palette={palette}
            mode={mode}
            onImport={handleImport}
            onError={showError}
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
              {isDeleting ? 'Deleting...' : 'Delete Theme'}
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            onClick={handleSave}
            disabled={isSaving || (!hasChanges && themeExists)}
            sx={styles.actionButton}
          >
            {isSaving ? 'Saving...' : themeExists ? 'Save Changes' : 'Create Theme'}
          </Button>
        </Box>
      </Box>

      {/* Logo uploader */}
      <CollapsibleSection
        icon={ImageOutlined}
        title="Platform Logo"
        count={1}
        expanded={expandedSections.logo}
        onToggle={() => toggleSection('logo')}
      >
        <LogoUploader
          logoUrl={logoPreviewUrl}
          onUpload={handleLogoUpload}
          onDelete={handleLogoDelete}
          onError={showError}
          isUploading={isUploading}
          isDeleting={isDeletingLogo}
        />
      </CollapsibleSection>

      {/* Color categories */}
      {COLOR_CATEGORIES.map(category => (
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
            Are you sure you want to delete the custom theme? This will remove all colors and the logo.
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
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

CustomThemeSection.displayName = 'CustomThemeSection';

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '3rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
    marginBottom: '0.5rem',
  }),
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '3rem',
    textAlign: 'center',
  },
  emptyTitle: {
    fontWeight: 600,
  },
  emptyDescription: ({ palette }) => ({
    color: palette.text.secondary,
    maxWidth: '24rem',
  }),
  actionsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  actionsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  actionsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  modeSelect: {
    minWidth: '8rem',
    '& .MuiInputBase-root': {
      height: '2.25rem',
      fontSize: '0.875rem',
    },
  },
  actionButton: {
    height: '2.25rem',
    fontSize: '0.875rem',
  },
};

export default CustomThemeSection;
