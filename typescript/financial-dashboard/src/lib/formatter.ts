export const formatCurrency = (amount: number) => {
  const CurrencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: amount > 1e5 ? "compact" : "standard",
  });
  return CurrencyFormatter.format(amount);
};

export const monthFormatter = (value: string) => {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};
