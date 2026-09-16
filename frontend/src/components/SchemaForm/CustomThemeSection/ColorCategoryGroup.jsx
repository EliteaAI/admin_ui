import { memo, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";

import CollapsibleSection from "@/components/CollapsibleSection";
import ColorPickerField from "./ColorPickerField";
import { getNestedValue } from "./constants";

const ColorCategoryGroup = memo((props) => {
  const { category, palette, onChange, defaultExpanded = false } = props;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleColorChange = useCallback(
    (colorKey, value) => {
      onChange(colorKey, value);
    },
    [onChange],
  );

  // Count colors with values
  const colorCount = category.colors.length;
  const filledCount = category.colors.filter(
    (color) => getNestedValue(palette, color.key),
  ).length;

  const countLabel = `${filledCount}/${colorCount} colors`;

  return (
    <CollapsibleSection
      icon={category.icon}
      title={category.title}
      count={colorCount}
      expanded={expanded}
      onToggle={handleToggle}
    >
      {category.description && (
        <Typography variant="caption" sx={styles.description}>
          {category.description}
        </Typography>
      )}

      <Box sx={styles.colorInfo}>
        <Typography variant="caption" sx={styles.colorCount}>
          {countLabel}
        </Typography>
      </Box>

      <Box sx={styles.colorGrid}>
        {category.colors.map((color) => (
          <ColorPickerField
            key={color.key}
            label={color.label}
            hint={color.hint}
            colorKey={color.key}
            value={getNestedValue(palette, color.key) || ""}
            onChange={handleColorChange}
          />
        ))}
      </Box>
    </CollapsibleSection>
  );
});

ColorCategoryGroup.displayName = "ColorCategoryGroup";

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

const styles = {
  description: ({ palette }) => ({
    display: "block",
    color: palette.text.metrics,
    fontSize: "0.75rem",
    marginBottom: "0.5rem",
  }),
  colorInfo: {
    marginBottom: "1rem",
  },
  colorCount: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
    backgroundColor: palette.background.hover,
    padding: "0.125rem 0.5rem",
    borderRadius: "0.25rem",
  }),
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))",
    gap: "1rem",
  },
};

export default ColorCategoryGroup;
