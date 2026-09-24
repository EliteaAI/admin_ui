import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Alert, Box, Button, ButtonBase, CircularProgress, Snackbar, Typography } from '@mui/material';

import {
  useConfigRestartMutation,
  useConfigSchemasQuery,
  useConfigValuesSaveMutation,
} from '@/api/configuration.api';
import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { GuardrailsSection } from '@/components/SchemaForm';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';

import { ChatConfigurationSection } from './components/ChatConfigurationSection';
import { CostBudgetsSection } from './components/CostBudgetsSection';
import { CustomThemeSection } from './components/CustomThemeSection';
import { HelpCenterSection } from './components/HelpCenterSection';
import PublishingSection from './components/PublishingSection';
import SupportAssistant from './components/SupportAssistant';
import { SurveysSection } from './components/SurveysSection';
import { FEATURES_SECTIONS, LEGACY_SECTION_REDIRECTS } from './constants/features.constants';
import {
  cleanValuesForSave,
  mergeRequiredRestarts,
  resolveSectionFromHash,
} from './helpers/features.helpers';
import { useConfigSectionDraft } from './hooks/useConfigSectionDraft.hooks';

const FeaturesPage = memo(() => {
  const styles = featuresPageStyles();

  // Old links to sections that are now blocks open the parent page with that block expanded
  const [initialTarget] = useState(() =>
    resolveSectionFromHash(window.location.hash.slice(1), FEATURES_SECTIONS, LEGACY_SECTION_REDIRECTS),
  );
  const [activeSection, setActiveSection] = useState(initialTarget.page);
  const [deepLinkBlock, setDeepLinkBlock] = useState(initialTarget.block);

  const addSurveyRef = useRef(null);
  const [pendingRestarts, setPendingRestarts] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const activeDef = useMemo(
    () => FEATURES_SECTIONS.find(s => s.id === activeSection) ?? FEATURES_SECTIONS[0],
    [activeSection],
  );

  const { data: schemasData } = useConfigSchemasQuery();

  // One draft per backend config section; only the sections the active page edits are fetched
  const usesSection = sectionId => activeDef.backendSectionIds.includes(sectionId);
  const guardrailsDraft = useConfigSectionDraft('guardrails', { skip: !usesSection('guardrails') });
  const voiceDraft = useConfigSectionDraft('voice_features', { skip: !usesSection('voice_features') });
  const mentionsDraft = useConfigSectionDraft('chat_mentions', { skip: !usesSection('chat_mentions') });
  const budgetsDraft = useConfigSectionDraft('cost_budgets', { skip: !usesSection('cost_budgets') });
  const supportDraft = useConfigSectionDraft('support_assistant', {
    skip: !usesSection('support_assistant'),
  });
  const resourcesDraft = useConfigSectionDraft('resources', { skip: !usesSection('resources') });

  const allDrafts = useMemo(
    () => [guardrailsDraft, voiceDraft, mentionsDraft, budgetsDraft, supportDraft, resourcesDraft],
    [guardrailsDraft, voiceDraft, mentionsDraft, budgetsDraft, supportDraft, resourcesDraft],
  );
  const activeDrafts = useMemo(
    () => allDrafts.filter(draft => activeDef.backendSectionIds.includes(draft.sectionId)),
    [allDrafts, activeDef],
  );

  const isDirty = activeDrafts.some(draft => draft.isDirty);
  const isLoading = activeDrafts.some(draft => draft.isLoading);

  useEffect(() => {
    window.location.hash = activeSection;
  }, [activeSection]);

  const [saveValues, { isLoading: saving }] = useConfigValuesSaveMutation();
  const [restartPylon, { isLoading: restarting }] = useConfigRestartMutation();

  const pageTitle = `Features: ${activeDef.title}`;
  usePageTitle(pageTitle);

  const guardrailsFields = useMemo(() => {
    const guardrailsSchema = schemasData?.sections?.find(s => s.id === 'guardrails');
    return guardrailsSchema?.fields || [];
  }, [schemasData]);

  const mcpFields = useMemo(
    () => guardrailsFields.filter(f => f.path?.startsWith('mcp_exposure.')),
    [guardrailsFields],
  );

  // Sections with their own field validation report upwards so Save can block
  const [sectionValid, setSectionValid] = useState(true);

  const handleSectionChange = useCallback(
    sectionId => {
      if (isDirty) {
        const confirmed = window.confirm('You have unsaved changes. Discard them?');
        if (!confirmed) return;
      }
      // Drafts outlive the page (guardrails is shared by several), so unsaved edits are dropped here
      allDrafts.forEach(draft => draft.discard());
      setActiveSection(sectionId);
      setDeepLinkBlock(null);
      setPendingRestarts([]);
      // The unmounting section's validity must not keep blocking Save here
      setSectionValid(true);
    },
    [isDirty, allDrafts],
  );

  const handleDiscard = useCallback(() => {
    activeDrafts.forEach(draft => draft.discard());
  }, [activeDrafts]);

  const showRestarts = useCallback(restarts => {
    setPendingRestarts(restarts);
    if (!restarts.length) return false;

    const summary = restarts
      .map(r => (r.plugins?.length ? `${r.plugins.join(', ')} on ${r.pylon_id}` : r.pylon_id))
      .join('; ');
    setSnackbar({
      open: true,
      message: `Configuration saved. Reload required: ${summary}`,
      severity: 'warning',
    });
    return true;
  }, []);

  // Each backend section with unsaved changes is saved by its own request, as before the grouping
  const handleSave = useCallback(async () => {
    const restarts = [];
    const dirtyDrafts = activeDrafts.filter(draft => draft.isDirty);

    try {
      for (const draft of dirtyDrafts) {
        const cleanedValues = cleanValuesForSave(draft.values);

        const result = await saveValues({
          sectionId: draft.sectionId,
          values: cleanedValues,
        }).unwrap();

        draft.markSaved(cleanedValues);
        restarts.push(...(result.requires_restart ?? []));
      }

      if (!showRestarts(mergeRequiredRestarts(restarts))) {
        setSnackbar({
          open: true,
          message: 'Configuration saved successfully',
          severity: 'success',
        });
      }
    } catch (err) {
      // Sections saved before the failure stay saved, so their reloads are still offered
      setPendingRestarts(mergeRequiredRestarts(restarts));
      setSnackbar({
        open: true,
        message: `Failed to save: ${err?.data?.error || err?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  }, [activeDrafts, saveValues, showRestarts]);

  const handleReload = useCallback(
    async (pylonId, plugins) => {
      try {
        await restartPylon({ pylonId, plugins }).unwrap();
        setPendingRestarts(prev => prev.filter(r => r.pylon_id !== pylonId));
        const label = plugins?.length
          ? `Reload signal sent for ${plugins.join(', ')} on ${pylonId}`
          : `Restart signal sent to ${pylonId}`;
        setSnackbar({ open: true, message: label, severity: 'info' });
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Reload failed: ${err?.message || 'Unknown error'}`,
          severity: 'error',
        });
      }
    },
    [restartPylon],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const renderContent = () => {
    // Only the first load blocks the page: a refetch after Save must not remount the blocks
    // and collapse whatever the admin had open
    if (isLoading)
      return (
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={24} />
        </Box>
      );

    switch (activeSection) {
      case 'surveys':
        return <SurveysSection addRef={addSurveyRef} />;
      case 'custom_theme':
        return (
          <Box sx={styles.formScroll}>
            <CustomThemeSection />
          </Box>
        );
      case 'mcp_configuration':
        return (
          <Box sx={styles.formScroll}>
            <GuardrailsSection
              fields={mcpFields}
              values={guardrailsDraft.values}
              sectionDescription=""
              onChange={guardrailsDraft.onChange}
              defaultExpanded
            />
          </Box>
        );
      case 'chat_configuration':
        return (
          <Box sx={styles.formScroll}>
            <ChatConfigurationSection
              voiceDraft={voiceDraft}
              mentionsDraft={mentionsDraft}
              guardrailsDraft={guardrailsDraft}
              guardrailsFields={guardrailsFields}
              initialBlock={deepLinkBlock}
            />
          </Box>
        );
      case 'publishing':
        return (
          <Box sx={styles.formScroll}>
            <PublishingSection
              guardrailsDraft={guardrailsDraft}
              guardrailsFields={guardrailsFields}
              initialBlock={deepLinkBlock}
            />
          </Box>
        );
      case 'cost_budgets':
        return (
          <Box sx={styles.formScroll}>
            <CostBudgetsSection
              budgetsDraft={budgetsDraft}
              onValidityChange={setSectionValid}
              initialBlock={deepLinkBlock}
            />
          </Box>
        );
      case 'help_center':
        return (
          <Box sx={styles.formScroll}>
            <HelpCenterSection
              values={resourcesDraft.values}
              onChange={resourcesDraft.onChange}
            />
          </Box>
        );
      case 'support_assistant':
        return (
          <Box sx={styles.formScroll}>
            <SupportAssistant
              values={supportDraft.values}
              onChange={supportDraft.onChange}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <DrawerPage sx={{ overflow: 'hidden' }}>
      <DrawerPageHeader
        title="Features"
        showBorder
        showAddButton={activeSection === 'surveys'}
        onAdd={() => addSurveyRef.current?.()}
        addButtonTooltip="Add survey"
      />

      <Box sx={styles.content}>
        <Box sx={styles.sectionSidebar}>
          {FEATURES_SECTIONS.map(section => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.id;
            return (
              <ButtonBase
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                aria-current={isActive ? 'page' : undefined}
                sx={styles.sectionItem(isActive)}
              >
                <IconComponent sx={{ fontSize: '1rem' }} />
                <Typography
                  variant="body2"
                  sx={styles.sectionItemText(isActive)}
                >
                  {section.title}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        <Box sx={styles.formArea}>
          {renderContent()}

          {!activeDef.selfSaving && (
            <Box sx={styles.actionBar}>
              <Box sx={styles.actionButtons}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleDiscard}
                  disabled={!isDirty || saving}
                  sx={styles.discardButton}
                >
                  Discard
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  disabled={!isDirty || saving || !sectionValid}
                  sx={styles.saveButton}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </Box>

              {pendingRestarts.length > 0 && (
                <Box sx={styles.restartBar}>
                  <Typography
                    variant="caption"
                    sx={styles.restartLabel}
                  >
                    Reload required:
                  </Typography>
                  {pendingRestarts.map(entry => (
                    <Button
                      key={entry.pylon_id}
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<RestartAltIcon sx={{ fontSize: '0.875rem' }} />}
                      onClick={() => handleReload(entry.pylon_id, entry.plugins)}
                      disabled={restarting}
                      sx={styles.restartButton}
                    >
                      {entry.plugins?.length ? entry.plugins.join(', ') : entry.pylon_id}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

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
    </DrawerPage>
  );
});

FeaturesPage.displayName = 'FeaturesPage';

/** @type {MuiSx} */
const featuresPageStyles = () => ({
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sectionSidebar: ({ palette }) => ({
    width: '13rem',
    minWidth: '13rem',
    borderRight: `0.0625rem solid ${palette.border.table}`,
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflowY: 'auto',
  }),
  sectionItem:
    isActive =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.375rem',
      width: '100%',
      justifyContent: 'flex-start',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      backgroundColor: isActive ? palette.background.userInputBackgroundActive : 'transparent',
      color: isActive ? palette.text.secondary : palette.text.metrics,
      '&:hover': {
        backgroundColor: isActive
          ? palette.background.userInputBackgroundActive
          : palette.background.conversation?.hover || palette.action.hover,
      },
    }),
  sectionItemText:
    isActive =>
    ({ palette }) => ({
      fontSize: '0.8125rem',
      fontWeight: isActive ? 600 : 400,
      color: isActive ? palette.text.secondary : palette.text.metrics,
    }),
  formArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  formScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionBar: ({ palette }) => ({
    borderTop: `0.0625rem solid ${palette.border.table}`,
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  }),
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  discardButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
  saveButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
  restartBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  restartLabel: ({ palette }) => ({
    color: palette.warning?.main || palette.text.metrics,
    fontWeight: 500,
  }),
  restartButton: {
    textTransform: 'none',
    fontSize: '0.75rem',
  },
});

export default FeaturesPage;
