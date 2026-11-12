/**
 * Formatting helpers shared by the budgets table, dialog and drawer.
 */

/**
 * Spend can be a fraction of a cent, so show enough precision to see it move
 * rather than rounding small amounts to $0.00.
 */
export const formatMoney = (value, currency = 'USD') => {
  const amount = Number(value || 0);
  const symbol = currency === 'USD' ? '$' : `${currency} `;

  if (amount > 0 && amount < 0.01) {
    return `${symbol}${amount.toFixed(4)}`;
  }

  return `${symbol}${amount.toFixed(2)}`;
};

export const formatLimit = (value, currency = 'USD') => {
  if (value === null || value === undefined) {
    return 'Unlimited';
  }

  return formatMoney(value, currency);
};

export const usageColor = percent => {
  if (percent >= 100) return 'error';
  if (percent >= 80) return 'warning';
  return 'success';
};

/**
 * A month's budget limit as the table and the export both show it. Not recorded is not unlimited:
 * only a month with a record and no limit reads as Unlimited.
 */
export const formatPeriodLimit = (row, notAvailable) => {
  if (row?.limit_available === false) {
    return notAvailable;
  }

  return formatLimit(row?.effective_limit, row?.currency);
};

/** Spend that could not be read is not $0.00. */
export const formatPeriodSpend = (row, notAvailable) => {
  if (row?.spend_available === false || row?.spend === null) {
    return notAvailable;
  }

  return formatMoney(row?.spend, row?.currency);
};
