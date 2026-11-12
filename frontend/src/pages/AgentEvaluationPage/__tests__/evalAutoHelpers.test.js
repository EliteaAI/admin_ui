import { describe, expect, it } from 'vitest';

import {
  changedSettings,
  cleanProbes,
  formatCoverage,
  parseProjectIds,
  probesChanged,
  resyncMessage,
  runUrl,
  stateLabel,
  toWindow,
  triggerLabel,
} from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

describe('parseProjectIds', () => {
  it('keeps positive integers, deduplicated and sorted', () => {
    expect(parseProjectIds('12, 4 4,\n1')).toEqual([1, 4, 12]);
  });

  it('drops zero, negatives, decimals and words', () => {
    expect(parseProjectIds('0, -3, 2.5, abc, 7')).toEqual([7]);
  });

  it('reads an empty or missing value as no ids', () => {
    expect(parseProjectIds('')).toEqual([]);
    expect(parseProjectIds(undefined)).toEqual([]);
  });
});

describe('changedSettings', () => {
  it('returns only the keys that differ, comparing lists and objects by value', () => {
    const saved = { project_ids: [1, 2], window: { start: '22:00', end: '06:00' }, fail_threshold: 50 };
    const draft = { project_ids: [1, 2], window: { start: '22:00', end: '06:00' }, fail_threshold: 40 };
    expect(changedSettings(saved, draft)).toEqual({ fail_threshold: 40 });
  });

  it('sends a cleared window as null', () => {
    expect(changedSettings({ window: { start: '01:00', end: '02:00' } }, { window: null })).toEqual({
      window: null,
    });
  });
});

describe('toWindow', () => {
  it('needs both ends', () => {
    expect(toWindow('22:00', '06:00')).toEqual({ start: '22:00', end: '06:00' });
    expect(toWindow('22:00', '')).toBeNull();
    expect(toWindow('', '')).toBeNull();
  });
});

describe('formatCoverage', () => {
  it('rounds to a whole percent and shows a dash for no value', () => {
    expect(formatCoverage(66.67)).toBe('67%');
    expect(formatCoverage(0)).toBe('0%');
    expect(formatCoverage(null)).toBe('-');
  });
});

describe('runUrl', () => {
  it("opens the run in the agent's evaluation history", () => {
    expect(runUrl('/app', { project_id: 4, application_id: 21, eval_run_id: 41 })).toBe(
      '/app/4/agents/all/21/evaluate/history?run=41',
    );
  });

  it('is null for an item without a run', () => {
    expect(runUrl('/app', { project_id: 4, application_id: 21, eval_run_id: null })).toBeNull();
  });
});

describe('labels', () => {
  it('labels only the states that have no verdict yet', () => {
    expect(stateLabel('pending')).toBe('Queued');
    expect(stateLabel('running')).toBe('Running');
    expect(stateLabel('done')).toBeNull();
  });

  it('names the trigger, falling back to the raw value', () => {
    expect(triggerLabel('scheduled')).toBe('Schedule');
    expect(triggerLabel('manual')).toBe('Run now');
    expect(triggerLabel('other')).toBe('other');
    expect(triggerLabel(null)).toBe('-');
  });
});

describe('probes', () => {
  it('trims probes and drops blanks and repeats, keeping the order', () => {
    expect(cleanProbes(['  b ', '', 'a', 'b', '   '])).toEqual(['b', 'a']);
  });

  it('counts only a change that survives cleaning', () => {
    expect(probesChanged(['a', 'b'], ['a ', 'b', ''])).toBe(false);
    expect(probesChanged(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(probesChanged(['a', 'b'], ['a'])).toBe(true);
  });

  it('describes a resync, with the failed projects', () => {
    expect(resyncMessage({ updated_datasets: 1, failures: [] })).toBe('Updated 1 agent copy.');
    expect(resyncMessage({ updated_datasets: 3, failures: [] })).toBe('Updated 3 agent copies.');
    expect(resyncMessage({ updated_datasets: 0, failures: [7] })).toBe(
      'Every agent copy is up to date. 1 project(s) failed; see the server log.',
    );
  });
});
