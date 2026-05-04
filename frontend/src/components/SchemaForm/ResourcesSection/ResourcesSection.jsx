import { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useSystemInfoQuery } from "@/api/configurationApi";
import ResourceCard from "./ResourceCard";

const CARDS = [
  {
    id: "information",
    label: "Information",
    hint: "Shows environment version, plugin versions, and install/upgrade date. Version data is sourced from the environment.",
    hasLinks: false,
    hasContent: true,
    hasVersionLabels: true,
  },
  {
    id: "documentation",
    label: "Documentation",
    hint: "Links to product documentation.",
    hasLinks: true,
    hasContent: true,
  },
  {
    id: "release_notes",
    label: "Release Notes",
    hint: "Links to release notes and changelogs.",
    hasLinks: true,
    hasContent: true,
  },
  {
    id: "video_library",
    label: "Video Library",
    hint: "Links to video tutorials and demos.",
    hasLinks: true,
    hasContent: true,
  },
  {
    id: "tutorials",
    label: "Tutorials",
    hint: "Links to step-by-step guides and tutorials.",
    hasLinks: true,
    hasContent: true,
  },
];

const ResourcesSection = memo((props) => {
  const { values, onChange } = props;

  const { data: systemInfo } = useSystemInfoQuery();

  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Configure the resource cards displayed on the environment-wide Resources
        page. Enable or disable each card and manage the title, description, and
        links shown inside it.
      </Typography>

      {CARDS.map((card) => (
        <ResourceCard
          key={card.id}
          card={card}
          values={values}
          onChange={onChange}
          systemInfo={card.id === "information" ? systemInfo : undefined}
        />
      ))}
    </Box>
  );
});

ResourcesSection.displayName = "ResourcesSection";

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    padding: "1.5rem",
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.8125rem",
    lineHeight: 1.6,
  }),
};

export default ResourcesSection;