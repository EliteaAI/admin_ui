import { memo, useMemo } from 'react';

import BoltIcon from '@mui/icons-material/BoltOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { AgentIcon } from '@/components/Icons';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

const PUBLISHING_BLOCKS = [
  {
    id: 'agent_publishing',
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
];

const PublishingSection = memo(props => {
  const { guardrailsDraft, guardrailsFields, initialBlock } = props;

  const styles = publishingSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(initialBlock);

  const blocks = useMemo(
    () =>
      PUBLISHING_BLOCKS.map(block => ({
        ...block,
        fields: guardrailsFields.filter(f => f.path?.startsWith(block.pathPrefix)),
      })),
    [guardrailsFields],
  );

  return (
    <Box sx={styles.root}>
      {blocks.map(block => (
        <CollapsibleSection
          key={block.id}
          icon={block.icon}
          title={block.title}
          count={block.fields.length}
          expanded={!!expanded[block.id]}
          onToggle={() => toggle(block.id)}
          keepMounted
        >
          <GuardrailsSection
            fields={block.fields}
            values={guardrailsDraft.values}
            onChange={guardrailsDraft.onChange}
          />
        </CollapsibleSection>
      ))}
    </Box>
  );
});

PublishingSection.displayName = 'PublishingSection';

/** @type {MuiSx} */
const publishingSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
  },
});

export default PublishingSection;
