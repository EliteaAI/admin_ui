import { memo, useCallback, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Typography,
} from '@mui/material';

import { useSecurityAuditSummaryQuery } from '@/api/governance.api';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/OverviewTab/components/GovernanceErrorAlert';
import { toGovernanceError } from '@/pages/GovernancePage/components/OverviewTab/helpers/governance.helpers';
import {
  fillPlaceholders,
  modeLabel,
  summarizeWouldDeny,
} from '@/pages/GovernancePage/components/OverviewTab/helpers/governanceSettings.helpers';

const SUMMARY_HOURS = 24;

/**
 * Confirms a change of mode. Before enforce it shows what audit-only recorded in the last 24 hours, because
 * those runs will start being refused.
 */
const SwitchModeDialog = memo(props => {
  const { open, targetMode, descriptions, changeNote, onClose, onConfirm } = props;

  const styles = switchModeDialogStyles();

  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEnforce = targetMode === 'enforce';

  const {
    data: summary,
    isFetching: isSummaryLoading,
    isError: isSummaryError,
  } = useSecurityAuditSummaryQuery(
    { since_hours: SUMMARY_HOURS, would_deny: true },
    { skip: !open || !isEnforce, refetchOnMountOrArgChange: true },
  );

  const { total, reasons } = useMemo(() => summarizeWouldDeny(summary), [summary]);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    setError(null);
    onClose();
  }, [isSaving, onClose]);

  const handleConfirm = useCallback(async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(toGovernanceError(err, 'Failed to save governance settings.'));
    } finally {
      setIsSaving(false);
    }
  }, [onConfirm]);

  const label = modeLabel(descriptions, targetMode);
  const title = fillPlaceholders(descriptions.switch_dialog.title, { Mode: label });

  // Only enforce and off have a text of their own; audit-only is described by its mode text
  const body = isEnforce
    ? fillPlaceholders(descriptions.switch_dialog.enforce, { n: String(total) })
    : (descriptions.switch_dialog[targetMode] ?? descriptions.modes[targetMode]?.tooltip);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="governance-switch-dialog"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          <GovernanceErrorAlert error={error} />

          {isEnforce && isSummaryLoading && (
            <Skeleton
              variant="rectangular"
              height="2.5rem"
            />
          )}
          {isEnforce && isSummaryError && (
            <Typography
              variant="bodyMedium"
              sx={styles.muted}
            >
              The audit-only summary could not be loaded.
            </Typography>
          )}
          {(!isEnforce || (!isSummaryLoading && !isSummaryError)) && (
            <Typography
              variant="bodyMedium"
              data-testid="governance-switch-body"
            >
              {body}
            </Typography>
          )}

          {isEnforce && reasons.length > 0 && (
            <Box
              sx={styles.reasons}
              data-testid="governance-switch-reasons"
            >
              {reasons.map(item => (
                <Box
                  key={item.reason}
                  sx={styles.reason}
                >
                  <Typography variant="bodySmall">{item.reason}</Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.muted}
                  >
                    {item.count}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box>
            <Typography
              variant="labelSmall"
              component="div"
              sx={styles.muted}
            >
              Change note
            </Typography>
            <Typography
              variant="bodyMedium"
              sx={styles.note}
            >
              {changeNote}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isSaving || !changeNote?.trim()}
          data-testid="governance-switch-confirm"
        >
          Switch to {label}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

SwitchModeDialog.displayName = 'SwitchModeDialog';

/** @type {MuiSx} */
const switchModeDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  note: {
    wordBreak: 'break-word',
  },
  reasons: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
  }),
  reason: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
  },
});

export default SwitchModeDialog;
