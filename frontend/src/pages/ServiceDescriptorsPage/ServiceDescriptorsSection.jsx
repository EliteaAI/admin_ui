import { useCallback, useState } from "react";

import Box from "@mui/material/Box";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";

import SearchIcon from "@/components/Icons/SearchIcon";
import {
  useServiceDescriptorListQuery,
  useServiceDescriptorDeleteMutation,
} from "@/api/serviceDescriptorsApi";
import ServiceDescriptorsTable from "./ServiceDescriptorsTable";
import { memo } from "react";

const ServiceDescriptorsSection = memo(() => {
  const [search, setSearch] = useState("");

  const { data: descriptors = [], isFetching } =
    useServiceDescriptorListQuery();

  const [deleteDescriptor] = useServiceDescriptorDeleteMutation();

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const handleDelete = useCallback(
    async (descriptor) => {
      if (window.confirm(`Are you sure you want to delete this descriptor?`)) {
        try {
          await deleteDescriptor({
            project_id: descriptor.project_id,
            provider_name: descriptor.provider_name,
            service_location_url: descriptor.service_location_url,
          }).unwrap();
        } catch (err) {
          console.error("Failed to delete descriptor", err);
        }
      }
    },
    [deleteDescriptor],
  );

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Box sx={styles.titleContainer}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
            component="div"
          >
            Service Descriptors
          </Typography>
        </Box>
        <Box sx={styles.headerActions}>
          <Box sx={styles.searchInput}>
            <Input
              disableUnderline
              variant="standard"
              placeholder="Search providers or URLs"
              value={search}
              onChange={handleSearchChange}
              sx={styles.searchInputField}
              startAdornment={
                <InputAdornment position="start" sx={styles.inputAdornment}>
                  <SearchIcon />
                </InputAdornment>
              }
            />
          </Box>
        </Box>
      </Box>
      <Box sx={styles.content}>
        <ServiceDescriptorsTable
          descriptors={descriptors}
          search={search}
          onDelete={handleDelete}
          isFetching={isFetching}
        />
      </Box>
    </Box>
  );
});

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  header: ({ palette }) => ({
    height: "3.75rem",
    minHeight: "3.75rem",
    width: "100%",
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 1.5rem",
  }),
  titleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "1rem",
  },
  searchInput: ({ palette }) => ({
    flexShrink: 0,
    width: "15rem",
    height: "2.25rem",
    backgroundColor: palette.background.userInputBackgroundActive,
    borderRadius: "1.6875rem",
    gap: ".5rem",
    borderBottom: "0rem",
    padding: "0.375rem 0.75rem",
    display: "flex",
    alignItems: "center",
  }),
  searchInputField: {
    width: "100%",
    fontSize: ".875rem",
  },
  inputAdornment: {
    width: "1rem",
    height: "1rem",
    minWidth: "1rem",
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
};

export default ServiceDescriptorsSection;
