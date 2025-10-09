/**
 * Debounced stock update utility to prevent excessive database updates
 */

interface PendingUpdate {
  productId: string | number
  timeout: NodeJS.Timeout
}

const pendingUpdates = new Map<string, PendingUpdate>()

/**
 * Debounced function to update product total stock
 * Prevents multiple rapid updates to the same product
 */
export function debouncedStockUpdate(
  productId: string | number,
  updateFunction: () => Promise<void>,
  delay: number = 1000,
): void {
  const key = String(productId)

  // Clear existing timeout for this product
  if (pendingUpdates.has(key)) {
    clearTimeout(pendingUpdates.get(key)!.timeout)
  }

  // Set new timeout
  const timeout = setTimeout(async () => {
    try {
      await updateFunction()
    } catch (error) {
      console.error(`Error updating stock for product ${productId}:`, error)
    } finally {
      pendingUpdates.delete(key)
    }
  }, delay)

  pendingUpdates.set(key, { productId, timeout })
}

/**
 * Cancel pending updates for a product
 */
export function cancelPendingUpdate(productId: string | number): void {
  const key = String(productId)
  if (pendingUpdates.has(key)) {
    clearTimeout(pendingUpdates.get(key)!.timeout)
    pendingUpdates.delete(key)
  }
}

/**
 * Cancel all pending updates
 */
export function cancelAllPendingUpdates(): void {
  for (const [, pending] of pendingUpdates) {
    clearTimeout(pending.timeout)
  }
  pendingUpdates.clear()
}
