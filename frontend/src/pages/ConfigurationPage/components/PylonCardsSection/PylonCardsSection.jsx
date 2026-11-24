import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SchemaForm } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/hooks/useExpandedBlocks.hooks';

import { PYLON_CARDS_BY_SECTION } from './constants/pylonCards.constants';
import { buildPylonCards } from './helpers/pylonCards.helpers';

const PylonCardsSection = memo(props => {
  const { sectionId, fields, values, sectionDescription, onChange } = props;

  const styles = pylonCardsSectionStyles();

  // Every card starts collapsed, like the Features page. The toggle never touches values, so nothing is saved or dropped.
  const { expanded, toggle } = useExpandedBlocks();

  const cards = useMemo(
    () => buildPylonCards(fields, values, PYLON_CARDS_BY_SECTION[sectionId] ?? []),
    [fields, values, sectionId],
  );

  // No visible settings: SchemaForm renders the section description with its empty-state message
  if (cards.length === 0) {
    return (
      <SchemaForm
        fields={[]}
        values={values}
        sectionDescription={sectionDescription}
        onChange={onChange}
      />
    );
  }

  return (
    <Box sx={styles.root}>
      {sectionDescription && (
        <Typography
          variant="body2"
          sx={styles.sectionDescription}
        >
          {sectionDescription}
        </Typography>
      )}

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
          <SchemaForm
            fields={card.fields}
            values={values}
            onChange={onChange}
          />
        </CollapsibleSection>
      ))}
    </Box>
  );
});

PylonCardsSection.displayName = 'PylonCardsSection';

/** @type {MuiSx} */
const pylonCardsSectionStyles = () => ({
  root: {
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
});

export default PylonCardsSection;
