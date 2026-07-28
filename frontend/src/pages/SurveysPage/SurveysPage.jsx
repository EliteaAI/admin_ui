import { memo, useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useSurveysListQuery,
  useSurveyCreateMutation,
  useSurveyUpdateMutation,
  useSurveyDeleteMutation,
} from "@/api/surveysApi";
import SurveyList from "./SurveyList";
import SurveyEditor from "./SurveyEditor";

const NEW_SURVEY = {
  name: "",
  description: "",
  enabled: false,
  dismissible: false,
  questions: [],
};

const SurveysPage = memo(() => {
  usePageTitle("Surveys");

  const [selectedId, setSelectedId] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [localSurvey, setLocalSurvey] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { data: surveys = [] } = useSurveysListQuery();
  const [createSurvey, { isLoading: creating }] = useSurveyCreateMutation();
  const [updateSurvey, { isLoading: updating }] = useSurveyUpdateMutation();
  const [deleteSurvey, { isLoading: deleting }] = useSurveyDeleteMutation();

  const saving = creating || updating || deleting;

  const serverSurvey = useMemo(
    () => surveys.find((s) => s.id === selectedId) ?? null,
    [surveys, selectedId],
  );

  const isDirty = useMemo(() => {
    if (isNew) return true;
    if (!serverSurvey || !localSurvey) return false;
    return JSON.stringify(localSurvey) !== JSON.stringify(serverSurvey);
  }, [isNew, serverSurvey, localSurvey]);

  const confirmDiscard = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Discard them?");
  }, [isDirty]);

  const handleSelect = useCallback(
    (id) => {
      if (id === selectedId) return;
      if (!confirmDiscard()) return;
      const survey = surveys.find((s) => s.id === id);
      setSelectedId(id);
      setIsNew(false);
      setLocalSurvey(survey ? structuredClone(survey) : null);
    },
    [selectedId, surveys, confirmDiscard],
  );

  const handleAddNew = useCallback(() => {
    if (!confirmDiscard()) return;
    setSelectedId(null);
    setIsNew(true);
    setLocalSurvey(structuredClone(NEW_SURVEY));
  }, [confirmDiscard]);

  const handleChange = useCallback((updated) => {
    setLocalSurvey(updated);
  }, []);

  const handleSave = useCallback(async () => {
    if (!localSurvey?.name?.trim()) return;
    try {
      const payload = {
        name: localSurvey.name,
        description: localSurvey.description || null,
        enabled: localSurvey.enabled ?? false,
        dismissible: localSurvey.dismissible ?? false,
        questions: (localSurvey.questions || []).map((q) => ({
          ...(q.id ? { id: q.id } : {}),
          title: q.title,
          question_type: q.question_type || "open",
          options: q.options ?? null,
          position: q.position ?? 0,
        })),
      };

      if (isNew) {
        const result = await createSurvey(payload).unwrap();
        const created = result.result ?? result;
        setSelectedId(created.id);
        setIsNew(false);
        setLocalSurvey(structuredClone(created));
        setSnackbar({
          open: true,
          message: "Survey created successfully",
          severity: "success",
        });
      } else {
        const result = await updateSurvey({
          surveyId: selectedId,
          ...payload,
        }).unwrap();
        const updated = result.result ?? result;
        setLocalSurvey(structuredClone(updated));
        setSnackbar({
          open: true,
          message: "Survey saved successfully",
          severity: "success",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to save: ${err?.data?.error || err?.message || "Unknown error"}`,
        severity: "error",
      });
    }
  }, [localSurvey, isNew, selectedId, createSurvey, updateSurvey]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteDialogOpen(false);
    try {
      await deleteSurvey(selectedId).unwrap();
      setSelectedId(null);
      setLocalSurvey(null);
      setIsNew(false);
      setSnackbar({
        open: true,
        message: "Survey deleted",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to delete: ${err?.data?.error || err?.message || "Unknown error"}`,
        severity: "error",
      });
    }
  }, [selectedId, deleteSurvey]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <DrawerPage sx={{ overflow: "hidden" }}>
      <DrawerPageHeader title="Surveys" showBorder />

      <Box sx={styles.content}>
        <SurveyList
          selectedId={selectedId}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
        />
        <SurveyEditor
          survey={localSurvey}
          onChange={handleChange}
          onSave={handleSave}
          onDelete={handleDeleteClick}
          saving={saving}
          isNew={isNew}
        />
      </Box>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Survey</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{localSurvey?.name}&quot;?
            This will also delete all associated questions and captured answers.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} size="small">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            size="small"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DrawerPage>
  );
});

SurveysPage.displayName = "SurveysPage";

const styles = {
  content: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
};

export default SurveysPage;
