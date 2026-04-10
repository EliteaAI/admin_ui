import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import SecurityIcon from "@mui/icons-material/SecurityOutlined";
import DnsIcon from "@mui/icons-material/DnsOutlined";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeartOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import CodeIcon from "@mui/icons-material/CodeOutlined";
import ConstructionIcon from "@mui/icons-material/ConstructionOutlined";
import CampaignIcon from "@mui/icons-material/CampaignOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import SchemaForm from "@/components/SchemaForm/SchemaForm";
import AdvancedSection from "@/components/SchemaForm/AdvancedSection";
import MaintenanceSection from "@/components/SchemaForm/MaintenanceSection";
import ServiceDescriptorsSection from "../ServiceDescriptorsPage/ServiceDescriptorsSection";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useConfigSchemasQuery,
  useConfigValuesQuery,
  useConfigValuesSaveMutation,
  useConfigRestartMutation,
} from "@/api/configurationApi";
import DedicatedBanner from "@/components/SchemaForm/DedicatedBanner";

const SECTION_ICONS = {
  guardrails: SecurityIcon,
  mcp_servers: DnsIcon,
  observability: MonitorHeartIcon,
  runtime: SettingsIcon,
  admin_panel: AdminPanelSettingsIcon,
  auth: LockIcon,
  service_descriptors: SettingsInputComponentIcon,
  maintenance: ConstructionIcon,
  dedicated_banner: CampaignIcon,
  advanced: CodeIcon,
};

function ConfigurationPage() {
  const [activeSection, setActiveSection] = useState(null);
  const [localValues, setLocalValues] = useState({});
  const [pendingRestarts, setPendingRestarts] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const serverValuesRef = useRef({});

  const { data: schemasData, isLoading: schemasLoading } =
    useConfigSchemasQuery();

  const sections = useMemo(() => {
    const serverSections = (schemasData?.sections || []).filter(
      (s) => s.id !== "litellm",
    );

    return [
      ...serverSections,
      { id: "service_descriptors", title: "Service Descriptors" },
    ];
  }, [schemasData]);

  // Set default section on load
  useEffect(() => {
    if (schemasLoading) return;
    if (sections.length > 0 && !activeSection) setActiveSection(sections[0].id);
  }, [sections, activeSection, schemasLoading]);

  const { data: valuesData, isFetching: valuesFetching } = useConfigValuesQuery(
    { sectionId: activeSection },
    { skip: !activeSection, refetchOnMountOrArgChange: true },
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
    return (
      JSON.stringify(localValues) !== JSON.stringify(serverValuesRef.current)
    );
  }, [localValues]);

  const activeSection_ = useMemo(() => {
    return sections.find((s) => s.id === activeSection);
  }, [sections, activeSection]);

  const activeFields = activeSection_?.fields || [];
  const activeSectionDescription = activeSection_?.description || "";

  // Set dynamic page title based on current section
  const pageTitle = useMemo(() => {
    if (activeSection_?.title) return `Configuration: ${activeSection_.title}`;

    return "Configuration";
  }, [activeSection_]);

  usePageTitle(pageTitle);

  const handleFieldChange = useCallback((key, value) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  }, []);

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
    },
    [isDirty],
  );

  const handleDiscard = useCallback(() => {
    setLocalValues(serverValuesRef.current);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const result = await saveValues({
        sectionId: activeSection,
        values: localValues,
      }).unwrap();

      // Update server baseline immediately so isDirty resets without
      // waiting for the async re-fetch (remote_runtimes cache may be stale).
      serverValuesRef.current = localValues;
      setLocalValues({ ...localValues });

      if (result.requires_restart?.length > 0) {
        // Normalize: v1 returns flat strings, v2 returns {pylon_id, plugins}
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
  }, [activeSection, localValues, saveValues]);

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

  if (schemasLoading) {
    return (
      <DrawerPage>
        <DrawerPageHeader title="Configuration" showBorder />
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={32} />
        </Box>
      </DrawerPage>
    );
  }

  return (
    <DrawerPage sx={{ overflow: "hidden" }}>
      <DrawerPageHeader title="Configuration" showBorder />

      <Box sx={styles.content}>
        {/* Section sidebar */}
        <Box sx={styles.sectionSidebar}>
          {sections.map((section) => {
            const IconComponent = SECTION_ICONS[section.id] || SettingsIcon;
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

        {/* Form content */}
        <Box sx={styles.formArea}>
          {(() => {
            switch (activeSection) {
              case "advanced":
                return (
                  <Box sx={styles.formScroll}>
                    <AdvancedSection />
                  </Box>
                );
              case "maintenance":
                return (
                  <Box sx={styles.formScroll}>
                    <MaintenanceSection />
                  </Box>
                );
              case "service_descriptors":
                return (
                  <Box sx={{ ...styles.formScroll, padding: 0 }}>
                    <ServiceDescriptorsSection />
                  </Box>
                );
              case "dedicated_banner":
                return valuesFetching ? (
                  <Box sx={styles.loadingContainer}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={styles.formScroll}>
                    <DedicatedBanner
                      values={localValues}
                      onChange={handleFieldChange}
                    />
                  </Box>
                );
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
          {!["advanced", "maintenance", "service_descriptors"].includes(
            activeSection,
          ) && (
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
                  disabled={!isDirty || saving}
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
}

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

export default ConfigurationPage;
