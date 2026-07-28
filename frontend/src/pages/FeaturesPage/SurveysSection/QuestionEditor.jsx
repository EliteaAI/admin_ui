import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const QUESTION_TYPES = [
  { value: "open", label: "Open (free text)" },
  { value: "radio", label: "Radio (single-select)" },
  { value: "checkbox", label: "Checkbox (multi-select)" },
  { value: "slider", label: "Slider (numeric scale)" },
];

const DEFAULT_OPTIONS = {
  open: null,
  radio: { choices: [""] },
  checkbox: { choices: [""] },
  slider: { min: 0, max: 10, min_label: "", max_label: "" },
};

const QuestionEditor = memo((props) => {
  const { question, index, onChange, onDelete } = props;

  const handleField = useCallback(
    (field, value) => {
      onChange(index, { ...question, [field]: value });
    },
    [index, question, onChange],
  );

  const handleTypeChange = useCallback(
    (e) => {
      const newType = e.target.value;

      onChange(index, {
        ...question,
        question_type: newType,
        options: DEFAULT_OPTIONS[newType]
          ? structuredClone(DEFAULT_OPTIONS[newType])
          : null,
      });
    },
    [index, question, onChange],
  );

  const handleOptionField = useCallback(
    (field, value) => {
      onChange(index, {
        ...question,
        options: { ...question.options, [field]: value },
      });
    },
    [index, question, onChange],
  );

  const handleChoiceChange = useCallback(
    (choiceIndex, value) => {
      const choices = [...(question.options?.choices ?? [])];

      choices[choiceIndex] = value;

      onChange(index, {
        ...question,
        options: { ...question.options, choices },
      });
    },
    [index, question, onChange],
  );

  const handleAddChoice = useCallback(() => {
    const choices = [...(question.options?.choices ?? []), ""];

    onChange(index, {
      ...question,
      options: { ...question.options, choices },
    });
  }, [index, question, onChange]);

  const handleDeleteChoice = useCallback(
    (choiceIndex) => {
      const choices = (question.options?.choices ?? []).filter(
        (_, i) => i !== choiceIndex,
      );

      onChange(index, {
        ...question,
        options: { ...question.options, choices },
      });
    },
    [index, question, onChange],
  );

  const handleDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  const type = question.question_type || "open";

  return (
    <Box sx={styles.card}>
      <Box sx={styles.cardHeader}>
        <Typography variant="body2" sx={styles.cardTitle}>
          Question {index + 1}
        </Typography>
        <IconButton size="small" onClick={handleDelete} sx={styles.deleteBtn}>
          <DeleteOutlineIcon sx={{ fontSize: "1rem" }} />
        </IconButton>
      </Box>

      <Box sx={styles.fieldRow}>
        <TextField
          size="small"
          label="Question Title"
          value={question.title || ""}
          onChange={(e) => handleField("title", e.target.value)}
          fullWidth
          required
          error={!question.title?.trim()}
          sx={styles.textField}
        />
      </Box>

      <Box sx={styles.fieldRow}>
        <FormControl size="small" sx={styles.typeSelect}>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={handleTypeChange}
            sx={styles.selectInput}
          >
            {QUESTION_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Position"
          type="number"
          value={question.position ?? 0}
          onChange={(e) =>
            handleField("position", parseInt(e.target.value, 10) || 0)
          }
          sx={styles.positionField}
        />
      </Box>

      {(type === "radio" || type === "checkbox") && (
        <Box sx={styles.optionsSection}>
          <Typography variant="caption" sx={styles.optionsLabel}>
            Choices
          </Typography>
          {(question.options?.choices ?? []).length === 0 && (
            <Typography variant="caption" color="error">
              At least one choice is required
            </Typography>
          )}
          {(question.options?.choices ?? []).map((choice, ci) => (
            <Box key={ci} sx={styles.choiceRow}>
              <TextField
                size="small"
                placeholder={`Choice ${ci + 1}`}
                value={choice}
                onChange={(e) => handleChoiceChange(ci, e.target.value)}
                fullWidth
                required
                error={!choice?.trim()}
                sx={styles.textField}
              />
              <IconButton
                size="small"
                onClick={() => handleDeleteChoice(ci)}
                sx={styles.deleteBtn}
              >
                <DeleteOutlineIcon sx={{ fontSize: "0.875rem" }} />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddChoice}
            sx={styles.addChoiceBtn}
          >
            Add Choice
          </Button>
        </Box>
      )}

      {type === "slider" && (
        <Box sx={styles.optionsSection}>
          <Typography variant="caption" sx={styles.optionsLabel}>
            Slider Options
          </Typography>
          <Box sx={styles.sliderRow}>
            <TextField
              size="small"
              label="Min"
              type="number"
              value={question.options?.min ?? 0}
              onChange={(e) =>
                handleOptionField("min", parseInt(e.target.value, 10) || 0)
              }
              sx={styles.numberField}
            />
            <TextField
              size="small"
              label="Max"
              type="number"
              value={question.options?.max ?? 10}
              onChange={(e) =>
                handleOptionField("max", parseInt(e.target.value, 10) || 0)
              }
              sx={styles.numberField}
            />
          </Box>
          <Box sx={styles.sliderRow}>
            <TextField
              size="small"
              label="Min Label"
              value={question.options?.min_label ?? ""}
              onChange={(e) => handleOptionField("min_label", e.target.value)}
              required
              error={!question.options?.min_label?.trim()}
              sx={styles.labelField}
            />
            <TextField
              size="small"
              label="Max Label"
              value={question.options?.max_label ?? ""}
              onChange={(e) => handleOptionField("max_label", e.target.value)}
              required
              error={!question.options?.max_label?.trim()}
              sx={styles.labelField}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
});

const styles = {
  card: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
  }),
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: "0.8125rem",
    color: palette.text.secondary,
  }),
  fieldRow: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-start",
  },
  textField: {
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
    "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
  },
  typeSelect: {
    flex: 1,
    "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
  },
  selectInput: {
    fontSize: "0.8125rem",
  },
  positionField: {
    width: "5rem",
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
    "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
  },
  optionsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    paddingLeft: "0.5rem",
  },
  optionsLabel: ({ palette }) => ({
    fontWeight: 500,
    color: palette.text.metrics,
  }),
  choiceRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  addChoiceBtn: {
    alignSelf: "flex-start",
    fontSize: "0.75rem",
    textTransform: "none",
  },
  sliderRow: {
    display: "flex",
    gap: "0.75rem",
  },
  numberField: {
    width: "6rem",
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
    "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
  },
  labelField: {
    flex: 1,
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
    "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
  },
  deleteBtn: ({ palette }) => ({
    color: palette.text.secondary,
    "&:hover": { color: palette.error.main },
  }),
};

export default QuestionEditor;
