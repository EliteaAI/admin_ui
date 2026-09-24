import { memo, useCallback, useMemo, useState } from 'react';

import ExtensionIcon from '@mui/icons-material/ExtensionOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GuardrailsSection } from '@/components/SchemaForm';

const McpConfigurationSection = memo(props => {
  const { guardrailsDraft, guardrailsFields } = props;

  const styles = mcpConfigurationSectionStyles();

  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => setExpanded(prev => !prev), []);

  // Prefix-based so any new mcp_exposure.* field shows up here automatically
  const mcpFields = useMemo(
    () => guardrailsFields.filter(f => f.path?.startsWith('mcp_exposure.')),
    [guardrailsFields],
  );

  return (
    <Box sx={styles.root}>
      <CollapsibleSection
        icon={ExtensionIcon}
        title="MCP Configuration"
        count={mcpFields.length}
        expanded={expanded}
        onToggle={handleToggle}
        keepMounted
      >
        <GuardrailsSection
          fields={mcpFields}
          values={guardrailsDraft.values}
          onChange={guardrailsDraft.onChange}
        />
      </CollapsibleSection>
    </Box>
  );
});

McpConfigurationSection.displayName = 'McpConfigurationSection';

/** @type {MuiSx} */
const mcpConfigurationSectionStyles = () => ({
  // Same page padding as the other grouped Features pages
  root: {
    padding: '1.5rem',
  },
});

export default McpConfigurationSection;
