import { linter } from '@codemirror/lint';
import jsYaml from 'js-yaml';

const DEBOUNCE_DELAY = 300;

export const yamlLinter = linter((view) => {
  const diagnostics = [];
  const text = view.state.doc.toString();
  try {
    jsYaml.load(text);
  } catch (e) {
    const doc = view.state.doc;
    const line = e.mark?.line != null ? Math.min(e.mark.line + 1, doc.lines) : 1;
    const lineInfo = doc.line(line);
    const from = lineInfo.from;
    const to = Math.min(lineInfo.to, doc.length);
    diagnostics.push({
      from,
      to: Math.max(to, from + 1),
      severity: 'error',
      message: e.reason ?? e.message,
    });
  }
  return diagnostics;
}, { delay: DEBOUNCE_DELAY });
