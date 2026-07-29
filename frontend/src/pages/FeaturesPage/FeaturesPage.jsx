import { useCallback, useEffect, useMemo, memo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import ExtensionIcon from "@mui/icons-material/ExtensionOutlined";
import PublishIcon from "@mui/icons-material/PublishOutlined";
import BoltIcon from "@mui/icons-material/BoltOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBookOutlined";
import SupportAgentIcon from "@mui/icons-material/SupportAgentOutlined";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PollOutlinedIcon from "@mui/icons-material/PollOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import GuardrailsSection from "@/components/SchemaForm/GuardrailsSection";
import HelpCenterSection from "@/components/SchemaForm/HelpCenterSection";
import SupportAssistant from "@/components/SchemaForm/SupportAssistant";
import VoiceFeatures from "@/components/SchemaForm/VoiceFeatures";
import CostBudgets from "@/components/SchemaForm/CostBudgets";
import SurveysSection from "./SurveysSection/SurveysSection";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useConfigSchemasQuery,
  useConfigValuesQuery,
  useConfigValuesSaveMutation,
  useConfigRestartMutation,
} from "@/api/configurationApi";

// Sections sourced from the shared "guardrails" backend section are selected by
// config-path prefix (e.g. "publishing_guardrail.*"), so any new field added to
// admin_schema.json under that namespace shows up here automatically — no key list
// to maintain. Sections with their own backend section use pathPrefix: null.
const FEATURES_SECTIONS = [
  {
    id: "mcp_configuration",
    title: "MCP Configuration",
    icon: ExtensionIcon,
    backendSectionId: "guardrails",
    pathPrefix: "mcp_exposure.",
  },
  {
    id: "agent_publishing",
    title: "Agent Publishing",
    icon: PublishIcon,
    backendSectionId: "guardrails",
    pathPrefix: "publishing_guardrail.",
  },
  {
    id: "skill_publishing",
    title: "Skill Publishing",
    icon: BoltIcon,
    backendSectionId: "guardrails",
    pathPrefix: "skill_publishing_guardrail.",
  },
  {
    id: "help_center",
    title: "Help Center",
    icon: MenuBookIcon,
    backendSectionId: "resources",
    pathPrefix: null,
  },
  {
    id: "support_assistant",
    title: "Support Assistant",
    icon: SupportAgentIcon,
    backendSectionId: "support_assistant",
    pathPrefix: null,
  },
  {
    id: "voice_features",
    title: "Voice Features",
    icon: RecordVoiceOverOutlinedIcon,
    backendSectionId: "voice_features",
    pathPrefix: null,
  },
  {
    id: "cost_budgets",
    title: "Cost Budgets (Beta)",
    icon: AccountBalanceWalletOutlinedIcon,
    backendSectionId: "cost_budgets",
    pathPrefix: null,
  },
  {
    id: "surveys",
    title: "Surveys",
    icon: PollOutlinedIcon,
    backendSectionId: null,
    pathPrefix: null,
  },
];

const FeaturesPage = memo(() => {
  const [activeSection, setActiveSection] = useState(
    () => window.location.hash.slice(1) || FEATURES_SECTIONS[0].id,
  );
  const [localValues, setLocalValues] = useState({});
  const addSurveyRef = useRef(null);
  const [pendingRestarts, setPendingRestarts] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const serverValuesRef = useRef({});

  const activeDef = useMemo(
    () =>
      FEATURES_SECTIONS.find((s) => s.id === activeSection) ??
      FEATURES_SECTIONS[0],
    [activeSection],
  );

  const { data: schemasData } = useConfigSchemasQuery();

  const {
    data: valuesData,
    isFetching: valuesFetching,
    isLoading: valuesLoading,
  } = useConfigValuesQuery(
    { sectionId: activeDef.backendSectionId },
    { refetchOnMountOrArgChange: true, skip: !activeDef.backendSectionId },
  );

  useEffect(() => {
    if (valuesData?.values) {
      serverValuesRef.current = valuesData.values;
      setLocalValues(valuesData.values);
    }
  }, [valuesData]);

  useEffect(() => {
    window.location.hash = activeSection;
  }, [activeSection]);

  const [saveValues, { isLoading: saving }] = useConfigValuesSaveMutation();
  const [restartPylon, { isLoading: restarting }] = useConfigRestartMutation();

  const isDirty = useMemo(
    () =>
      JSON.stringify(localValues) !== JSON.stringify(serverValuesRef.current),
    [localValues],
  );

  const pageTitle = `Features: ${activeDef.title}`;
  usePageTitle(pageTitle);

  const guardrailsFields = useMemo(() => {
    if (!activeDef.pathPrefix) return [];
    const guardrailsSchema = schemasData?.sections?.find(
      (s) => s.id === "guardrails",
    );
    return (guardrailsSchema?.fields || []).filter((f) =>
      f.path?.startsWith(activeDef.pathPrefix),
    );
  }, [activeDef, schemasData]);

  const handleFieldChange = useCallback((key, value) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Sections with their own field validation report upwards so Save can block
  const [sectionValid, setSectionValid] = useState(true);

  const handleSectionChange = useCallback(
    (sectionId) => {
      if (isDirty) {
        const confirmed = window.confirm(
          "You have unsaved changes. Discard them?",
        );
        if (!confirmed) return;
      }
      setActiveSection(sectionId);
      setPendingRestarts([]);
      // The unmounting section's validity must not keep blocking Save here
      setSectionValid(true);
    },
    [isDirty],
  );

  const handleDiscard = useCallback(() => {
    setLocalValues(serverValuesRef.current);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const cleanedValues = Object.fromEntries(
        Object.entries(localValues).map(([key, value]) => {
          if (key.endsWith("_links") && Array.isArray(value)) {
            return [
              key,
              value.filter(
                (link) => link.title?.trim() !== "" || link.url?.trim() !== "",
              ),
            ];
          }
          return [key, value];
        }),
      );

      const result = await saveValues({
        sectionId: activeDef.backendSectionId,
        values: cleanedValues,
      }).unwrap();

      serverValuesRef.current = cleanedValues;
      setLocalValues({ ...cleanedValues });

      if (result.requires_restart?.length > 0) {
        const normalized = result.requires_restart.map((r) =>
          typeof r === "string" ? { pylon_id: r, plugins: [] } : r,
        );
        setPendingRestarts(normalized);
        const summary = normalized
          .map((r) =>
            r.plugins?.length
              ? `${r.plugins.join(", ")} on ${r.pylon_id}`
              : r.pylon_id,
          )
          .join("; ");
        setSnackbar({
          open: true,
          message: `Configuration saved. Reload required: ${summary}`,
          severity: "warning",
        });
      } else {
        setPendingRestarts([]);
        setSnackbar({
          open: true,
          message: "Configuration saved successfully",
          severity: "success",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to save: ${err?.data?.error || err?.message || "Unknown error"}`,
        severity: "error",
      });
    }
  }, [activeDef, localValues, saveValues]);

  const handleReload = useCallback(
    async (pylonId, plugins) => {
      try {
        await restartPylon({ pylonId, plugins }).unwrap();
        setPendingRestarts((prev) =>
          prev.filter((r) => r.pylon_id !== pylonId),
        );
        const label = plugins?.length
          ? `Reload signal sent for ${plugins.join(", ")} on ${pylonId}`
          : `Restart signal sent to ${pylonId}`;
        setSnackbar({ open: true, message: label, severity: "info" });
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Reload failed: ${err?.message || "Unknown error"}`,
          severity: "error",
        });
      }
    },
    [restartPylon],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const renderContent = () => {
    const isLoading =
      activeDef.backendSectionId &&
      (activeDef.pathPrefix ? valuesLoading : valuesFetching);

    if (isLoading)
      return (
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={24} />
        </Box>
      );

    switch (activeSection) {
      case "surveys":
        return <SurveysSection addRef={addSurveyRef} />;
      case "mcp_configuration":
      case "agent_publishing":
      case "skill_publishing":
        return (
          <Box sx={styles.formScroll}>
            <GuardrailsSection
              fields={guardrailsFields}
              values={localValues}
              sectionDescription=""
              onChange={handleFieldChange}
              defaultExpanded
            />
          </Box>
        );
      case "help_center":
        return (
          <Box sx={styles.formScroll}>
            <HelpCenterSection
              values={localValues}
              onChange={handleFieldChange}
            />
          </Box>
        );
      case "support_assistant":
        return (
          <Box sx={styles.formScroll}>
            <SupportAssistant
              values={localValues}
              onChange={handleFieldChange}
            />
          </Box>
        );
      case "voice_features":
        return (
          <Box sx={styles.formScroll}>
            <VoiceFeatures values={localValues} onChange={handleFieldChange} />
          </Box>
        );
      case "cost_budgets":
        return (
          <Box sx={styles.formScroll}>
            <CostBudgets
              values={localValues}
              onChange={handleFieldChange}
              onValidityChange={setSectionValid}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <DrawerPage sx={{ overflow: "hidden" }}>
      <DrawerPageHeader
        title="Features"
        showBorder
        showAddButton={activeSection === "surveys"}
        onAdd={() => addSurveyRef.current?.()}
        addButtonTooltip="Add survey"
      />

      <Box sx={styles.content}>
        <Box sx={styles.sectionSidebar}>
          {FEATURES_SECTIONS.map((section) => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.id;
            return (
              <Box
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                sx={styles.sectionItem(isActive)}
              >
                <IconComponent sx={{ fontSize: "1rem" }} />
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

        <Box sx={styles.formArea}>
          {renderContent()}

          {activeSection !== "surveys" && (
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
                  {saving ? "Saving..." : "Save"}
                </Button>
              </Box>

              {pendingRestarts.length > 0 && (
                <Box sx={styles.restartBar}>
                  <Typography variant="caption" sx={styles.restartLabel}>
                    Reload required:
                  </Typography>
                  {pendingRestarts.map((entry) => (
                    <Button
                      key={entry.pylon_id}
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={
                        <RestartAltIcon sx={{ fontSize: "0.875rem" }} />
                      }
                      onClick={() =>
                        handleReload(entry.pylon_id, entry.plugins)
                      }
                      disabled={restarting}
                      sx={styles.restartButton}
                    >
                      {entry.plugins?.length
                        ? entry.plugins.join(", ")
                        : entry.pylon_id}
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
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DrawerPage>
  );
});

const styles = {
  content: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  sectionSidebar: ({ palette }) => ({
    width: "13rem",
    minWidth: "13rem",
    borderRight: `1px solid ${palette.border.table}`,
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    overflowY: "auto",
  }),
  sectionItem:
    (isActive) =>
    ({ palette }) => ({
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      cursor: "pointer",
      transition: "all 0.15s ease",
      backgroundColor: isActive
        ? palette.background.userInputBackgroundActive
        : "transparent",
      color: isActive ? palette.text.secondary : palette.text.metrics,
      "&:hover": {
        backgroundColor: isActive
          ? palette.background.userInputBackgroundActive
          : palette.background.conversation?.hover || palette.action.hover,
      },
    }),
  sectionItemText:
    (isActive) =>
    ({ palette }) => ({
      fontSize: "0.8125rem",
      fontWeight: isActive ? 600 : 400,
      color: isActive ? palette.text.secondary : palette.text.metrics,
    }),
  formArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  formScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  actionBar: ({ palette }) => ({
    borderTop: `1px solid ${palette.border.table}`,
    padding: "0.75rem 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
  }),
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  discardButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
  saveButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
  restartBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  restartLabel: ({ palette }) => ({
    color: palette.warning?.main || palette.text.metrics,
    fontWeight: 500,
  }),
  restartButton: {
    textTransform: "none",
    fontSize: "0.75rem",
  },
};

export default FeaturesPage;
