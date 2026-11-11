import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

import { SCHEDULES_CARDS } from './constants/schedules.constants';

const SchedulesSection = memo(props => {
  const { schedulesDraft, schedulesFields, initialBlock } = props;

  const styles = schedulesSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(initialBlock);

  const cards = useMemo(
    () =>
      SCHEDULES_CARDS.map(card => ({
        ...card,
        fields: card.fieldKeys.map(key => schedulesFields.find(f => f.key === key)).filter(Boolean),
      })),
    [schedulesFields],
  );

  return (
    <Box sx={styles.root}>
      {cards.map(card => (
        <CollapsibleSection
          key={card.id}
          icon={card.icon}
          title={card.title}
          count={card.fields.length}
          expanded={!!expanded[card.id]}
          sectionId={card.id}
          onToggle={toggle}
          keepMounted
        >
          <GuardrailsSection
            fields={card.fields}
            values={schedulesDraft.values}
            onChange={schedulesDraft.onChange}
          />
        </CollapsibleSection>
      ))}
    </Box>
  );
});

SchedulesSection.displayName = 'SchedulesSection';

/** @type {MuiSx} */
const schedulesSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
  },
});

export default SchedulesSection;
