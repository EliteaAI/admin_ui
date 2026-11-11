import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

import { WEBHOOKS_CARD } from './constants/webhooks.constants';

const WebhooksSection = memo(props => {
  const { webhooksDraft, webhooksFields, initialBlock } = props;

  const styles = webhooksSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(initialBlock);

  const fields = useMemo(
    () => WEBHOOKS_CARD.fieldKeys.map(key => webhooksFields.find(f => f.key === key)).filter(Boolean),
    [webhooksFields],
  );

  return (
    <Box sx={styles.root}>
      <CollapsibleSection
        icon={WEBHOOKS_CARD.icon}
        title={WEBHOOKS_CARD.title}
        count={fields.length}
        expanded={!!expanded[WEBHOOKS_CARD.id]}
        sectionId={WEBHOOKS_CARD.id}
        onToggle={toggle}
        keepMounted
      >
        <GuardrailsSection
          fields={fields}
          values={webhooksDraft.values}
          onChange={webhooksDraft.onChange}
        />
      </CollapsibleSection>
    </Box>
  );
});

WebhooksSection.displayName = 'WebhooksSection';

/** @type {MuiSx} */
const webhooksSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
  },
});

export default WebhooksSection;
