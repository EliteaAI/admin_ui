import { memo, useMemo } from 'react';

import ExtensionIcon from '@mui/icons-material/ExtensionOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

const MCP_BLOCK_ID = 'mcp_configuration';

const McpConfigurationSection = memo(props => {
  const { guardrailsDraft, guardrailsFields } = props;

  const styles = mcpConfigurationSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(null);

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
        expanded={!!expanded[MCP_BLOCK_ID]}
        onToggle={() => toggle(MCP_BLOCK_ID)}
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
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
  },
});

export default McpConfigurationSection;
