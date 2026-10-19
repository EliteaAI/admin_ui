import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, Box, Button, MenuItem, Select, Switch, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import {
  ICON_OPTIONS,
  PLACEMENT_OPTIONS,
  STYLE_OPTIONS,
} from '@/pages/ConfigurationPage/components/BannersSection/constants/banners.constants';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';

const EDITOR_EXTENSIONS = [EditorView.lineWrapping];

/**
 * Self-contained banner edit form.
 * Manages its own local state and calls onSave(data) on submit.
 */
const BannerEditForm = memo(props => {
  const { banner, isNew, saving, onSave, onDirtyChange } = props;

  const styles = bannerEditFormStyles();

  const theme = useTheme();

  const [local, setLocal] = useState(() => structuredClone(banner));
  const serverRef = useRef(banner);

  // Sync when banner prop changes (e.g. after successful save)
  useEffect(() => {
    serverRef.current = banner;
    setLocal(structuredClone(banner));
  }, [banner]);

  const isDirty = useMemo(() => JSON.stringify(local) !== JSON.stringify(serverRef.current), [local]);
  const isValid = Boolean(local.name?.trim() && local.message?.trim());
  const dismissible = local.dismissible ?? true;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleField = useCallback((field, value) => {
    setLocal(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMessageChange = useCallback(value => handleField('message', value), [handleField]);

  const handleDiscard = useCallback(() => {
    setLocal(structuredClone(serverRef.current));
  }, []);

  const handleSaveClick = useCallback(() => {
    onSave(local);
  }, [local, onSave]);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.scrollArea}>
        <Box sx={styles.fields}>
          <Box sx={styles.card}>
            <Box sx={styles.cardBody}>
              <TextField
                size="small"
                label="Banner Name (internal)"
                value={local.name || ''}
                onChange={e => handleField('name', e.target.value)}
                fullWidth
                required
                sx={styles.textField}
              />
            </Box>
          </Box>

          <Box sx={styles.card}>
            <Box sx={styles.cardRow}>
              <Box sx={styles.cardLabel}>
                <Typography
                  variant="body2"
                  sx={styles.cardTitle}
                >
                  Banner Enabled
                </Typography>
                <Typography
                  variant="caption"
                  sx={styles.cardHint}
                >
                  When enabled, banner is displayed to all users environment-wide
                </Typography>
              </Box>
              <Switch
                checked={local.enabled ?? false}
                onChange={e => handleField('enabled', e.target.checked)}
              />
            </Box>
          </Box>

          <Box sx={styles.card}>
            <Box sx={styles.cardRow}>
              <Box sx={styles.cardLabel}>
                <Typography
                  variant="body2"
                  sx={styles.cardTitle}
                >
                  Dismissible
                </Typography>
                <Typography
                  variant="caption"
                  sx={styles.cardHint}
                >
                  When enabled, users can close the banner and the next banner in the list is shown. A
                  non-dismissible banner stays on screen and blocks the banners after it
                </Typography>
              </Box>
              <Switch
                checked={dismissible}
                onChange={e => handleField('dismissible', e.target.checked)}
              />
            </Box>
          </Box>

          <Box sx={styles.card}>
            <Box sx={styles.cardRow}>
              <Box sx={styles.cardLabel}>
                <Typography
                  variant="body2"
                  sx={styles.cardTitle}
                >
                  Remember Dismissal in Browser
                </Typography>
                <Typography
                  variant="caption"
                  sx={styles.cardHint}
                >
                  When enabled, a closed banner stays hidden until it is changed. When disabled, the banner
                  reappears on every page load / login
                </Typography>
              </Box>
              <Switch
                checked={dismissible && (local.persist_dismissal ?? true)}
                disabled={!dismissible}
                onChange={e => handleField('persist_dismissal', e.target.checked)}
              />
            </Box>
          </Box>

          <Box sx={styles.card}>
            <Box sx={styles.cardBody}>
              <Typography
                variant="body2"
                sx={styles.cardTitle}
              >
                Placement
              </Typography>
              <Select
                size="small"
                value={local.placement || 'top'}
                onChange={e => handleField('placement', e.target.value)}
                sx={styles.select}
              >
                {PLACEMENT_OPTIONS.map(option => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {local.placement === 'center' && !dismissible && (
                <Alert
                  severity="warning"
                  sx={styles.alert}
                >
                  A non-dismissible centered banner blocks the whole platform: users can&apos;t close it or
                  use the app until it is disabled. Use it only for maintenance lockouts.
                </Alert>
              )}
            </Box>
          </Box>

          <Box sx={styles.inlineCards}>
            <Box sx={[styles.card, styles.inlineCard]}>
              <Box sx={styles.cardBody}>
                <Typography
                  variant="body2"
                  sx={styles.cardTitle}
                >
                  Icon
                </Typography>
                <Select
                  size="small"
                  value={local.icon || 'info'}
                  onChange={e => handleField('icon', e.target.value)}
                  sx={styles.select}
                >
                  {ICON_OPTIONS.map(option => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
            <Box sx={[styles.card, styles.inlineCard]}>
              <Box sx={styles.cardBody}>
                <Typography
                  variant="body2"
                  sx={styles.cardTitle}
                >
                  Banner Style
                </Typography>
                <Select
                  size="small"
                  value={local.style || 'info'}
                  onChange={e => handleField('style', e.target.value)}
                  sx={styles.select}
                >
                  {STYLE_OPTIONS.map(option => (
                    <MenuItem
                      key={option}
                      value={option}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          </Box>

          <Box sx={styles.card}>
            <Box sx={styles.editorHeader}>
              <Typography
                variant="body2"
                sx={styles.cardTitle}
              >
                Banner Message *
              </Typography>
              <Typography
                variant="caption"
                sx={styles.cardHint}
              >
                Fill in the message to be shown in the banner. Supports Markdown formatting.
              </Typography>
            </Box>
            <Box sx={styles.editorWrapper}>
              <CodeMirror
                value={local.message || ''}
                height="15rem"
                extensions={EDITOR_EXTENSIONS}
                onChange={handleMessageChange}
                theme={theme.palette.mode}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={styles.actionBar}>
        <Button
          size="small"
          variant="outlined"
          onClick={handleDiscard}
          disabled={!isDirty || saving}
          sx={styles.actionBtn}
        >
          Discard
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSaveClick}
          disabled={!isDirty || saving || !isValid}
          sx={styles.actionBtn}
        >
          {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
});

BannerEditForm.displayName = 'BannerEditForm';

/** @type {MuiSx} */
const bannerEditFormStyles = () => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    maxWidth: '50rem',
  },
  card: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  cardRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
  }),
  cardBody: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
  }),
  cardLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  cardHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
  inlineCards: {
    display: 'flex',
    gap: '1.25rem',
  },
  inlineCard: {
    flex: 1,
  },
  select: {
    fontSize: '0.8125rem',
  },
  alert: {
    fontSize: '0.8125rem',
  },
  textField: {
    '& .MuiInputBase-input': { fontSize: '0.8125rem' },
    '& .MuiInputLabel-root': { fontSize: '0.8125rem' },
  },
  editorHeader: ({ palette }) => ({
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  editorWrapper: {
    '& .cm-theme-dark': {
      display: 'flex',
      flexDirection: 'column',
    },
    '& .cm-editor': {
      fontSize: '0.75rem',
    },
    '& .cm-scroller': {
      overflow: 'auto',
    },
    '& .cm-gutters': {
      fontSize: '0.75rem',
    },
  },
  actionBar: ({ palette }) => ({
    borderTop: `0.0625rem solid ${palette.border.table}`,
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }),
  actionBtn: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
});

export default BannerEditForm;
