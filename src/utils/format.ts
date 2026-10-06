const euroFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatPrice(value: number): string {
  return euroFormatter.format(value);
}