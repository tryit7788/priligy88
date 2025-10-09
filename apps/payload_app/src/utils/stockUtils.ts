/**
 * Shared utility functions for stock calculations
 * Used across both frontend and backend to ensure consistency
 */

export type VariantId = string | number

export interface VariantMapping {
  id?: VariantId
  quantity?: number | null
  isActive?: boolean | null
}

/**
 * Calculate total stock from variant mappings
 * Centralized function used across the entire application
 *
 * @param mappings Array of variant mappings
 * @returns Total stock quantity (sum of active variant quantities)
 */
export function calculateTotalStock(mappings: VariantMapping[]): number {
  if (!mappings || mappings.length === 0) {
    return 0
  }

  return mappings
    .filter((mapping) => mapping.isActive === true)
    .reduce((total, mapping) => total + (mapping.quantity || 0), 0)
}

/**
 * Check if a variant mapping is active and has stock
 *
 * @param mapping Variant mapping to check
 * @returns True if mapping is active and has stock > 0
 */
export function isVariantInStock(mapping: VariantMapping): boolean {
  return mapping.isActive === true && (mapping.quantity || 0) > 0
}

/**
 * Get stock quantity for a variant mapping
 *
 * @param mapping Variant mapping
 * @returns Stock quantity (0 if inactive or null)
 */
export function getVariantStock(mapping: VariantMapping): number {
  if (mapping.isActive !== true) {
    return 0
  }
  return mapping.quantity || 0
}
