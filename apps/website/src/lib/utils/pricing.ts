/**
 * Centralized pricing utilities for consistent price calculations
 */

import type {
  ProductVariantMapping,
  ProductVariant,
} from "@/lib/shopify/types";

/**
 * Determine the effective price for a variant mapping
 * Priority: priceOverride > variant.price > 0
 */
export function getVariantPrice(
  mapping: ProductVariantMapping | any,
  variant?: ProductVariant | any,
): number {
  // Handle case where variant is embedded in mapping
  const actualVariant =
    variant || (typeof mapping.variant === "object" ? mapping.variant : null);

  // Priority: mapping price override > variant base price > fallback to 0
  return Number(mapping.priceOverride || actualVariant?.price || 0);
}

/**
 * Determine the effective price for a product
 * Priority: discountedPrice > originalPrice > 0
 */
export function getProductPrice(product: any): number {
  return Number(product.discountedPrice || product.originalPrice || 0);
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

/**
 * Validate that a price is valid (non-negative number)
 */
export function isValidPrice(price: any): boolean {
  const numPrice = Number(price);
  return !isNaN(numPrice) && numPrice >= 0;
}
