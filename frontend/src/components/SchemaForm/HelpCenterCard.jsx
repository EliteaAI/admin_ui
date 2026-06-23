import { memo, useCallback, useMemo } from "react";
import { Box, Divider, Switch, TextField, Typography } from "@mui/material";
import LinksEditor from "@/components/SchemaForm/LinksEditor";
import ResourceVersionRow from "@/components/SchemaForm/ResourceVersionRow";

const HelpCenterCard = memo((props) => {
  const { card, values, onChange, systemInfo } = props;

  const key = (field) => `resources_${card.id}_${field}`;
  const getCardValue = (field, defaultValue) =>
    values?.[key(field)] ?? defaultValue;

  const enabled = getCardValue("enabled", true);
  const title = getCardValue("title", "");
  const description = getCardValue("description", "");
  const links = getCardValue("links", []);
  const versionValue = getCardValue("version", "");
  const upgradeDateValue = getCardValue("upgrade_date", "");

  const handleToggle = () => {
    onChange(key("enabled"), !enabled);
  };

  const handleTitleChange = (event) => {
    onChange(key("title"), event.target.value);
  };

  const handleDescriptionChange = (event) => {
    onChange(key("description"), event.target.value);
  };

  const handleLinksChange = useCallback(
    (newLinks) => {
      onChange(key("links"), newLinks);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card.id, onChange],
  );

  const versionRows = useMemo(() => {
    if (!card.hasVersionLabels) return [];

    const rows = [];

    rows.push({
      id: "version",
      label: "Release Version",
      value: versionValue,
      labelKey: null,
      valueKey: key("version"),
    });

    rows.push({
      id: "upgrade_date",
      label: "Released on",
      value: upgradeDateValue,
      labelKey: null,
      valueKey: key("upgrade_date"),
    });

    for (const plugin of systemInfo?.plugins ?? []) {
      rows.push({
        id: plugin.name,
        label: plugin.name,
        value: plugin.version,
        labelKey: null,
        valueKey: null,
      });
    }

    return rows;
  }, [
    card.hasVersionLabels,
    card.id,
    systemInfo,
    versionValue,
    upgradeDateValue,
  ]);

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
                  Text displayed as the card heading on the Help Center page.
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
                  Subtitle shown below the title on the Help Center page.
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
              Version and date are editable. Plugin versions are sourced from
              the runtime environment.
            </Typography>
          </Box>
          <Box sx={styles.versionContent}>
            {versionRows
              .filter((r) => r.valueKey)
              .map((row) => (
                <ResourceVersionRow
                  key={row.id}
                  row={row}
                  onChange={onChange}
                />
              ))}
            {versionRows.some((r) => !r.valueKey) && (
              <Divider sx={{ my: "0.25rem" }} />
            )}
            {versionRows
              .filter((r) => !r.valueKey)
              .map((row) => (
                <ResourceVersionRow
                  key={row.id}
                  row={row}
                  onChange={onChange}
                />
              ))}
          </Box>
        </Box>
      )}
    </>
  );
});

HelpCenterCard.displayName = "HelpCenterCard";

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
    gap: "0.5rem",
    backgroundColor: palette.background.default,
  }),
};

export default HelpCenterCard;
