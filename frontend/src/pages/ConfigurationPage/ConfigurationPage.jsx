import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AppRegistrationIcon from '@mui/icons-material/AppRegistrationOutlined';
import CampaignIcon from '@mui/icons-material/CampaignOutlined';
import CodeIcon from '@mui/icons-material/CodeOutlined';
import ConstructionIcon from '@mui/icons-material/ConstructionOutlined';
import DnsIcon from '@mui/icons-material/DnsOutlined';
import GroupsIcon from '@mui/icons-material/GroupsOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeartOutlined';
import PaletteIcon from '@mui/icons-material/PaletteOutlined';
import PollIcon from '@mui/icons-material/PollOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SecurityIcon from '@mui/icons-material/SecurityOutlined';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgentOutlined';
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from '@mui/material';

import {
  useConfigRestartMutation,
  useConfigSchemasQuery,
  useConfigValuesQuery,
  useConfigValuesSaveMutation,
} from '@/api/configuration.api';
import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { GuardrailsSection, SchemaForm } from '@/components/SchemaForm';
import { CONFIG_SECTION_PERMISSIONS } from '@/constants/permissions.constants';
import { RouteDefinitions } from '@/constants/routes.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';

import { AdvancedSection } from './components/AdvancedSection';
import { BannersSection } from './components/BannersSection';
import { CustomThemeSection } from './components/CustomThemeSection';
import { HelpCenterSection } from './components/HelpCenterSection';
import { MaintenanceSection } from './components/MaintenanceSection';
import { OAuthAppsSection } from './components/OAuthAppsSection';
import { PylonCardsSection } from './components/PylonCardsSection';
import { ScimSection } from './components/ScimSection';
import { ServiceDescriptorsSection } from './components/ServiceDescriptorsSection';
import SupportAssistant from './components/SupportAssistant';
import { SurveysSection } from './components/SurveysSection';

const SECTION_ICONS = {
  guardrails: SecurityIcon,
  mcp_servers: DnsIcon,
  oauth_apps: AppRegistrationIcon,
  scim: GroupsIcon,
  observability: MonitorHeartIcon,
  runtime: SettingsIcon,
  admin_panel: AdminPanelSettingsIcon,
  auth: LockIcon,
  service_descriptors: SettingsInputComponentIcon,
  maintenance: ConstructionIcon,
  dedicated_banner: CampaignIcon,
  advanced: CodeIcon,
  support_assistant: SupportAgentIcon,
  resources: MenuBookIcon,
  surveys: PollIcon,
  custom_theme: PaletteIcon,
};

const MOVED_TO_FEATURES = [
  'Usage',
  'voice_features',
  'chat_mentions',
  'cost_budgets',
  'tool_spend',
  'tool_pricing',
  'skills',
  'schedules',
  'webhooks',
  'notifications',
];
// Guardrails-section fields whose config path starts with one of these prefixes have
// been relocated to the Features page (see FeaturesPage features.constants), so they are
// hidden here. Prefix-based so new publishing_guardrail.*/mcp_exposure.* fields added to
// admin_schema.json stay out of Guardrails automatically.
const FEATURES_GUARDRAILS_PREFIXES = [
  'mcp_exposure.',
  'publishing_guardrail.',
  'skill_publishing_guardrail.',
  'midturn_injection_guardrail.',
  'code_mode_experimental.',
  'next_input_suggestion_guardrail.',
  'conversation_starters_guardrail.',
];

// Sections with their own save flow: no shared Save/Discard bar
const SELF_MANAGED_SECTIONS = [
  'advanced',
  'maintenance',
  'service_descriptors',
  'dedicated_banner',
  'oauth_apps',
  'scim',
  'surveys',
  'custom_theme',
];

// The backend names these sections "Advanced" and "Resources"; the admin sees the names below
const SECTION_TITLES = {
  advanced: 'Pylons & Plugins',
  resources: 'Help Center',
};

// Sections that became their own pages. Old #<id> links on /configuration redirect to the new route.
const SECTION_ROUTES = {
  auth: RouteDefinitions.Authentication,
  scim: RouteDefinitions.ScimProvisioning,
  guardrails: RouteDefinitions.Guardrails,
  Usage: `${RouteDefinitions.Features}#usage_settings`,
};

const NO_PLUGIN_CONFIG_SECTIONS = ['dedicated_banner', 'oauth_apps', 'scim', 'surveys', 'custom_theme'];

const SINGLE_SECTION_TITLES = {
  auth: 'Authentication',
  scim: 'SCIM Provisioning',
  guardrails: 'Guardrails',
};

const SECTION_ORDER = [
  'advanced',
  'maintenance',
  'dedicated_banner',
  'mcp_servers',
  'oauth_apps',
  'service_descriptors',
  'runtime',
  'observability',
  'support_assistant',
  'resources',
  'surveys',
  'custom_theme',
];

const ConfigurationPage = memo(props => {
  // With sectionId the page shows that one section on its own route: no sub-menu, no URL hash
  const { sectionId } = props;

  const styles = configurationPageStyles();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(() =>
    sectionId ? sectionId : window.location.hash.slice(1) || null,
  );
  const { hasAnyPermission } = useCheckPermission();
  const [localValues, setLocalValues] = useState({});
  const [bannersDirty, setBannersDirty] = useState(false);
  const addSurveyRef = useRef(null);
  const [pendingRestarts, setPendingRestarts] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const serverValuesRef = useRef({});

  const { data: schemasData, isLoading: schemasLoading } = useConfigSchemasQuery();

  const sections = useMemo(() => {
    const serverSections = (schemasData?.sections || [])
      .filter(s => s.id !== 'litellm' && !MOVED_TO_FEATURES.includes(s.id))
      .map(s => (SECTION_TITLES[s.id] ? { ...s, title: SECTION_TITLES[s.id] } : s));

    const allSections = [
      ...serverSections,
      { id: 'oauth_apps', title: 'OAuth Apps' },
      { id: 'scim', title: 'SCIM Provisioning' },
      { id: 'service_descriptors', title: 'Service Descriptors' },
      { id: 'surveys', title: 'Surveys' },
      { id: 'custom_theme', title: 'Custom Theme' },
    ];

    const filtered = allSections.filter(s => {
      if (sectionId ? s.id !== sectionId : s.id in SECTION_ROUTES) return false;
      const requiredPerms = CONFIG_SECTION_PERMISSIONS[s.id];
      if (!requiredPerms) return true;
      return hasAnyPermission(requiredPerms);
    });

    return filtered.sort((a, b) => {
      const indexA = SECTION_ORDER.indexOf(a.id);
      const indexB = SECTION_ORDER.indexOf(b.id);
      return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
    });
  }, [schemasData, hasAnyPermission, sectionId]);

  // Old #auth, #scim and #guardrails links open the new pages. Replace, so Back doesn't return here.
  // Runs before the fallback below, which would otherwise swap the hash for Advanced.
  const redirectRoute = !sectionId && SECTION_ROUTES[window.location.hash.slice(1)];
  useEffect(() => {
    if (redirectRoute) navigate(redirectRoute, { replace: true });
  }, [redirectRoute, navigate]);

  // Sync active section to URL hash
  useEffect(() => {
    if (activeSection && !sectionId && !redirectRoute) window.location.hash = activeSection;
  }, [activeSection, sectionId, redirectRoute]);

  // Set Advanced as default on load, validate hash section exists
  useEffect(() => {
    if (sectionId || redirectRoute) return;
    if (schemasLoading || sections.length === 0) return;
    if (!activeSection) {
      const advancedSection = sections.find(s => s.id === 'advanced');
      setActiveSection(advancedSection?.id || sections[0].id);
    } else if (!sections.find(s => s.id === activeSection)) {
      const advancedSection = sections.find(s => s.id === 'advanced');
      setActiveSection(advancedSection?.id || sections[0].id);
    }
  }, [sections, activeSection, schemasLoading, sectionId, redirectRoute]);

  const {
    data: valuesData,
    currentData: valuesCurrentData,
    isFetching: valuesFetching,
    isLoading: valuesLoading,
  } = useConfigValuesQuery(
    { sectionId: activeSection },
    // These sections have their own storage, so they have no plugin-config values to load
    {
      skip: !activeSection || NO_PLUGIN_CONFIG_SECTIONS.includes(activeSection),
      refetchOnMountOrArgChange: true,
    },
  );

  // Sync server values to local state
  useEffect(() => {
    if (valuesData?.values) {
      serverValuesRef.current = valuesData.values;
      setLocalValues(valuesData.values);
    }
  }, [valuesData]);

  const [saveValues, { isLoading: saving }] = useConfigValuesSaveMutation();
  const [restartPylon, { isLoading: restarting }] = useConfigRestartMutation();

  const isDirty = useMemo(() => {
    return JSON.stringify(localValues) !== JSON.stringify(serverValuesRef.current);
  }, [localValues]);

  const activeSection_ = useMemo(() => {
    return sections.find(s => s.id === activeSection);
  }, [sections, activeSection]);

  const activeFields = useMemo(() => activeSection_?.fields || [], [activeSection_]);
  const activeSectionDescription = activeSection_?.description || '';

  const invalidFields = useMemo(() => {
    const meta = valuesData?.fields_meta || {};
    return Object.entries(meta)
      .filter(([, entry]) => entry?.value_invalid)
      .map(([key, entry]) => {
        const field = activeFields.find(
          candidate => candidate.key === key || candidate._original_key === key,
        );
        return {
          key,
          storedValue: entry.stored_value,
          title: field?.title || key.split('::')[0],
        };
      });
  }, [valuesData, activeFields]);

  const invalidFieldsMessage = useMemo(
    () =>
      invalidFields
        .map(field => `${field.title} holds an unusable value (${JSON.stringify(field.storedValue)})`)
        .join('; '),
    [invalidFields],
  );

  const canSave = isDirty || invalidFields.length > 0;

  // Set dynamic page title based on current section
  const pageTitle = useMemo(() => {
    if (sectionId) return activeSection_?.title || '';
    if (activeSection_?.title) return `Configuration: ${activeSection_.title}`;

    return 'Configuration';
  }, [activeSection_, sectionId]);

  usePageTitle(pageTitle);

  const handleFieldChange = useCallback((key, value) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSectionChange = useCallback(
    nextSectionId => {
      if (isDirty || bannersDirty) {
        const confirmed = window.confirm('You have unsaved changes. Discard them?');
        if (!confirmed) return;
      }
      // The banner section skips the values query, so discarded edits must be dropped here
      setLocalValues(serverValuesRef.current);
      setBannersDirty(false);
      setActiveSection(nextSectionId);
      setPendingRestarts([]);
    },
    [isDirty, bannersDirty],
  );

  const handleAddSurvey = useCallback(() => {
    addSurveyRef.current?.();
  }, []);

  const handleDiscard = useCallback(() => {
    setLocalValues(serverValuesRef.current);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const cleanedValues = Object.fromEntries(
        Object.entries(localValues).map(([key, value]) => {
          if (key.endsWith('_links') && Array.isArray(value)) {
            return [key, value.filter(link => link.title?.trim() !== '' || link.url?.trim() !== '')];
          }
          return [key, value];
        }),
      );

      const result = await saveValues({
        sectionId: activeSection,
        values: cleanedValues,
      }).unwrap();

      // Update server baseline immediately so isDirty resets without
      // waiting for the async re-fetch (remote_runtimes cache may be stale).
      serverValuesRef.current = cleanedValues;
      setLocalValues({ ...cleanedValues });

      if (result.requires_restart?.length > 0) {
        // Normalize: v1 returns flat strings, v2 returns {pylon_id, plugins}
        const normalized = result.requires_restart.map(r =>
          typeof r === 'string' ? { pylon_id: r, plugins: [] } : r,
        );
        setPendingRestarts(normalized);
        const summary = normalized
          .map(r => (r.plugins?.length ? `${r.plugins.join(', ')} on ${r.pylon_id}` : r.pylon_id))
          .join('; ');
        setSnackbar({
          open: true,
          message: `Configuration saved. Reload required: ${summary}`,
          severity: 'warning',
        });
      } else {
        setPendingRestarts([]);
        setSnackbar({
          open: true,
          message: 'Configuration saved successfully',
          severity: 'success',
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to save: ${err?.data?.error || err?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  }, [activeSection, localValues, saveValues]);

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

  // The header names the page; a single-section page is titled after its section
  const headerTitle = sectionId ? SINGLE_SECTION_TITLES[sectionId] : 'Configuration';

  // The old section is not shown, not even for one render: it would load data for a page we are leaving
  if (redirectRoute) return null;

  if (schemasLoading) {
    return (
      <DrawerPage>
        <DrawerPageHeader
          title={headerTitle}
          showBorder
        />
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={32} />
        </Box>
      </DrawerPage>
    );
  }

  return (
    <DrawerPage sx={{ overflow: 'hidden' }}>
      <DrawerPageHeader
        title={headerTitle}
        showBorder
        showAddButton={activeSection === 'surveys'}
        onAdd={handleAddSurvey}
        addButtonTooltip="Add survey"
      />

      <Box sx={styles.content}>
        {/* Section sidebar */}
        {!sectionId && (
          <Box sx={styles.sectionSidebar}>
            {sections.map(section => {
              const IconComponent = SECTION_ICONS[section.id] || SettingsIcon;
              const isActive = activeSection === section.id;
              return (
                <Box
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  sx={styles.sectionItem(isActive)}
                >
                  <IconComponent sx={{ fontSize: '1rem' }} />
                  <Typography
                    variant="body2"
                    sx={styles.sectionItemText(isActive)}
                  >
                    {section.title}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Form content */}
        <Box sx={styles.formArea}>
          {(() => {
            switch (activeSection) {
              case 'advanced':
                return (
                  <Box sx={styles.formScroll}>
                    <AdvancedSection />
                  </Box>
                );
              case 'maintenance':
                return (
                  <Box sx={styles.formScroll}>
                    <MaintenanceSection />
                  </Box>
                );
              case 'service_descriptors':
                return (
                  <Box sx={[styles.formScroll, styles.noPadding]}>
                    <ServiceDescriptorsSection />
                  </Box>
                );
              case 'dedicated_banner':
                return <BannersSection onDirtyChange={setBannersDirty} />;
              case 'oauth_apps':
                return (
                  <Box sx={styles.formScroll}>
                    <OAuthAppsSection />
                  </Box>
                );
              case 'scim':
                return (
                  <Box sx={styles.formScroll}>
                    <ScimSection />
                  </Box>
                );
              case 'surveys':
                return <SurveysSection addRef={addSurveyRef} />;
              case 'custom_theme':
                return (
                  <Box sx={styles.formScroll}>
                    <CustomThemeSection />
                  </Box>
                );
              case 'support_assistant':
              case 'resources':
                // Wait for this section's own values: RTK keeps the previous section's data while a new one loads,
                // and a refetch after Save must not remount the blocks
                return valuesFetching && !valuesCurrentData ? (
                  <Box sx={styles.loadingContainer}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={styles.formScroll}>
                    {activeSection === 'resources' ? (
                      <HelpCenterSection
                        values={localValues}
                        onChange={handleFieldChange}
                      />
                    ) : (
                      <SupportAssistant
                        values={localValues}
                        onChange={handleFieldChange}
                      />
                    )}
                  </Box>
                );
              case 'runtime':
              case 'observability':
                return valuesFetching ? (
                  <Box sx={styles.loadingContainer}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={styles.formScroll}>
                    <PylonCardsSection
                      sectionId={activeSection}
                      fields={activeFields}
                      values={localValues}
                      sectionDescription={activeSectionDescription}
                      onChange={handleFieldChange}
                    />
                  </Box>
                );
              case 'guardrails': {
                const guardrailsFields = activeFields.filter(
                  f => !FEATURES_GUARDRAILS_PREFIXES.some(p => f.path?.startsWith(p)),
                );
                return valuesLoading ? (
                  <Box sx={styles.loadingContainer}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={styles.formScroll}>
                    <GuardrailsSection
                      fields={guardrailsFields}
                      values={localValues}
                      sectionDescription={activeSectionDescription}
                      onChange={handleFieldChange}
                    />
                  </Box>
                );
              }
              default:
                return valuesFetching ? (
                  <Box sx={styles.loadingContainer}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={styles.formScroll}>
                    <SchemaForm
                      fields={activeFields}
                      values={localValues}
                      sectionDescription={activeSectionDescription}
                      onChange={handleFieldChange}
                    />
                  </Box>
                );
            }
          })()}

          {/* Action bar */}
          {!SELF_MANAGED_SECTIONS.includes(activeSection) && (
            <Box sx={styles.actionBar}>
              {invalidFields.length > 0 && (
                <Alert
                  severity="warning"
                  sx={styles.invalidAlert}
                >
                  {invalidFieldsMessage}. The platform is running its default instead; save to correct what is
                  stored. A field hidden by another setting is still corrected.
                </Alert>
              )}
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
                  disabled={!canSave || saving}
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

ConfigurationPage.displayName = 'ConfigurationPage';

/** @type {MuiSx} */
/** @type {MuiSx} */
const configurationPageStyles = () => ({
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
  invalidAlert: {
    marginBottom: '0.5rem',
    fontSize: '0.8125rem',
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
  noPadding: {
    padding: 0,
  },
});

export default ConfigurationPage;
