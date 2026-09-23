import { memo, useCallback, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';

import { downloadProjectBackup } from '@/api/projectBackup.api';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';

const formatSize = bytes => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const BackupProjectDialog = memo(props => {
  const { open, onClose, project } = props;

  const styles = backupProjectDialogStyles();

  const { hasPermission } = useCheckPermission();

  const [fullMode, setFullMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canFull = useMemo(() => hasPermission(PERMISSIONS.projects.backup.full), [hasPermission]);

  const reset = useCallback(() => {
    setFullMode(false);
    setIsLoading(false);
    setError('');
    setSuccess('');
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    reset();
    onClose();
  }, [isLoading, reset, onClose]);

  const handleDownload = useCallback(async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const result = await downloadProjectBackup({
        projectId: project?.id,
        mode: fullMode && canFull ? 'full' : 'safe',
      });
      setSuccess(`Downloaded ${result.filename} (${formatSize(result.size)}).`);
    } catch (err) {
      setError(err?.message ?? 'Failed to download backup.');
    } finally {
      setIsLoading(false);
    }
  }, [project, fullMode, canFull]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Backup Project</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={styles.gapBelow}
        >
          Download a copy of project <strong>{project?.name}</strong> (schema <code>p_{project?.id}</code>) as
          a backup file or restore it from a previously downloaded backup. The backup includes agents,
          pipelines, toolkits, MCP servers and skills. Credentials, tokens and other secrets will be excluded
          from this backup file and cannot be restored.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={styles.gapBelow}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={styles.gapBelow}
          >
            {success}
          </Alert>
        )}

        {!fullMode && (
          <Alert
            severity="info"
            sx={styles.gapBelow}
          >
            Safe mode: data only (INSERT statements), no DDL. Tokens, traces and conversation context are
            skipped, and credential-bearing columns and JSON keys are redacted. Vault references{' '}
            <code>{'{{secret.NAME}}'}</code> are kept, but the secret values are excluded from the backup.
          </Alert>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={fullMode}
              onChange={e => setFullMode(e.target.checked)}
              disabled={isLoading || !canFull}
            />
          }
          label="Full backup (raw pg_dump of the whole schema)"
        />

        {!canFull && (
          <Typography
            variant="caption"
            color="text.metrics"
            sx={styles.hint}
          >
            Full backup requires the <code>projects.projects.backup.full</code> permission.
          </Typography>
        )}

        {fullMode && (
          <Alert
            severity="warning"
            sx={styles.gapAboveAndBelow}
          >
            The full backup is a plain <code>pg_dump</code> of the schema as-is: It includes DDL and all
            stored values, with all plaintext credentials, no redaction. Handle and store the file as a
            secret.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          onClick={handleClose}
          variant="text"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          color={fullMode ? 'warning' : 'primary'}
          disabled={isLoading || !project?.id}
        >
          {isLoading ? 'Preparing...' : 'Download'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

BackupProjectDialog.displayName = 'BackupProjectDialog';

BackupProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

/** @type {MuiSx} */
const backupProjectDialogStyles = () => ({
  hint: {
    display: 'block',
    marginBottom: '0.5rem',
  },
  gapBelow: {
    marginBottom: '1rem',
  },
  gapAboveAndBelow: {
    marginTop: '0.5rem',
    marginBottom: '1rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default BackupProjectDialog;
