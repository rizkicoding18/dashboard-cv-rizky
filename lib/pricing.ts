import type { CustomerPrice, Product } from "@/lib/types";

export function resolveUnitPrice(
  product: Product,
  customerId: string,
  prices: CustomerPrice[],
): { price: number; source: "khusus" | "umum" } {
  const special = prices.find(
    (row) => row.productId === product.id && row.customerId === customerId,
  );
  if (special) {
    return { price: special.unitPrice, source: "khusus" };
  }
  return { price: product.defaultPrice, source: "umum" };
}

export function lineAmount(qty: number, unitPrice: number): number {
  return Math.round((qty || 0) * (unitPrice || 0));
}
