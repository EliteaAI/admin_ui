import { describe, expect, it } from 'vitest';

import {
  formatPeriodRange,
  getCurrentPeriod,
  getExportFileName,
  getPeriodOptions,
} from '@/pages/BudgetsPage/helpers/budgetPeriod.helpers';

const utc = (year, month, day) => new Date(Date.UTC(year, month - 1, day, 12));

describe('getPeriodOptions', () => {
  it('lists the current month and the three before it, newest first', () => {
    const options = getPeriodOptions(utc(2026, 11, 12));

    expect(options.map(option => option.value)).toEqual(['202611', '202610', '202609', '202608']);
    expect(options.map(option => option.label)).toEqual([
      'November 2026',
      'October 2026',
      'September 2026',
      'August 2026',
    ]);
  });

  it('marks only the current month as current', () => {
    const options = getPeriodOptions(utc(2026, 11, 12));

    expect(options.map(option => option.isCurrent)).toEqual([true, false, false, false]);
  });

  it('crosses a year boundary', () => {
    const options = getPeriodOptions(utc(2027, 1, 3));

    expect(options.map(option => option.value)).toEqual(['202701', '202612', '202611', '202610']);
    expect(options[1].label).toBe('December 2026');
  });

  it('shows the current month up to today and past months in full', () => {
    const options = getPeriodOptions(utc(2026, 11, 12));

    expect(options.map(option => option.range)).toEqual([
      'Nov 1 – 12',
      'Oct 1 – 31',
      'Sep 1 – 30',
      'Aug 1 – 31',
    ]);
  });
});

describe('formatPeriodRange', () => {
  it('knows February in a leap year and in a common year', () => {
    expect(formatPeriodRange('202402', utc(2024, 4, 10))).toBe('Feb 1 – 29');
    expect(formatPeriodRange('202502', utc(2025, 4, 10))).toBe('Feb 1 – 28');
  });
});

describe('getCurrentPeriod', () => {
  it('follows UTC rather than the local time zone', () => {
    // 23:30 UTC on Oct 31 is already November in time zones ahead of UTC
    expect(getCurrentPeriod(new Date(Date.UTC(2026, 9, 31, 23, 30)))).toBe('202610');
  });
});

describe('getExportFileName', () => {
  it('carries the reporting month', () => {
    expect(getExportFileName('202610')).toBe('elitea-budgets-2026-10.xlsx');
  });
});
