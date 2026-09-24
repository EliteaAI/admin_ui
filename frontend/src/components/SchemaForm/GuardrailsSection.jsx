import { memo, useCallback, useMemo, useState } from 'react';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BlockIcon from '@mui/icons-material/BlockOutlined';
import BoltIcon from '@mui/icons-material/BoltOutlined';
import ExtensionIcon from '@mui/icons-material/ExtensionOutlined';
import GppMaybeIcon from '@mui/icons-material/GppMaybeOutlined';
import { Box, Typography } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { AgentIcon } from '@/components/Icons';

import GuardrailsFieldCard from './components/GuardrailsFieldCard';

const SECTION_CONFIG = [
  {
    id: 'blocked_toolkits_tools',
    title: 'Blocked Toolkits & Tools',
    icon: BlockIcon,
    fields: ['blocked_toolkits', 'blocked_tools'],
  },
  {
    id: 'sensitive_actions',
    title: 'Sensitive Actions',
    icon: GppMaybeIcon,
    fields: ['sensitive_tools', 'sensitive_action_company_name', 'sensitive_action_message_template'],
  },
  {
    id: 'mcp_configuration',
    title: 'MCP Configuration',
    icon: ExtensionIcon,
    // pathPrefix claims every field under this config namespace, so new
    // mcp_exposure.* fields nest here automatically.
    pathPrefix: 'mcp_exposure.',
  },
  {
    id: 'block_agent_publishing',
    title: 'Agent Publishing',
    icon: AgentIcon,
    pathPrefix: 'publishing_guardrail.',
  },
  {
    id: 'skill_publishing',
    title: 'Skill Publishing',
    icon: BoltIcon,
    pathPrefix: 'skill_publishing_guardrail.',
  },
  {
    id: 'enhance_with_ai',
    title: 'Enhance with AI',
    icon: AutoAwesomeIcon,
    pathPrefix: 'enhance_guardrail.',
  },
];

// Does a section claim a given field? By explicit key list, or by config-path prefix.
const sectionClaimsField = (section, field) =>
  (section.fields?.includes(field.key) ?? false) ||
  (section.pathPrefix ? field.path?.startsWith(section.pathPrefix) : false);

const GuardrailsSection = memo(props => {
  // ungrouped renders the fields flat, for callers that already wrap them in their own collapsible block
  const { fields, values, sectionDescription, onChange, defaultExpanded = false, ungrouped = false } = props;

  const styles = guardrailsSectionStyles();

  const [expandedSections, setExpandedSections] = useState(() =>
    defaultExpanded ? Object.fromEntries(SECTION_CONFIG.map(s => [s.id, true])) : {},
  );

  const toggleSection = useCallback(sectionId => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // Filter visible fields based on visible_when conditions
  const visibleFields = useMemo(() => {
    return fields.filter(field => {
      if (!field.visible_when) return true;

      const conditions = Array.isArray(field.visible_when) ? field.visible_when : [field.visible_when];

      return conditions.every(({ field: condField, value: condValue }) => {
        const currentValue = values[condField];

        if (typeof currentValue === 'string' && typeof condValue === 'string')
          return currentValue.toLowerCase() === condValue.toLowerCase();

        return currentValue === condValue;
      });
    });
  }, [fields, values]);

  // Group fields by section (explicit key list or config-path prefix)
  const groupedSections = useMemo(() => {
    if (ungrouped) return [];

    const fieldsByKey = {};
    visibleFields.forEach(field => {
      fieldsByKey[field.key] = field;
    });

    return SECTION_CONFIG.map(section => ({
      ...section,
      // Key-based sections keep their declared field order; prefix-based sections
      // take whatever order the backend returns.
      fields: section.fields
        ? section.fields.map(key => fieldsByKey[key]).filter(Boolean)
        : visibleFields.filter(field => sectionClaimsField(section, field)),
    })).filter(section => section.fields.length > 0);
  }, [visibleFields, ungrouped]);

  // Find fields not claimed by any section
  const ungroupedFields = useMemo(() => {
    if (ungrouped) return visibleFields;

    return visibleFields.filter(field => !SECTION_CONFIG.some(section => sectionClaimsField(section, field)));
  }, [visibleFields, ungrouped]);

  if (visibleFields.length === 0) {
    return (
      <Box sx={styles.empty}>
        <Typography
          variant="body2"
          color="text.metrics"
        >
          No configurable fields available for this section.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      {sectionDescription && (
        <Typography
          variant="body2"
          sx={styles.sectionDescription}
        >
          {sectionDescription}
        </Typography>
      )}

      {groupedSections.map(section => (
        <CollapsibleSection
          key={section.id}
          icon={section.icon}
          title={section.title}
          count={section.fields.length}
          expanded={!!expandedSections[section.id]}
          onToggle={() => toggleSection(section.id)}
        >
          {section.fields.map(field => (
            <GuardrailsFieldCard
              key={field.key}
              field={field}
              values={values}
              onChange={onChange}
            />
          ))}
        </CollapsibleSection>
      ))}

      {ungroupedFields.length > 0 && (
        <Box sx={styles.ungroupedSection}>
          {ungroupedFields.map(field => (
            <GuardrailsFieldCard
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

GuardrailsSection.displayName = 'GuardrailsSection';

/** @type {MuiSx} */
const guardrailsSectionStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionDescription: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
    marginBottom: '0.5rem',
  }),
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
  },
  ungroupedSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
});

export default GuardrailsSection;
