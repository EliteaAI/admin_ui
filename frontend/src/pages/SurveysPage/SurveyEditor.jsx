import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import QuestionEditor from "./QuestionEditor";

const EMPTY_QUESTION = {
  title: "",
  question_type: "open",
  options: null,
  position: 0,
};

const SurveyEditor = memo((props) => {
  const { survey, onChange, onSave, onDelete, saving, isNew } = props;

  const handleField = useCallback(
    (field, value) => {
      onChange({ ...survey, [field]: value });
    },
    [survey, onChange],
  );

  const handleQuestionChange = useCallback(
    (index, updatedQuestion) => {
      const questions = [...(survey.questions || [])];
      questions[index] = updatedQuestion;
      onChange({ ...survey, questions });
    },
    [survey, onChange],
  );

  const handleQuestionDelete = useCallback(
    (index) => {
      const questions = (survey.questions || []).filter((_, i) => i !== index);
      onChange({ ...survey, questions });
    },
    [survey, onChange],
  );

  const handleAddQuestion = useCallback(() => {
    const questions = survey.questions || [];
    const maxPosition = questions.reduce(
      (max, q) => Math.max(max, q.position ?? 0),
      -1,
    );
    onChange({
      ...survey,
      questions: [
        ...questions,
        { ...EMPTY_QUESTION, position: maxPosition + 1 },
      ],
    });
  }, [survey, onChange]);

  if (!survey) {
    return (
      <Box sx={styles.empty}>
        <Typography variant="body2" sx={styles.emptyText}>
          Select a survey or create a new one
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.scrollArea}>
        <Box sx={styles.fields}>
          <TextField
            size="small"
            label="Survey Name"
            value={survey.name || ""}
            onChange={(e) => handleField("name", e.target.value)}
            fullWidth
            required
            sx={styles.textField}
          />

          <TextField
            size="small"
            label="Description (internal)"
            value={survey.description || ""}
            onChange={(e) => handleField("description", e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            sx={styles.textField}
          />

          <Box sx={styles.toggleRow}>
            <Box sx={styles.toggleItem}>
              <Switch
                size="small"
                checked={survey.enabled ?? false}
                onChange={(e) => handleField("enabled", e.target.checked)}
              />
              <Typography variant="body2" sx={styles.toggleLabel}>
                Enabled
              </Typography>
            </Box>
            <Box sx={styles.toggleItem}>
              <Switch
                size="small"
                checked={survey.dismissible ?? false}
                onChange={(e) => handleField("dismissible", e.target.checked)}
              />
              <Typography variant="body2" sx={styles.toggleLabel}>
                Dismissible
              </Typography>
            </Box>
          </Box>

          <Box sx={styles.questionsHeader}>
            <Typography variant="body2" sx={styles.sectionTitle}>
              Questions
            </Typography>
          </Box>

          {(survey.questions || []).map((question, index) => (
            <QuestionEditor
              key={question.id ?? `new-${index}`}
              question={question}
              index={index}
              onChange={handleQuestionChange}
              onDelete={handleQuestionDelete}
            />
          ))}

          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddQuestion}
            sx={styles.addQuestionBtn}
          >
            Add Question
          </Button>
        </Box>
      </Box>

      <Box sx={styles.actionBar}>
        {!isNew && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon sx={{ fontSize: "0.875rem" }} />}
            onClick={onDelete}
            disabled={saving}
            sx={styles.actionBtn}
          >
            Delete
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="contained"
          onClick={onSave}
          disabled={saving || !survey.name?.trim()}
          sx={styles.actionBtn}
        >
          {saving ? "Saving..." : isNew ? "Create" : "Save"}
        </Button>
      </Box>
    </Box>
  );
});

SurveyEditor.displayName = "SurveyEditor";

const styles = {
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  textField: {
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
    "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
  },
  toggleRow: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
  },
  toggleItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  toggleLabel: ({ palette }) => ({
    fontSize: "0.8125rem",
    color: palette.text.secondary,
  }),
  questionsHeader: {
    marginTop: "0.5rem",
  },
  sectionTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: "0.875rem",
    color: palette.text.secondary,
  }),
  addQuestionBtn: {
    alignSelf: "flex-start",
    fontSize: "0.8125rem",
    textTransform: "none",
  },
  actionBar: ({ palette }) => ({
    borderTop: `1px solid ${palette.border.table}`,
    padding: "0.75rem 1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  }),
  actionBtn: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
  empty: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.8125rem",
  }),
};

export default SurveyEditor;
