export function formatAmount(
  value?: number | string | null,
  currencyLabel = "F CFA",
  locale = "fr-FR"
): string {
  if (value === undefined || value === null || value === "") return `0 ${currencyLabel}`;

  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return `0 ${currencyLabel}`;

  const hasDecimals = !Number.isInteger(amount);
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });

  return `${formatter.format(amount)} ${currencyLabel}`;
}
