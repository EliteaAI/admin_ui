import { memo, useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  useSurveysListQuery,
  useSurveyCreateMutation,
  useSurveyUpdateMutation,
  useSurveyDeleteMutation,
} from "@/api/surveysApi";

import SurveysTable from "./SurveysTable";
import SurveyEditForm from "./SurveyEditForm";

const NEW_SURVEY = {
  name: "",
  description: "",
  enabled: false,
  dismissible: false,
  questions: [],
};

/**
 * SurveysSection – used inside FeaturesPage as a sub-section.
 * Shows table of surveys; clicking a row opens an edit form.
 */
const SurveysSection = memo((props) => {
  const { addRef } = props;

  const { data: surveys = [], isFetching } = useSurveysListQuery();

  const [createSurvey, { isLoading: creating }] = useSurveyCreateMutation();
  const [updateSurvey, { isLoading: updating }] = useSurveyUpdateMutation();
  const [deleteSurvey, { isLoading: deleting }] = useSurveyDeleteMutation();

  const saving = creating || updating || deleting;

  const [editingSurvey, setEditingSurvey] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleRowClick = useCallback((row) => {
    setEditingSurvey(structuredClone(row));
    setIsNew(false);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingSurvey(structuredClone(NEW_SURVEY));
    setIsNew(true);
  }, []);

  const handleBack = useCallback(() => {
    setEditingSurvey(null);
    setIsNew(false);
  }, []);

  // Expose addNew to parent via ref
  useEffect(() => {
    if (addRef) addRef.current = handleAddNew;

    return () => {
      if (addRef) addRef.current = null;
    };
  }, [addRef, handleAddNew]);

  const handleDeleteRequest = useCallback((row) => {
    setDeleteTarget(row);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteSurvey(deleteTarget.id).unwrap();
      setDeleteTarget(null);

      // If we were editing the deleted survey, go back to table
      if (editingSurvey?.id === deleteTarget.id) {
        setEditingSurvey(null);
        setIsNew(false);
      }
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
  }, [deleteTarget, deleteSurvey, editingSurvey]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleSave = useCallback(
    async (surveyData) => {
      const payload = {
        name: surveyData.name,
        description: surveyData.description || null,
        enabled: surveyData.enabled ?? false,
        dismissible: surveyData.dismissible ?? false,
        questions: (surveyData.questions || []).map((q) => ({
          ...(q.id ? { id: q.id } : {}),
          title: q.title,
          question_type: q.question_type || "open",
          options: q.options ?? null,
          position: q.position ?? 0,
        })),
      };

      try {
        if (isNew) {
          const result = await createSurvey(payload).unwrap();
          const created = result.result ?? result;

          setEditingSurvey(structuredClone(created));
          setIsNew(false);
          setSnackbar({
            open: true,
            message: "Survey created successfully",
            severity: "success",
          });
        } else {
          const result = await updateSurvey({
            surveyId: editingSurvey.id,
            ...payload,
          }).unwrap();

          const updated = result.result ?? result;

          setEditingSurvey(structuredClone(updated));
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
    },
    [isNew, editingSurvey, createSurvey, updateSurvey],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={styles.root}>
      {editingSurvey ? (
        <Box sx={styles.editContainer}>
          <Box sx={styles.editToolbar}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={styles.backButton}
            >
              Back to list
            </Button>
          </Box>
          <SurveyEditForm
            survey={editingSurvey}
            isNew={isNew}
            saving={saving}
            onSave={handleSave}
          />
        </Box>
      ) : (
        <SurveysTable
          surveys={surveys}
          isFetching={isFetching}
          onRowClick={handleRowClick}
          onDelete={handleDeleteRequest}
        />
      )}

      <Dialog open={!!deleteTarget} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Survey</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
            This will also delete all associated questions and captured answers.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} variant="text">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
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
    </Box>
  );
});

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  editContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  editToolbar: {
    padding: "0.75rem 1.5rem 0",
  },
  backButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
};

export default SurveysSection;
