/**
 * Month selection for the Budgets page (#7510).
 *
 * Months are UTC calendar months: the backend keys spend and budget history that way, and the
 * Usage page uses the same boundaries, so a month here covers the same days as there.
 */

// The current month and the three before it
export const PERIOD_COUNT = 4;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const READ_ONLY_MESSAGE =
  'Historical budgets are read-only. Select the current month to update budget limits.';

export const NOT_AVAILABLE = 'Not available';

const toPeriod = (year, month) => `${String(year).padStart(4, '0')}${String(month).padStart(2, '0')}`;

export const getCurrentPeriod = (now = new Date()) => toPeriod(now.getUTCFullYear(), now.getUTCMonth() + 1);

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** "Nov 1 – 12" for the current month (to today), "Oct 1 – 31" for a finished one. */
export const formatPeriodRange = (period, now = new Date()) => {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(4, 6));
  const lastDay = period === getCurrentPeriod(now) ? now.getUTCDate() : daysInMonth(year, month);

  return `${MONTH_SHORT[month - 1]} 1 – ${lastDay}`;
};

export const formatPeriodLabel = period =>
  `${MONTH_NAMES[Number(period.slice(4, 6)) - 1]} ${Number(period.slice(0, 4))}`;

/** The selectable months, newest first, each with what the dropdown needs to draw it. */
export const getPeriodOptions = (now = new Date()) => {
  const currentPeriod = getCurrentPeriod(now);
  const index = now.getUTCFullYear() * 12 + now.getUTCMonth();

  return Array.from({ length: PERIOD_COUNT }, (_, offset) => {
    const at = index - offset;
    const period = toPeriod(Math.floor(at / 12), (at % 12) + 1);

    return {
      value: period,
      label: formatPeriodLabel(period),
      isCurrent: period === currentPeriod,
      range: formatPeriodRange(period, now),
    };
  });
};

/** "2026-10": the form used in file names and the workbook's reporting-month column. */
export const formatPeriodIso = period => `${period.slice(0, 4)}-${period.slice(4, 6)}`;

export const getExportFileName = period => `elitea-budgets-${formatPeriodIso(period)}.xlsx`;
