import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import QuestionEditor from "./QuestionEditor";

const EMPTY_QUESTION = {
  title: "",
  question_type: "open",
  options: null,
  position: 0,
};

/**
 * Self-contained survey edit form.
 * Manages its own local state and calls onSave(data) on submit.
 */
const SurveyEditForm = memo((props) => {
  const { survey, isNew, saving, onSave } = props;

  const [local, setLocal] = useState(() => structuredClone(survey));
  const serverRef = useRef(survey);

  // Sync when survey prop changes (e.g. after successful save)
  useEffect(() => {
    serverRef.current = survey;
    setLocal(structuredClone(survey));
  }, [survey]);

  const isDirty = useMemo(
    () => JSON.stringify(local) !== JSON.stringify(serverRef.current),
    [local],
  );

  const hasInvalidQuestions = useMemo(() => {
    const questions = local.questions || [];
    if (questions.length === 0) return false;

    return questions.some((q) => {
      if (!q.title?.trim()) return true;

      const type = q.question_type || "open";

      if (type === "radio" || type === "checkbox") {
        const choices = q.options?.choices ?? [];

        if (choices.length === 0) return true;
        if (choices.some((c) => !c?.trim())) return true;
      }

      if (type === "slider") {
        if (!q.options?.min_label?.trim()) return true;
        if (!q.options?.max_label?.trim()) return true;
      }

      return false;
    });
  }, [local.questions]);

  const handleField = useCallback((field, value) => {
    setLocal((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleQuestionChange = useCallback((index, updatedQuestion) => {
    setLocal((prev) => {
      const questions = [...(prev.questions || [])];
      questions[index] = updatedQuestion;
      return { ...prev, questions };
    });
  }, []);

  const handleQuestionDelete = useCallback((index) => {
    setLocal((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((_, i) => i !== index),
    }));
  }, []);

  const handleAddQuestion = useCallback(() => {
    setLocal((prev) => {
      const questions = prev.questions || [];
      const maxPosition = questions.reduce(
        (max, q) => Math.max(max, q.position ?? 0),
        -1,
      );
      return {
        ...prev,
        questions: [
          ...questions,
          { ...EMPTY_QUESTION, position: maxPosition + 1 },
        ],
      };
    });
  }, []);

  const handleDiscard = useCallback(() => {
    setLocal(structuredClone(serverRef.current));
  }, []);

  const handleSaveClick = useCallback(() => {
    onSave(local);
  }, [local, onSave]);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.scrollArea}>
        <Box sx={styles.fields}>
          <Typography variant="body2" sx={styles.sectionTitle}>
            General
          </Typography>
          <Box sx={styles.detailsCard}>
            <TextField
              size="small"
              label="Survey Name"
              value={local.name || ""}
              onChange={(e) => handleField("name", e.target.value)}
              fullWidth
              required
              sx={styles.textField}
            />

            <TextField
              size="small"
              label="Description (internal)"
              value={local.description || ""}
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
                  checked={local.enabled ?? false}
                  onChange={(e) => handleField("enabled", e.target.checked)}
                />
                <Typography variant="body2" sx={styles.toggleLabel}>
                  Enabled
                </Typography>
              </Box>
              <Box sx={styles.toggleItem}>
                <Switch
                  size="small"
                  checked={local.dismissible ?? false}
                  onChange={(e) => handleField("dismissible", e.target.checked)}
                />
                <Typography variant="body2" sx={styles.toggleLabel}>
                  Dismissible
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={styles.questionsHeader}>
            <Typography variant="body2" sx={styles.sectionTitle}>
              Questions
            </Typography>
          </Box>

          {(local.questions || []).map((question, index) => (
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
        <Button
          size="small"
          variant="outlined"
          onClick={handleDiscard}
          disabled={!isDirty || saving}
          sx={styles.actionBtn}
        >
          Discard
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSaveClick}
          disabled={
            !isDirty || saving || !local.name?.trim() || hasInvalidQuestions
          }
          sx={styles.actionBtn}
        >
          {saving ? "Saving..." : isNew ? "Create" : "Save"}
        </Button>
      </Box>
    </Box>
  );
});

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
    maxWidth: 700,
  },
  detailsCard: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
  }),
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
};

export default SurveyEditForm;
