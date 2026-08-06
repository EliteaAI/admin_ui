export const LOG_LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

export const LEVEL_COLORS = {
  DEBUG: "default",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "error",
};

// Matches the SecretFormatter line prefix, e.g.
// "2026.08.06 06:55:34 UTC -    DEBUG - plugins.auth.module - message"
const LEVEL_LINE_RE = new RegExp(
  `^\\d{4}\\.\\d{2}\\.\\d{2}\\s+[\\d:]+\\s+\\S*\\s+-\\s+(${LOG_LEVELS.join("|")})\\s+-`,
);

// Splits log text into level-tagged blocks, folding continuation lines
// (e.g. traceback frames, which carry no level prefix) into the block of
// the line above them, then keeps only blocks whose level is active.
export function filterLogsByLevel(logText, activeLevels) {
  if (!logText) return logText;

  const lines = logText.split("\n");
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(LEVEL_LINE_RE);
    if (match) {
      current = { level: match[1], lines: [line] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      blocks.push({ level: null, lines: [line] });
    }
  }

  return blocks
    .filter((block) => block.level === null || activeLevels.has(block.level))
    .flatMap((block) => block.lines)
    .join("\n");
}
