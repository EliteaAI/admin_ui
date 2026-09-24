import { memo, useCallback, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { getNestedValue } from '@/pages/FeaturesPage/components/CustomThemeSection/helpers/nestedValue.helpers';

import ColorPickerField from './ColorPickerField';

const ColorCategoryGroup = memo(props => {
  const { category, palette, onChange, defaultExpanded = false } = props;

  const styles = colorCategoryGroupStyles();

  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // How many of this category's tokens the theme actually defines
  const countLabel = useMemo(() => {
    const filledCount = category.colors.filter(color => getNestedValue(palette, color.key)).length;

    return `${filledCount}/${category.colors.length} colors`;
  }, [category, palette]);

  return (
    <CollapsibleSection
      icon={category.icon}
      title={category.title}
      count={countLabel}
      expanded={expanded}
      onToggle={handleToggle}
    >
      {category.description && (
        <Typography
          variant="caption"
          sx={styles.description}
        >
          {category.description}
        </Typography>
      )}

      <Box sx={styles.colorGrid}>
        {category.colors.map(color => (
          <ColorPickerField
            key={color.key}
            label={color.label}
            hint={color.hint}
            colorKey={color.key}
            value={getNestedValue(palette, color.key) || ''}
            onChange={onChange}
          />
        ))}
      </Box>
    </CollapsibleSection>
  );
});

ColorCategoryGroup.displayName = 'ColorCategoryGroup';

ColorCategoryGroup.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    description: PropTypes.string,
    colors: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        hint: PropTypes.string,
      }),
    ).isRequired,
  }).isRequired,
  palette: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  defaultExpanded: PropTypes.bool,
};

/** @type {MuiSx} */
const colorCategoryGroupStyles = () => ({
  description: ({ palette }) => ({
    display: 'block',
    color: palette.text.metrics,
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
  }),
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
    gap: '1rem',
  },
});

export default ColorCategoryGroup;
