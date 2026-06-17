import { memo, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BlockIcon from "@mui/icons-material/BlockOutlined";
import GppMaybeIcon from "@mui/icons-material/GppMaybeOutlined";
import ExtensionIcon from "@mui/icons-material/ExtensionOutlined";
import PublishIcon from "@mui/icons-material/PublishOutlined";
import SchemaField from "./SchemaField";

const SECTION_CONFIG = [
  {
    id: "blocked_toolkits_tools",
    title: "Blocked Toolkits & Tools",
    icon: BlockIcon,
    fields: ["blocked_toolkits", "blocked_tools"],
  },
  {
    id: "sensitive_actions",
    title: "Sensitive Actions",
    icon: GppMaybeIcon,
    fields: [
      "sensitive_tools",
      "sensitive_action_company_name",
      "sensitive_action_message_template",
    ],
  },
  {
    id: "mcp_configuration",
    title: "MCP Configuration",
    icon: ExtensionIcon,
    fields: ["mcp_enabled", "mcp_in_menu"],
  },
  {
    id: "block_agent_publishing",
    title: "Agent Publishing",
    icon: PublishIcon,
    fields: [
      "is_publish_blocked",
      "publish_whitelist_project_ids",
      "publish_validation_rules",
    ],
  },
];

const FieldCard = memo((props) => {
  const { field, values, onChange } = props;
  const styles = guardRailsStyles();

  const isBoolean = field.type === "boolean";
  const expandable = useMemo(() => {
    if (field.type === "object" && !field.additionalProperties?.type)
      return true;

    if (
      field.type === "array" &&
      field.items?.type !== "string" &&
      !(field.items?.type === "integer" && field.enum_source) &&
      !(field.items?.type === "object" && field.items?.properties?.login)
    )
      return true;

    return false;
  }, [field]);

  return (
    <Box sx={[styles.fieldCard, expandable && styles.fieldCardExpand]}>
      <Box sx={styles.fieldHeader}>
        <Box sx={styles.fieldTitleRow}>
          <Typography variant="body2" sx={styles.fieldTitle}>
            {field.title || field.key}
          </Typography>
          {field.requires_restart && (
            <Chip
              label="Reload required"
              size="small"
              color="warning"
              variant="outlined"
              sx={styles.restartChip}
            />
          )}
        </Box>
        {isBoolean && (
          <Switch
            checked={!!values[field.key]}
            onChange={(e) => onChange(field.key, e.target.checked)}
            size="small"
          />
        )}
      </Box>
      {field.description && (
        <Typography variant="caption" sx={styles.fieldDescription}>
          {field.description}
        </Typography>
      )}
      {!isBoolean && (
        <Box
          sx={[styles.fieldControl, expandable && styles.fieldControlExpand]}
        >
          <SchemaField
            field={field}
            value={values[field.key]}
            onChange={(val) => onChange(field.key, val)}
          />
        </Box>
      )}
    </Box>
  );
});

const CollapsibleSection = (props) => {
  const { section, fields, values, onChange, expanded, onToggle } = props;

  const styles = guardRailsStyles();

  const IconComponent = section.icon;
  const hasFields = fields.length > 0;

  if (!hasFields) return null;

  return (
    <Box sx={styles.sectionContainer}>
      <Box sx={styles.sectionHeader(expanded)} onClick={onToggle}>
        <Box sx={styles.sectionTitleRow}>
          <IconComponent sx={styles.sectionIcon} />
          <Typography variant="body1" sx={styles.sectionTitle}>
            {section.title}
          </Typography>
          <Typography variant="caption" sx={styles.fieldCount}>
            {fields.length} {fields.length === 1 ? "setting" : "settings"}
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={styles.expandIcon(expanded)}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={styles.sectionContent}>
          {fields.map((field) => (
            <FieldCard
              key={field.key}
              field={field}
              values={values}
              onChange={onChange}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const GuardrailsSection = memo((props) => {
  const { fields, values, sectionDescription, onChange, defaultExpanded = false } = props;

  const styles = guardRailsStyles();

  const [expandedSections, setExpandedSections] = useState(
    () => defaultExpanded
      ? Object.fromEntries(SECTION_CONFIG.map((s) => [s.id, true]))
      : {},
  );

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Filter visible fields based on visible_when conditions
  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.visible_when) return true;

      const conditions = Array.isArray(field.visible_when)
        ? field.visible_when
        : [field.visible_when];

      return conditions.every(({ field: condField, value: condValue }) => {
        const currentValue = values[condField];

        if (typeof currentValue === "string" && typeof condValue === "string")
          return currentValue.toLowerCase() === condValue.toLowerCase();

        return currentValue === condValue;
      });
    });
  }, [fields, values]);

  // Group fields by section
  const groupedSections = useMemo(() => {
    const fieldsByKey = {};

    visibleFields.forEach((field) => {
      fieldsByKey[field.key] = field;
    });

    return SECTION_CONFIG.map((section) => ({
      ...section,
      fields: section.fields.map((key) => fieldsByKey[key]).filter(Boolean),
    })).filter((section) => section.fields.length > 0);
  }, [visibleFields]);

  // Find fields not in any section
  const ungroupedFields = useMemo(() => {
    const groupedKeys = new Set(SECTION_CONFIG.flatMap((s) => s.fields));

    return visibleFields.filter((field) => !groupedKeys.has(field.key));
  }, [visibleFields]);

  if (visibleFields.length === 0) {
    return (
      <Box sx={styles.empty}>
        <Typography variant="body2" color="text.metrics">
          No configurable fields available for this section.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      {sectionDescription && (
        <Typography variant="body2" sx={styles.sectionDescription}>
          {sectionDescription}
        </Typography>
      )}

      {groupedSections.map((section) => (
        <CollapsibleSection
          key={section.id}
          section={section}
          fields={section.fields}
          values={values}
          onChange={onChange}
          expanded={!!expandedSections[section.id]}
          onToggle={() => toggleSection(section.id)}
        />
      ))}

      {ungroupedFields.length > 0 && (
        <Box sx={styles.ungroupedSection}>
          {ungroupedFields.map((field) => (
            <FieldCard
              key={field.key}
              field={field}
              values={values}
              onChange={onChange}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

/** @type {MuiSx} */
const guardRailsStyles = () => ({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sectionDescription: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.8125rem",
    lineHeight: 1.6,
    marginBottom: "0.5rem",
  }),
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
  },
  sectionContainer: ({ palette }) => ({
    borderRadius: "0.5rem",
    border: `1px solid ${palette.border.table}`,
    overflow: "visible",
  }),
  sectionHeader:
    (expanded) =>
    ({ palette }) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.75rem 1rem",
      minHeight: "3rem",
      cursor: "pointer",
      backgroundColor: expanded
        ? palette.background.userInputBackgroundActive
        : "transparent",
      borderRadius: expanded ? "0.5rem 0.5rem 0 0" : "0.5rem",
      transition: "background-color 0.2s ease",

      "&:hover": {
        backgroundColor: palette.background.userInputBackgroundActive,
      },
    }),
  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexShrink: 0,
  },
  sectionIcon: ({ palette }) => ({
    fontSize: "1.25rem",
    color: palette.text.metrics,
  }),
  sectionTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: "0.875rem",
    color: palette.text.secondary,
    whiteSpace: "nowrap",
  }),
  fieldCount: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
    backgroundColor: palette.background.hover,
    padding: "0.125rem 0.5rem",
    borderRadius: "0.25rem",
    whiteSpace: "nowrap",
    flexShrink: 0,
  }),
  expandIcon: (expanded) => ({
    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
    transition: "transform 0.2s ease",
    flexShrink: 0,
  }),
  sectionContent: ({ palette }) => ({
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    borderTop: `1px solid ${palette.border.table}`,
    backgroundColor: "transparent",
    borderRadius: "0 0 0.5rem 0.5rem",
  }),
  ungroupedSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  fieldCard: ({ palette }) => ({
    padding: "0.875rem 1rem",
    borderRadius: "0.5rem",
    border: `1px solid ${palette.border.table}`,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    backgroundColor: "transparent",
  }),
  fieldHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    minHeight: "1.75rem",
  },
  fieldTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  fieldTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: "0.8125rem",
    color: palette.text.secondary,
  }),
  fieldDescription: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
    lineHeight: 1.5,
  }),
  fieldControl: {
    marginTop: "0.375rem",
  },
  fieldCardExpand: {
    minHeight: "12.5rem",
  },
  fieldControlExpand: {
    display: "flex",
    flexDirection: "column",
    minHeight: "9.375rem",
  },
  restartChip: {
    fontSize: "0.625rem",
    height: "1.125rem",
    "& .MuiChip-label": {
      padding: "0 0.375rem",
    },
  },
});

export default GuardrailsSection;
