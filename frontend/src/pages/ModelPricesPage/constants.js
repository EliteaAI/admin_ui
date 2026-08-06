export const MODEL_MODES = [
  "chat",
  "completion",
  "embedding",
  "image_generation",
  "audio_transcription",
  "audio_speech",
  "moderation",
  "rerank",
];

// Costs are stored per-token; admins think in $ per 1M tokens.
export const PER_MILLION = 1_000_000;

export const PRICE_FIELDS = [
  { key: "input_cost_per_token", label: "Input ($ / 1M tokens)" },
  { key: "output_cost_per_token", label: "Output ($ / 1M tokens)" },
  { key: "cache_read_input_token_cost", label: "Cache read ($ / 1M tokens)" },
  {
    key: "cache_creation_input_token_cost",
    label: "Cache write ($ / 1M tokens)",
  },
];

export function toPerMillion(perToken) {
  if (perToken === null || perToken === undefined) return "";
  return String(perToken * PER_MILLION);
}

export function fromPerMillion(perMillion) {
  if (perMillion === "" || perMillion === null || perMillion === undefined) {
    return undefined;
  }
  const n = Number(perMillion);
  if (Number.isNaN(n)) return undefined;
  return n / PER_MILLION;
}

export function formatPerMillion(perToken) {
  if (perToken === null || perToken === undefined) return "-";
  const value = perToken * PER_MILLION;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}
