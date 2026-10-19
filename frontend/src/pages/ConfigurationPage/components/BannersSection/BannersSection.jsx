import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography,
} from '@mui/material';

import {
  useBannerCreateMutation,
  useBannerDeleteMutation,
  useBannerListQuery,
  useBannerUpdateMutation,
} from '@/api/banners.api';

import BannerEditForm from './components/BannerEditForm';
import BannersTable from './components/BannersTable';
import { NEW_BANNER } from './constants/banners.constants';
import { getBlockedBanners } from './helpers/banners.helpers';

const getErrorMessage = err => err?.data?.error || err?.message || 'Unknown error';

const BannersSection = memo(props => {
  const { onDirtyChange } = props;

  const styles = bannersSectionStyles();

  const { data: banners = [], isFetching, isError } = useBannerListQuery();

  const [createBanner, { isLoading: creating }] = useBannerCreateMutation();
  const [updateBanner, { isLoading: updating }] = useBannerUpdateMutation();
  const [deleteBanner, { isLoading: deleting }] = useBannerDeleteMutation();

  const saving = creating || updating || deleting;

  const [editingBanner, setEditingBanner] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const { blocker, blocked } = useMemo(() => getBlockedBanners(banners), [banners]);

  // Lets the page guard section switches, not only "Back to list"
  useEffect(() => {
    onDirtyChange?.(isFormDirty);
  }, [isFormDirty, onDirtyChange]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleRowClick = useCallback(row => {
    setEditingBanner(structuredClone(row));
    setIsNew(false);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingBanner(structuredClone(NEW_BANNER));
    setIsNew(true);
  }, []);

  const handleBack = useCallback(() => {
    if (isFormDirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    setEditingBanner(null);
    setIsNew(false);
    setIsFormDirty(false);
  }, [isFormDirty]);

  const handleMove = useCallback(
    async (index, direction) => {
      const target = index + direction;
      if (target < 0 || target >= banners.length) return;

      // Re-number the whole list so legacy rows with equal sort_order get a stable order
      const reordered = [...banners];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      const changed = reordered
        .map((banner, position) => ({ banner, position }))
        .filter(({ banner, position }) => banner.sort_order !== position);

      setReordering(true);
      try {
        // Not atomic: the first failure stops the run, but rows saved before it stay saved, so the order can
        // end up partly applied. The list refetches after each update and shows what was stored.
        for (const { banner, position } of changed) {
          await updateBanner({ bannerId: banner.id, sort_order: position }).unwrap();
        }
      } catch (err) {
        showSnackbar(`Failed to reorder: ${getErrorMessage(err)}`, 'error');
      } finally {
        setReordering(false);
      }
    },
    [banners, updateBanner, showSnackbar],
  );

  const handleDeleteRequest = useCallback(row => {
    setDeleteTarget(row);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteBanner(deleteTarget.id).unwrap();
      setDeleteTarget(null);
      showSnackbar('Banner deleted');
    } catch (err) {
      showSnackbar(`Failed to delete: ${getErrorMessage(err)}`, 'error');
    }
  }, [deleteTarget, deleteBanner, showSnackbar]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleSave = useCallback(
    async bannerData => {
      const payload = {
        name: bannerData.name.trim(),
        message: bannerData.message,
        enabled: bannerData.enabled ?? false,
        dismissible: bannerData.dismissible ?? true,
        // A non-dismissible banner can't be closed, so there is nothing to remember
        persist_dismissal: (bannerData.dismissible ?? true) && (bannerData.persist_dismissal ?? true),
        placement: bannerData.placement || 'top',
        style: bannerData.style || 'info',
        icon: bannerData.icon || 'info',
      };

      try {
        if (isNew) {
          const result = await createBanner(payload).unwrap();
          setEditingBanner(structuredClone(result.result ?? result));
          setIsNew(false);
          showSnackbar('Banner created successfully');
        } else {
          const result = await updateBanner({ bannerId: editingBanner.id, ...payload }).unwrap();
          setEditingBanner(structuredClone(result.result ?? result));
          showSnackbar('Banner saved successfully');
        }
      } catch (err) {
        showSnackbar(`Failed to save: ${getErrorMessage(err)}`, 'error');
      }
    },
    [isNew, editingBanner, createBanner, updateBanner, showSnackbar],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={styles.root}>
      {editingBanner ? (
        <Box sx={styles.editContainer}>
          <Box sx={styles.editToolbar}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={styles.textButton}
            >
              Back to list
            </Button>
          </Box>
          <BannerEditForm
            banner={editingBanner}
            isNew={isNew}
            saving={saving}
            onSave={handleSave}
            onDirtyChange={setIsFormDirty}
          />
        </Box>
      ) : (
        <Box sx={styles.listContainer}>
          <Box sx={styles.listToolbar}>
            <Typography
              variant="body2"
              sx={styles.description}
            >
              Banners, including maintenance notices, are shown to users one at a time, in the order below.
              When a user closes a banner, the next enabled banner is shown. Changes reach open sessions the
              next time users return to the tab.
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={styles.addButton}
            >
              Add banner
            </Button>
          </Box>

          {blocker && blocked.length > 0 && (
            <Alert severity="warning">
              &quot;{blocker.name}&quot; is not dismissible, so these banners will never be shown:{' '}
              {blocked.map(banner => `"${banner.name}"`).join(', ')}.
            </Alert>
          )}

          {isError ? (
            <Box sx={styles.errorContainer}>
              <Typography
                variant="bodyMedium"
                color="error"
              >
                Failed to load banners.
              </Typography>
            </Box>
          ) : (
            <BannersTable
              banners={banners}
              isFetching={isFetching}
              reordering={reordering}
              onRowClick={handleRowClick}
              onMove={handleMove}
              onDelete={handleDeleteRequest}
            />
          )}
        </Box>
      )}

      <Dialog
        open={!!deleteTarget}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Banner</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={styles.dialogActions}>
          <Button
            onClick={handleDeleteCancel}
            variant="text"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

BannersSection.displayName = 'BannersSection';

/** @type {MuiSx} */
const bannersSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
  },
  listToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  }),
  addButton: {
    flexShrink: 0,
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  editContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  editToolbar: {
    padding: '0.75rem 1.5rem 0',
  },
  textButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default BannersSection;
