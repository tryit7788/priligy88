import type {
  ProductVariantMapping,
  ProcessedVariant,
} from "@/lib/shopify/types";
import { getVariantPrice } from "@/lib/utils/pricing";

// Use consistent stock calculation
function calculateTotalStock(mappings: ProductVariantMapping[]): number {
  if (!mappings || mappings.length === 0) {
    return 0;
  }

  return mappings
    .filter((mapping) => mapping.isActive === true)
    .reduce((total, mapping) => total + (mapping.quantity || 0), 0);
}

/**
 * Process variant mappings into frontend-friendly format
 */
export function processVariantMappings(
  mappings: ProductVariantMapping[],
): ProcessedVariant[] {
  if (!mappings || mappings.length === 0) {
    return [];
  }

  return mappings
    .filter((mapping) => mapping.isActive)
    .map((mapping) => {
      const variant =
        typeof mapping.variant === "object" ? mapping.variant : null;
      if (!variant) return null;

      return {
        id: mapping.id,
        name: variant.name,
        price: getVariantPrice(mapping, variant),
        stock: mapping.quantity,
        sku: variant.sku,
        isDefault: mapping.isDefault,
        availableForSale: mapping.quantity > 0,
        category: variant.category || "other",
      };
    })
    .filter(Boolean) as ProcessedVariant[];
}

/**
 * Get the default variant from mappings
 */
export function getDefaultVariant(
  mappings: ProductVariantMapping[],
): ProcessedVariant | null {
  const processed = processVariantMappings(mappings);
  return processed.find((variant) => variant.isDefault) || processed[0] || null;
}

/**
 * Calculate total stock from variant mappings
 * Centralized function used across the entire application
 */
export { calculateTotalStock };

/**
 * Get variant by ID from mappings
 */
export function getVariantById(
  mappings: ProductVariantMapping[],
  variantId: string,
): ProcessedVariant | null {
  const processed = processVariantMappings(mappings);
  return processed.find((variant) => variant.id === variantId) || null;
}

/**
 * Check if product has variants
 */
export function hasVariants(mappings: ProductVariantMapping[]): boolean {
  return (
    mappings &&
    mappings.length > 0 &&
    mappings.some((mapping) => mapping.isActive)
  );
}
