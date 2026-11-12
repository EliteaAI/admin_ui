import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Alert, Box, Button, IconButton, Skeleton, TextField, Tooltip, Typography } from '@mui/material';

import {
  useEvalAutoDatasetQuery,
  useEvalAutoDatasetResyncMutation,
  useEvalAutoDatasetUpdateMutation,
} from '@/api/evalAuto.api';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import {
  MAX_PROBES,
  MAX_PROBE_LENGTH,
  cleanProbes,
  probesChanged,
  resyncMessage,
} from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

/** The probes agents without a dataset of their own are run on, and the resync of their copies. */
const DefaultDatasetSection = memo(() => {
  const styles = defaultDatasetSectionStyles();

  const { hasPermission } = useCheckPermission();
  const canEdit = hasPermission(PERMISSIONS.evalAuto.edit);

  const { data, isLoading, isError } = useEvalAutoDatasetQuery();
  const [update, { isLoading: isSaving }] = useEvalAutoDatasetUpdateMutation();
  const [resync, { isLoading: isResyncing }] = useEvalAutoDatasetResyncMutation();

  const saved = useMemo(() => data?.probes ?? [], [data]);
  const [probes, setProbes] = useState(saved);
  const [notice, setNotice] = useState(null);

  useEffect(() => setProbes(saved), [saved]);

  const isDirty = probesChanged(saved, probes);
  const isEmpty = cleanProbes(probes).length === 0;

  const setProbe = useCallback(
    (index, value) => setProbes(prev => prev.map((text, at) => (at === index ? value : text))),
    [],
  );
  const removeProbe = useCallback(index => setProbes(prev => prev.filter((_, at) => at !== index)), []);
  const addProbe = useCallback(() => setProbes(prev => [...prev, '']), []);

  const handleSave = useCallback(async () => {
    try {
      await update(cleanProbes(probes)).unwrap();
      setNotice({
        severity: 'success',
        message: 'Probes saved. Agents keep their current copy until you resync.',
      });
    } catch (err) {
      setNotice({ severity: 'error', message: err?.data?.error ?? 'Failed to save the probes.' });
    }
  }, [update, probes]);

  const handleResync = useCallback(async () => {
    try {
      const result = await resync().unwrap();
      setNotice({
        severity: result.failures?.length ? 'warning' : 'success',
        message: resyncMessage(result),
      });
    } catch (err) {
      setNotice({ severity: 'error', message: err?.data?.error ?? 'Failed to resync the agent copies.' });
    }
  }, [resync]);

  return (
    <Box
      sx={styles.root}
      data-testid="eval-auto-default-dataset"
    >
      <Typography variant="headingSmall">Default dataset</Typography>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Agents with no evaluation dataset of their own, in a project without a default dataset, are run on
        these probes plus their first conversation starters. Each agent gets its own copy on its first run.
      </Typography>

      {isLoading && (
        <Skeleton
          variant="rectangular"
          height="8rem"
        />
      )}
      {isError && (
        <Typography
          variant="bodyMedium"
          color="error"
        >
          Failed to load the default dataset.
        </Typography>
      )}

      {data &&
        probes.map((text, index) => (
          <Box
            key={index}
            sx={styles.probe}
          >
            <TextField
              size="small"
              fullWidth
              multiline
              maxRows={4}
              label={`Probe ${index + 1}`}
              value={text}
              disabled={!canEdit}
              onChange={event => setProbe(index, event.target.value)}
              slotProps={{
                htmlInput: { maxLength: MAX_PROBE_LENGTH, 'data-testid': `eval-auto-probe-${index}` },
              }}
            />
            {canEdit && (
              <Tooltip title="Remove">
                <IconButton
                  aria-label="Remove"
                  onClick={() => removeProbe(index)}
                  data-testid={`eval-auto-probe-remove-${index}`}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))}

      {notice && (
        <Alert
          severity={notice.severity}
          onClose={() => setNotice(null)}
          data-testid="eval-auto-dataset-notice"
        >
          {notice.message}
        </Alert>
      )}

      {data && canEdit && (
        <Box sx={styles.actions}>
          <Button
            variant="text"
            disabled={probes.length >= MAX_PROBES}
            onClick={addProbe}
            data-testid="eval-auto-probe-add"
          >
            Add probe
          </Button>
          <Box sx={styles.spacer} />
          <Button
            variant="text"
            disabled={!isDirty || isSaving}
            onClick={() => setProbes(saved)}
            data-testid="eval-auto-probes-reset"
          >
            Discard
          </Button>
          <Button
            variant="outlined"
            disabled={isDirty || isResyncing}
            onClick={handleResync}
            data-testid="eval-auto-probes-resync"
          >
            Resync agents
          </Button>
          <Button
            variant="contained"
            disabled={!isDirty || isEmpty || isSaving}
            onClick={handleSave}
            data-testid="eval-auto-probes-save"
          >
            Save probes
          </Button>
        </Box>
      )}
    </Box>
  );
});

DefaultDatasetSection.displayName = 'DefaultDatasetSection';

/** @type {MuiSx} */
const defaultDatasetSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '2rem',
  },
  probe: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  spacer: {
    flex: 1,
  },
});

export default DefaultDatasetSection;
