/**
 * Formatting helpers shared by the budgets table, dialog and drawer.
 */

/**
 * Spend can be a fraction of a cent, so show enough precision to see it move
 * rather than rounding small amounts to $0.00.
 */
export function formatMoney(value, currency = "USD") {
  const amount = Number(value || 0);
  const symbol = currency === "USD" ? "$" : `${currency} `;

  if (amount > 0 && amount < 0.01) {
    return `${symbol}${amount.toFixed(4)}`;
  }

  return `${symbol}${amount.toFixed(2)}`;
}

export function formatLimit(value, currency = "USD") {
  if (value === null || value === undefined) {
    return "Unlimited";
  }

  return formatMoney(value, currency);
}

export function usageColor(percent) {
  if (percent >= 100) return "error";
  if (percent >= 80) return "warning";
  return "success";
}
