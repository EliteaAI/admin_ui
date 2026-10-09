import { memo, useCallback, useMemo, useState } from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Alert, Box, FormControl, MenuItem, Select, Switch, Tooltip, Typography } from '@mui/material';

import { useAutoRoutingSettingsQuery, useAutoRoutingSettingsSaveMutation } from '@/api/autoRouting.api';

const NOT_SET = '';
const CLASSIFIER_TOOLTIP = (
  <>
    Fallback classifier for projects that have neither chosen a classifier nor set a Low-tier model in AI
    Providers. <strong>Pick a low-tier model</strong> (Haiku, Luna, Gemini Flash, mini/nano): the classifier
    runs on every Auto request and only chooses the answering model, so a larger model adds cost and latency
    without improving answers.
  </>
);

const classifierKey = ({ project_id: projectId, name }) => `${projectId}/${name}`;

const AutoRoutingSettings = memo(() => {
  const { data, error: readError, isFetching } = useAutoRoutingSettingsQuery();
  const [save, { isLoading }] = useAutoRoutingSettingsSaveMutation();
  const [error, setError] = useState('');
  const change = useCallback(
    async (key, value) => {
      setError('');
      try {
        await save({
          available: data.available,
          project_default: data.project_default,
          classifier: data.classifier ?? null,
          [key]: value,
        }).unwrap();
      } catch (failure) {
        setError(failure?.data?.error || 'Unable to update Auto model selection');
      }
    },
    [save, data],
  );

  // A saved classifier that is no longer offered stays visible (marked unavailable) instead of being dropped
  const classifier = data?.classifier ?? null;
  const classifierOptions = data?.classifier_options;
  const isClassifierUnavailable =
    Boolean(classifier) &&
    !(classifierOptions ?? []).some(option => classifierKey(option) === classifierKey(classifier));
  const classifierItems = useMemo(() => {
    const items = (classifierOptions ?? []).map(({ name, project_id, display_name }) => ({
      name,
      project_id,
      display_name: display_name || name,
    }));
    if (isClassifierUnavailable)
      items.push({ ...classifier, display_name: `${classifier.name} (unavailable)`, unavailable: true });
    return new Map(items.map(item => [classifierKey(item), item]));
  }, [classifierOptions, classifier, isClassifierUnavailable]);

  const handleAvailableChange = useCallback((_, value) => change('available', value), [change]);

  const handleProjectDefaultChange = useCallback((_, value) => change('project_default', value), [change]);

  const handleClassifierChange = useCallback(
    event => {
      const item = classifierItems.get(event.target.value);
      change('classifier', item ? { name: item.name, project_id: item.project_id } : null);
    },
    [change, classifierItems],
  );

  const renderClassifierValue = useCallback(
    key => (
      <Typography
        variant="body2"
        noWrap
      >
        {classifierItems.get(key)?.display_name || 'Not set'}
      </Typography>
    ),
    [classifierItems],
  );

  const styles = autoRoutingSettingsStyles();

  if (readError)
    return (
      <Alert severity="error">Administration admin access is required to manage Auto model selection.</Alert>
    );
  return (
    <Box sx={styles.root}>
      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography
              variant="body2"
              sx={styles.toggleTitle}
            >
              Make Auto available on this platform
            </Typography>
            <Typography
              variant="caption"
              sx={styles.toggleHint}
            >
              Allow Auto model selection in chats and standard agents. Pipeline model selectors continue to
              use explicitly selected models.
            </Typography>
          </Box>
          <Switch
            checked={data?.available === true}
            disabled={!data?.can_manage || isFetching || isLoading}
            onChange={handleAvailableChange}
            inputProps={{ 'aria-label': 'Make Auto available on this platform' }}
          />
        </Box>
      </Box>

      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography
              variant="body2"
              sx={styles.toggleTitle}
            >
              Enable Auto by default for projects
            </Typography>
            <Typography
              variant="caption"
              sx={styles.toggleHint}
            >
              Use Auto as the project default. Projects can override this setting.
            </Typography>
          </Box>
          <Switch
            checked={data?.project_default === true}
            disabled={!data?.can_manage || !data?.available || isFetching || isLoading}
            onChange={handleProjectDefaultChange}
            inputProps={{ 'aria-label': 'Enable Auto by default for projects' }}
          />
        </Box>
      </Box>

      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Box sx={styles.titleRow}>
              <Typography
                variant="body2"
                sx={styles.toggleTitle}
              >
                Fallback classifier
              </Typography>
              <Tooltip
                title={CLASSIFIER_TOOLTIP}
                arrow
                placement="top"
              >
                <InfoOutlinedIcon
                  sx={styles.infoIcon}
                  aria-label="About the fallback classifier"
                />
              </Tooltip>
            </Box>
            <Typography
              variant="caption"
              sx={styles.toggleHint}
            >
              Used by projects that have neither chosen a classifier nor set a Low-tier model in AI Providers.
            </Typography>
            {isClassifierUnavailable && (
              <Typography
                variant="caption"
                sx={styles.warningHint}
              >
                The saved classifier {classifier.name} is no longer available. Choose a replacement.
              </Typography>
            )}
            {classifierItems.size === 0 && (
              <Typography
                variant="caption"
                sx={styles.toggleHint}
              >
                No models are available to choose from.
              </Typography>
            )}
          </Box>
          <FormControl
            size="small"
            sx={styles.classifierSelect}
          >
            <Select
              value={classifier ? classifierKey(classifier) : NOT_SET}
              disabled={!data?.can_manage || !data?.available || isFetching || isLoading}
              onChange={handleClassifierChange}
              displayEmpty
              renderValue={renderClassifierValue}
              inputProps={{ 'aria-label': 'Fallback classifier' }}
            >
              <MenuItem value={NOT_SET}>
                <Typography variant="body2">Not set</Typography>
              </MenuItem>
              {[...classifierItems].map(([key, item]) => (
                <MenuItem
                  key={key}
                  value={key}
                >
                  <Box sx={styles.classifierOption}>
                    <Typography variant="body2">{item.display_name}</Typography>
                    {!item.unavailable && item.display_name !== item.name && (
                      <Typography
                        variant="caption"
                        sx={styles.toggleHint}
                      >
                        {item.name}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Typography
        variant="body2"
        sx={styles.description}
      >
        Turning off platform availability blocks new Auto requests in all projects. Requests already in
        progress can finish, and existing model selections are retained.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
});

AutoRoutingSettings.displayName = 'AutoRoutingSettings';

/** @type {MuiSx} */
const autoRoutingSettingsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  }),
  toggleCard: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  toggleRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
  }),
  toggleLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  toggleTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  toggleHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
  warningHint: ({ palette }) => ({
    color: palette.warning.main,
    fontSize: '0.75rem',
  }),
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  infoIcon: ({ palette }) => ({
    fontSize: '0.875rem',
    color: palette.text.secondary,
    cursor: 'help',
  }),
  classifierSelect: {
    flexShrink: 0,
    width: '16rem',
    '& .MuiInputBase-root': {
      fontSize: '0.875rem',
    },
  },
  classifierOption: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
});

export default AutoRoutingSettings;
