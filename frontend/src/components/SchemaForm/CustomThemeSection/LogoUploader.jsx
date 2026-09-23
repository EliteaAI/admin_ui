import { memo, useCallback, useRef, useState } from 'react';

import PropTypes from 'prop-types';

import { DeleteOutline as DeleteOutlineIcon, ImageOutlined as ImageOutlinedIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';

import { LOGO_ALLOWED_TYPES, LOGO_MAX_SIZE_BYTES, LOGO_MAX_SIZE_LABEL } from './constants';

const LogoUploader = memo(props => {
  const { logoUrl, onUpload, onDelete, onError, isUploading, isDeleting } = props;
  const [dragOver, setDragOver] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const prevLogoUrlRef = useRef(logoUrl);

  // Reset preview error when logoUrl changes (new upload)
  if (logoUrl !== prevLogoUrlRef.current) {
    prevLogoUrlRef.current = logoUrl;
    if (logoUrl && previewError) {
      setPreviewError(false);
    }
  }

  const handleFileSelect = useCallback(
    file => {
      if (!file) return;

      if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
        onError('Invalid file type. Only PNG and SVG are allowed.');
        return;
      }

      if (file.size > LOGO_MAX_SIZE_BYTES) {
        onError(`File too large. Maximum size is ${LOGO_MAX_SIZE_LABEL}.`);
        return;
      }

      onUpload(file);
      setPreviewError(false);
    },
    [onUpload, onError],
  );

  const handleInputChange = useCallback(
    event => {
      const file = event.target.files?.[0];
      handleFileSelect(file);
      // Reset input so same file can be selected again
      event.target.value = '';
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    event => {
      event.preventDefault();
      setDragOver(false);

      const file = event.dataTransfer.files?.[0];
      handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback(event => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(event => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageError = useCallback(() => {
    setPreviewError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setPreviewError(false);
  }, []);

  const handleDeleteClick = useCallback(event => {
    event.stopPropagation();
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setDeleteDialogOpen(false);
    onDelete();
  }, [onDelete]);

  const hasLogo = logoUrl && !previewError;

  return (
    <Box sx={styles.root}>
      <Typography
        variant="caption"
        sx={styles.hint}
      >
        Upload a custom logo to replace the default Elitea logo in the sidebar, chat header, and favicon.
        Recommended: SVG or PNG with transparent background.
      </Typography>

      <input
        ref={fileInputRef}
        type="file"
        accept={LOGO_ALLOWED_TYPES.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {hasLogo ? (
        <Box sx={styles.logoSection}>
          <Box
            sx={styles.previewContainer}
            onClick={handleUploadClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploading ? (
              <CircularProgress size={32} />
            ) : (
              <img
                src={logoUrl}
                alt="Custom logo preview"
                style={styles.previewImage}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}
          </Box>

          <Button
            variant="outlined"
            color="error"
            startIcon={
              isDeleting ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <DeleteOutlineIcon />
              )
            }
            onClick={handleDeleteClick}
            disabled={isDeleting}
            sx={styles.deleteButton}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      ) : (
        <Box
          sx={[styles.dropZone, dragOver && styles.dropZoneActive]}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleUploadClick}
        >
          {isUploading ? (
            <CircularProgress size={32} />
          ) : (
            <>
              <ImageOutlinedIcon sx={styles.dropIcon} />
              <Typography
                variant="body2"
                sx={styles.dropText}
              >
                Drag and drop an image here, or click to browse
              </Typography>
              <Typography
                variant="caption"
                sx={styles.dropHint}
              >
                PNG, SVG • Max {LOGO_MAX_SIZE_LABEL}
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Logo</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete the logo?</DialogContentText>
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

LogoUploader.displayName = 'LogoUploader';

LogoUploader.propTypes = {
  logoUrl: PropTypes.string,
  onUpload: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  isDeleting: PropTypes.bool,
};

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  hint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    textAlign: 'center',
  }),
  dropZone: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2rem',
    border: `2px dashed ${palette.border.table}`,
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: palette.primary.main,
      backgroundColor: palette.action?.hover || 'transparent',
    },
  }),
  dropZoneActive: ({ palette }) => ({
    borderColor: palette.primary.main,
    backgroundColor: palette.primary.main + '1a',
  }),
  dropIcon: ({ palette }) => ({
    fontSize: '2.5rem',
    color: palette.text.secondary,
  }),
  dropText: ({ palette }) => ({
    color: palette.text.primary,
    textAlign: 'center',
  }),
  dropHint: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
  }),
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  previewContainer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '10rem',
    height: '10rem',
    border: `1px solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    backgroundColor: palette.background.secondary,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: palette.primary.main,
    },
  }),
  previewImage: {
    maxWidth: '80%',
    maxHeight: '80%',
    objectFit: 'contain',
  },
  deleteButton: {
    height: '2.25rem',
    fontSize: '0.875rem',
  },
};

export default LogoUploader;
