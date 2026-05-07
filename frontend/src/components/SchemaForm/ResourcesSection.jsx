import { memo, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import NewReleasesOutlinedIcon from "@mui/icons-material/NewReleasesOutlined";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { useSystemInfoQuery } from "@/api/configurationApi";
import CollapsibleSection from "@/components/CollapsibleSection";
import ResourceCard from "./ResourceCard";

const CARDS = [
  {
    id: "information",
    label: "Information",
    icon: InfoOutlinedIcon,
    hint: "Shows environment version, plugin versions, and install/upgrade date. Version data is sourced from the environment.",
    hasLinks: false,
    hasContent: false,
    hasVersionLabels: true,
  },
  {
    id: "documentation",
    label: "Documentation",
    icon: ArticleOutlinedIcon,
    hint: "Links to product documentation.",
    hasLinks: true,
    hasContent: true,
  },
  {
    id: "release_notes",
    label: "Release Notes",
    icon: NewReleasesOutlinedIcon,
    hint: "Links to release notes and changelogs.",
    hasLinks: true,
    hasContent: true,
  },
  {
    id: "video_library",
    label: "Video Library",
    icon: VideoLibraryOutlinedIcon,
    hint: "Links to video tutorials and demos.",
    hasLinks: true,
    hasContent: true,
  },
  {
    id: "tutorials",
    label: "Tutorials",
    icon: SchoolOutlinedIcon,
    hint: "Links to step-by-step guides and tutorials.",
    hasLinks: true,
    hasContent: true,
  },
];

const getSettingsCount = card => {
  let count = 1; // enabled toggle
  if (card.hasVersionLabels) count += 2; // version + upgrade_date
  if (card.hasContent) count += 2; // title + description
  if (card.hasLinks) count += 1; // links
  return count;
};

const ResourcesSection = memo(props => {
  const { values, onChange } = props;

  const { data: systemInfo } = useSystemInfoQuery();

  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = useCallback(sectionId => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  return (
    <Box sx={styles.root}>
      <Typography
        variant="body2"
        sx={styles.description}
      >
        Configure the resource cards displayed on the environment-wide Resources page. Enable or disable each
        card and manage the title, description, and links shown inside it.
      </Typography>

      {CARDS.map(card => (
        <CollapsibleSection
          key={card.id}
          icon={card.icon}
          title={card.label}
          count={getSettingsCount(card)}
          expanded={!!expandedSections[card.id]}
          onToggle={() => toggleSection(card.id)}
        >
          <ResourceCard
            card={card}
            values={values}
            onChange={onChange}
            systemInfo={card.id === "information" ? systemInfo : undefined}
          />
        </CollapsibleSection>
      ))}
    </Box>
  );
});

ResourcesSection.displayName = "ResourcesSection";

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1.5rem",
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.8125rem",
    lineHeight: 1.6,
    marginBottom: "0.5rem",
  }),
};

export default ResourcesSection;
