import { memo, useCallback, useState } from 'react';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

const ActionFieldCard = memo(props => {
  const { field, onAction } = props;

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleClick = useCallback(async () => {
    setRunning(true);
    setResult(null);
    try {
      await onAction?.(field);
      setResult({ ok: true, message: 'Task started' });
    } catch (err) {
      setResult({ ok: false, message: err?.message || 'Failed to start task' });
    } finally {
      setRunning(false);
    }
  }, [field, onAction]);

  const styles = actionFieldCardStyles();

  return (
    <Box sx={styles.fieldCard}>
      <Box sx={styles.fieldHeader}>
        <Box sx={styles.fieldTitleRow}>
          <Typography
            variant="body2"
            sx={styles.fieldTitle}
          >
            {field.title || field.key}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={
            running ? <CircularProgress size={14} /> : <PlayArrowIcon sx={{ fontSize: '0.875rem' }} />
          }
          onClick={handleClick}
          disabled={running}
          sx={styles.actionButton}
        >
          {running ? 'Running...' : 'Run'}
        </Button>
      </Box>
      {field.description && (
        <Typography
          variant="caption"
          sx={styles.fieldDescription}
        >
          {field.description}
        </Typography>
      )}
      {result && (
        <Typography
          variant="caption"
          sx={styles.result(result.ok)}
        >
          {result.message}
        </Typography>
      )}
    </Box>
  );
});

ActionFieldCard.displayName = 'ActionFieldCard';

/** @type {MuiSx} */
const actionFieldCardStyles = () => ({
  fieldCard: ({ palette }) => ({
    padding: '0.875rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  }),
  fieldHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    minHeight: '1.75rem',
  },
  fieldTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  fieldTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: '0.8125rem',
    color: palette.text.secondary,
  }),
  fieldDescription: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
    lineHeight: 1.5,
  }),
  actionButton: {
    textTransform: 'none',
    fontSize: '0.75rem',
  },
  result:
    ok =>
    ({ palette }) => ({
      color: ok ? palette.success.main : palette.error.main,
      marginTop: '0.125rem',
    }),
});

export default ActionFieldCard;
