import { memo, useCallback, useMemo } from "react";
import { Box, Switch, TextField, Typography } from "@mui/material";
import LinksEditor from "@/components/SchemaForm/LinksEditor";
import ResourceVersionRow from "@/components/SchemaForm/ResourceVersionRow";

const ResourceCard = memo((props) => {
  const { card, values, onChange, systemInfo } = props;

  const enabledKey = `resources_${card.id}_enabled`;
  const titleKey = `resources_${card.id}_title`;
  const descriptionKey = `resources_${card.id}_description`;
  const linksKey = `resources_${card.id}_links`;
  const versionLabelKey = `resources_${card.id}_version_label`;

  const enabled = values?.[enabledKey] ?? true;
  const title = values?.[titleKey] ?? "";
  const description = values?.[descriptionKey] ?? "";
  const links = values?.[linksKey] ?? [];
  const versionLabel = values?.[versionLabelKey] ?? "ELITEA VERSION";

  const handleToggle = () => {
    onChange(enabledKey, !enabled);
  };

  const handleTitleChange = (event) => {
    onChange(titleKey, event.target.value);
  };

  const handleDescriptionChange = (event) => {
    onChange(descriptionKey, event.target.value);
  };

  const handleLinksChange = useCallback(
    (newLinks) => {
      onChange(linksKey, newLinks);
    },
    [linksKey, onChange],
  );

  const versionRows = useMemo(() => {
    if (!systemInfo) return [];

    const rows = [];

    if (systemInfo.elitea_version) {
      rows.push({
        id: "version",
        label: versionLabel,
        value: systemInfo.elitea_version,
        labelKey: versionLabelKey,
      });
    }

    for (const pylon of systemInfo.pylons ?? []) {
      rows.push({
        id: pylon.pylon_id ?? pylon.name,
        label: `Version ${pylon.name}`,
        value: pylon.core_version ?? "",
        labelKey: null,
      });
    }

    return rows;
  }, [systemInfo, versionLabel, versionLabelKey]);

  return (
    <>
      <Box sx={styles.card}>
        <Box sx={styles.cardHeader}>
          <Box sx={styles.cardLabel}>
            <Typography variant="subtitle1" sx={styles.cardTitle}>
              {card.label}
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              {card.hint}
            </Typography>
          </Box>
          <Switch checked={enabled} onChange={handleToggle} size="small" />
        </Box>

        {card.hasContent && (
          <>
            <Box sx={styles.fieldSection}>
              <Box sx={styles.fieldHeader}>
                <Typography variant="subtitle1" sx={styles.fieldTitle}>
                  Card Title
                </Typography>
                <Typography variant="caption" sx={styles.fieldHint}>
                  Text displayed as the card heading on the Resources page.
                </Typography>
              </Box>
              <TextField
                size="small"
                fullWidth
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter card title..."
                sx={styles.textField}
              />
            </Box>

            <Box sx={styles.fieldSection}>
              <Box sx={styles.fieldHeader}>
                <Typography variant="body2" sx={styles.fieldTitle}>
                  Card Description
                </Typography>
                <Typography variant="caption" sx={styles.fieldHint}>
                  Subtitle shown below the title on the Resources page.
                </Typography>
              </Box>
              <TextField
                size="small"
                fullWidth
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Enter card description..."
                sx={styles.textField}
              />
            </Box>

            {card.hasLinks && (
              <Box sx={styles.fieldSection}>
                <Box sx={styles.fieldHeader}>
                  <Typography variant="body2" sx={styles.fieldTitle}>
                    Links
                  </Typography>
                  <Typography variant="caption" sx={styles.fieldHint}>
                    Links displayed inside the card body.
                  </Typography>
                </Box>
                <LinksEditor value={links} onChange={handleLinksChange} />
              </Box>
            )}
          </>
        )}
      </Box>

      {versionRows.length > 0 && (
        <Box sx={styles.versionCard}>
          <Box sx={styles.versionHeader}>
            <Typography variant="body2" sx={styles.versionTitle}>
              System Information
            </Typography>
            <Typography variant="caption" sx={styles.versionHint}>
              Read-only. Values are sourced from the runtime environment.
            </Typography>
          </Box>
          <Box sx={styles.versionContent}>
            {versionRows.map((row) => (
              <ResourceVersionRow key={row.id} row={row} onChange={onChange} />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
});

ResourceCard.displayName = "ResourceCard";

const styles = {
  card: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  cardHeader: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
  }),
  cardLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  cardTitle: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    fontSize: "0.875rem",
  }),
  cardHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
  }),
  fieldSection: ({ palette }) => ({
    padding: "1rem 1.25rem",
    borderTop: `1px solid ${palette.border.table}`,
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
  }),
  fieldHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  fieldTitle: {
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  fieldHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
  }),
  textField: {
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
  },
  versionCard: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  versionHeader: ({ palette }) => ({
    padding: "1rem 1.25rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
    borderBottom: `1px solid ${palette.border.table}`,
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  }),
  versionTitle: {
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  versionHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
  }),
  versionContent: ({ palette }) => ({
    display: "flex",
    flexDirection: "column",
    padding: "0.75rem 1.25rem",
    gap: "0",
    backgroundColor: palette.background.default,
  }),
};

export default ResourceCard;