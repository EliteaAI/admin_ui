import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const CollapsibleSection = memo(props => {
  const { icon: IconComponent, title, count, expanded, onToggle, children } = props;

  const handleChevronClick = useCallback(
    e => {
      e.stopPropagation();
      onToggle();
    },
    [onToggle],
  );

  const countLabel = count !== undefined
    ? `${count} ${count === 1 ? "setting" : "settings"}`
    : null;

  return (
    <Box sx={styles.sectionContainer}>
      <Box sx={styles.sectionHeader(expanded)} onClick={onToggle}>
        <Box sx={styles.sectionTitleRow}>
          {IconComponent && <IconComponent sx={styles.sectionIcon} />}
          <Typography variant="body1" sx={styles.sectionTitle}>
            {title}
          </Typography>
          {countLabel && (
            <Typography variant="caption" sx={styles.fieldCount}>
              {countLabel}
            </Typography>
          )}
        </Box>
        <IconButton size="small" sx={styles.expandIcon(expanded)} onClick={handleChevronClick}>
          <ExpandMoreIcon />
        </IconButton>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={styles.sectionContent}>{children}</Box>
      </Collapse>
    </Box>
  );
});

CollapsibleSection.displayName = "CollapsibleSection";

const styles = {
  sectionContainer: ({ palette }) => ({
    borderRadius: "0.5rem",
    border: `1px solid ${palette.border.table}`,
    overflow: "visible",
  }),
  sectionHeader:
    expanded =>
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
  expandIcon: expanded => ({
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
};

export default CollapsibleSection;
