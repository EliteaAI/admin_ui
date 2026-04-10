import { useCallback, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import DeleteIcon from "@mui/icons-material/Delete";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import {
  useProjectListQuery,
  useProjectSuspendMutation,
} from "@/api/projectsApi";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { usePageTitle } from "@/hooks/usePageTitle";

import ProjectsTable from "./ProjectsTable";
import DeleteProjectDialog from "./DeleteProjectDialog";
import CreateProjectDialog from "./CreateProjectDialog";
import AddProjectAdminDialog from "./AddProjectAdminDialog";
import ProjectActivityDrawer from "./ProjectActivityDrawer";

const PROJECT_TYPES = ["team", "personal"];

function ProjectsPage() {
  usePageTitle("Projects");

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  // New action state
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminProject, setAddAdminProject] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityProject, setActivityProject] = useState(null);

  const [suspendProject] = useProjectSuspendMutation();

  const projectType = PROJECT_TYPES[activeTab];

  const { data, isFetching, isError } = useProjectListQuery(
    {
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      project_type: projectType,
    },
    { refetchOnMountOrArgChange: true },
  );

  const projects = data?.rows ?? [];
  const total = data?.total ?? 0;
  const counts = data?.counts ?? {};

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearch("");
    setSelectedIds([]);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0);
    setSelectedIds([]);
  }, []);

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("asc");
      return field;
    });
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    setSelectedIds([]);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(0);
    setSelectedIds([]);
  }, []);

  const handleDelete = useCallback((ids) => {
    setDeleteIds(ids);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setDeleteIds([]);
    setSelectedIds([]);
  }, []);

  const handleCreateOpen = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleCreateClose = useCallback(() => {
    setCreateOpen(false);
  }, []);

  // Add admin handlers
  const handleAddAdmin = useCallback((project) => {
    setAddAdminProject(project);
    setAddAdminOpen(true);
  }, []);

  const handleAddAdminClose = useCallback(() => {
    setAddAdminOpen(false);
    setAddAdminProject(null);
  }, []);

  // Suspend handler
  const handleSuspend = useCallback(
    async (project) => {
      const newSuspended = project.status !== "suspended";
      try {
        await suspendProject({
          projectId: project.id,
          suspended: newSuspended,
        }).unwrap();
      } catch (err) {
        // Error handling via RTK Query cache invalidation
      }
    },
    [suspendProject],
  );

  // Activity drawer handlers
  const handleActivity = useCallback((project) => {
    setActivityProject(project);
    setActivityOpen(true);
  }, []);

  const handleActivityClose = useCallback(() => {
    setActivityOpen(false);
    setActivityProject(null);
  }, []);

  const extraContent =
    selectedIds.length > 0 ? (
      <Button
        variant="outlined"
        color="error"
        size="small"
        startIcon={<DeleteIcon />}
        onClick={() => handleDelete(selectedIds)}
      >
        Delete ({selectedIds.length})
      </Button>
    ) : null;

  const teamLabel = `Team Projects${counts.team != null ? ` (${counts.team})` : ""}`;
  const personalLabel = `Personal Projects${counts.personal != null ? ` (${counts.personal})` : ""}`;

  const tabsElement = (
    <Tabs value={activeTab} onChange={handleTabChange} sx={styles.tabs}>
      <Tab label={teamLabel} sx={styles.tab} />
      <Tab label={personalLabel} sx={styles.tab} />
    </Tabs>
  );

  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="Projects"
          tabs={tabsElement}
          showSearchInput
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by Name, ID and Owner"
          searchInputSx={{ '& input::placeholder': { fontSize: '0.75rem' } }}
          showAddButton
          onAdd={handleCreateOpen}
          addButtonTooltip="Create project"
          extraContent={extraContent}
        />

        <Box sx={styles.tableContainer}>
          {isError ? (
            <Box sx={styles.errorContainer}>Failed to load projects.</Box>
          ) : (
            <ProjectsTable
              projects={projects}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              sortConfig={{ field: sortBy, direction: sortOrder }}
              onSort={handleSort}
              isFetching={isFetching}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDelete={handleDelete}
              onAddAdmin={handleAddAdmin}
              onSuspend={handleSuspend}
              onActivity={handleActivity}
            />
          )}
        </Box>
      </DrawerPage>

      <DeleteProjectDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        projectIds={deleteIds}
      />
      <CreateProjectDialog open={createOpen} onClose={handleCreateClose} />
      <AddProjectAdminDialog
        open={addAdminOpen}
        onClose={handleAddAdminClose}
        project={addAdminProject}
      />
      <ProjectActivityDrawer
        open={activityOpen}
        onClose={handleActivityClose}
        project={activityProject}
      />
    </>
  );
}

const styles = {
  tabs: ({ palette }) => ({
    minHeight: "2.5rem",
    "& .MuiTabs-indicator": {
      backgroundColor: palette.text.secondary,
    },
  }),
  tab: ({ palette }) => ({
    textTransform: "none",
    minHeight: "2.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: palette.text.metrics,
    "&.Mui-selected": {
      color: palette.text.secondary,
    },
  }),
  tableContainer: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    maxWidth: "100%",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: "3rem",
    color: "error.main",
  },
};

export default ProjectsPage;
