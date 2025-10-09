'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button, Select, useForm } from '@payloadcms/ui'
import { calculateTotalStock } from '../utils/stockUtils'
import { ErrorBoundary } from './ErrorBoundary'
import { ClientOnlyWrapper } from './ClientOnlyWrapper'

interface VariantMapping {
  id?: string
  variant: string
  quantity: number
  priceOverride?: number
  isDefault: boolean
  isActive: boolean
  tempId?: string // Add temporary ID for React keys
}

interface ExistingMapping {
  id: string
  variant:
    | {
        id: string
      }
    | string
  quantity: number
  priceOverride?: number
  isDefault: boolean
  isActive: boolean
}

// Helper function to get variant ID from either object or string
const getVariantId = (variant: { id: string } | string): string => {
  return typeof variant === 'object' ? variant.id : variant
}

interface Operation {
  type: 'DELETE' | 'CREATE' | 'UPDATE'
  url: string
  method: string
  body?: Record<string, unknown>
}

interface ProductVariantManagerProps {
  path?: string
  value?: unknown
  onChange?: (value: unknown) => void
  productId?: string
  initialMappings?: VariantMapping[]
}

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  path: _path,
  value: _value,
  onChange: _onChange,
  productId,
  initialMappings = [],
}) => {
  const form = useForm()
  const currentProductId = productId || (form as { id?: string })?.id

  const [mounted, setMounted] = useState(false)
  const [mappings, setMappings] = useState<VariantMapping[]>([])
  const [availableVariants, setAvailableVariants] = useState<Array<{ id: string; name: string }>>(
    [],
  )
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Use regular useEffect to prevent hydration issues
  useEffect(() => {
    // Use a small delay to ensure client-side hydration is complete
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Fetch available variants - memoized to prevent unnecessary re-fetches
  const fetchVariants = useCallback(async () => {
    if (!mounted) return

    try {
      const response = await fetch('/api/product-variants?where[isActive][equals]=true')
      const data = await response.json()

      // Get currently mapped variant IDs for this product to exclude them from dropdown
      const currentlyMappedVariantIds = new Set(mappings.map((m) => m.variant).filter(Boolean))

      // Filter out variants that are already mapped to this product
      const availableVariantsFiltered = (data.docs || []).filter(
        (variant: { id: string; name: string }) => !currentlyMappedVariantIds.has(variant.id),
      )

      setAvailableVariants(availableVariantsFiltered)
    } catch (error) {
      console.error('Error fetching variants:', error)
    }
  }, [mounted, mappings])

  // Single effect to handle variant fetching
  useEffect(() => {
    fetchVariants()
  }, [fetchVariants])

  // Load existing variant mappings when component mounts or productId changes
  useEffect(() => {
    if (!mounted) return

    const loadExistingMappings = async () => {
      if (!currentProductId) {
        setInitialLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/product-variant-mappings?where[product][equals]=${currentProductId}&depth=1`,
        )
        const data = await response.json()
        const existingMappings = data.docs || []

        // Transform existing mappings to match our interface
        const transformedMappings: VariantMapping[] = existingMappings.map(
          (mapping: ExistingMapping, index: number) => ({
            id: mapping.id,
            variant: getVariantId(mapping.variant),
            quantity: mapping.quantity || 0,
            priceOverride: mapping.priceOverride,
            isDefault: mapping.isDefault || false,
            isActive: mapping.isActive !== false, // Default to true if not specified
            tempId: `existing-${mapping.id}-${index}`, // Stable temp ID for existing mappings
          }),
        )

        setMappings(transformedMappings)
      } catch (error) {
        console.error('Error loading existing mappings:', error)
        // If there's an error, keep the initial mappings (which might be empty)
      } finally {
        setInitialLoading(false)
      }
    }

    loadExistingMappings()
  }, [currentProductId, mounted])

  // Add new variant mapping
  const addVariantMapping = () => {
    const newMapping: VariantMapping = {
      variant: '',
      quantity: 0,
      isDefault: false,
      isActive: true,
      tempId: `temp-${Date.now()}-${Math.random()}`, // Generate unique temp ID
    }
    setMappings([...mappings, newMapping])
  }

  // Update variant mapping
  const updateMapping = (
    index: number,
    field: keyof VariantMapping,
    value: string | number | boolean,
  ) => {
    const updatedMappings = [...mappings]
    updatedMappings[index] = { ...updatedMappings[index], [field]: value }

    // Ensure only one default variant
    if (field === 'isDefault' && value) {
      updatedMappings.forEach((mapping, i) => {
        if (i !== index) {
          updatedMappings[i] = { ...mapping, isDefault: false }
        }
      })
    }

    setMappings(updatedMappings)
  }

  // Remove variant mapping
  const removeMapping = async (index: number) => {
    const mappingToRemove = mappings[index]

    // If mapping has an ID, it exists in database - delete it immediately
    if (mappingToRemove.id) {
      try {
        const response = await fetch(`/api/product-variant-mappings/${mappingToRemove.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`Failed to delete mapping: ${response.statusText}`)
        }

        console.log(`✅ Successfully deleted mapping ${mappingToRemove.id}`)
      } catch (error) {
        console.error('Error deleting mapping:', error)
        alert('Error deleting variant mapping. Please try again.')
        return // Don't remove from UI if deletion failed
      }
    }

    // Remove from local state
    const updatedMappings = mappings.filter((_, i) => i !== index)
    setMappings(updatedMappings)
  }

  // Save mappings with optimized approach
  const saveMappings = async () => {
    if (!currentProductId) {
      alert('Product ID not available')
      return
    }

    setLoading(true)
    try {
      // Get existing mappings
      const existingMappingsResponse = await fetch(
        `/api/product-variant-mappings?where[product][equals]=${currentProductId}`,
      )
      const existingData = await existingMappingsResponse.json()
      const existingMappings = existingData.docs || []

      // Filter out mappings with valid variants and quantities
      const validMappings = mappings.filter((mapping) => mapping.variant && mapping.quantity >= 0)

      // Create operations array for batch processing
      const operations: Operation[] = []

      // Find mappings to delete (exist in DB but not in current state)
      // Note: Some mappings might have been deleted immediately via removeMapping()
      const currentVariantIds = new Set(validMappings.map((m) => m.variant))
      const currentMappingIds = new Set(validMappings.map((m) => m.id).filter(Boolean))

      const toDelete = (existingMappings as ExistingMapping[]).filter((existing) => {
        // Skip if already deleted immediately (not in current state by ID)
        if (currentMappingIds.has(existing.id)) return false
        // Delete if variant no longer in current state
        return !currentVariantIds.has(getVariantId(existing.variant))
      })

      // Find mappings to create (in current state but not in DB)
      const existingVariantIds = new Set(
        (existingMappings as ExistingMapping[]).map((existing) => getVariantId(existing.variant)),
      )
      const toCreate = validMappings.filter((mapping) => !existingVariantIds.has(mapping.variant))

      // Find mappings to update (exist in both but data changed)
      const toUpdate = validMappings.filter((mapping) => {
        const existing = (existingMappings as ExistingMapping[]).find(
          (existing) => getVariantId(existing.variant) === mapping.variant,
        )
        return (
          existing &&
          (existing.quantity !== mapping.quantity ||
            existing.priceOverride !== mapping.priceOverride ||
            existing.isDefault !== mapping.isDefault ||
            existing.isActive !== mapping.isActive)
        )
      })

      // Add delete operations
      toDelete.forEach((mapping) => {
        operations.push({
          type: 'DELETE',
          url: `/api/product-variant-mappings/${mapping.id}`,
          method: 'DELETE',
        })
      })

      // Add create operations
      toCreate.forEach((mapping) => {
        operations.push({
          type: 'CREATE',
          url: '/api/product-variant-mappings',
          method: 'POST',
          body: {
            product: currentProductId,
            variant: mapping.variant,
            quantity: mapping.quantity,
            priceOverride: mapping.priceOverride,
            isDefault: mapping.isDefault,
            isActive: mapping.isActive,
          },
        })
      })

      // Add update operations
      toUpdate.forEach((mapping) => {
        const existing = (existingMappings as ExistingMapping[]).find(
          (existing) => getVariantId(existing.variant) === mapping.variant,
        )
        if (existing) {
          operations.push({
            type: 'UPDATE',
            url: `/api/product-variant-mappings/${existing.id}`,
            method: 'PATCH',
            body: {
              quantity: mapping.quantity,
              priceOverride: mapping.priceOverride,
              isDefault: mapping.isDefault,
              isActive: mapping.isActive,
            },
          })
        }
      })

      // Execute operations in parallel (but limit concurrency to avoid overwhelming the server)
      const BATCH_SIZE = 5
      for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const batch = operations.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map(async (op) => {
            const response = await fetch(op.url, {
              method: op.method,
              headers: { 'Content-Type': 'application/json' },
              body: op.body ? JSON.stringify(op.body) : undefined,
            })
            if (!response.ok) {
              throw new Error(`Failed to ${op.type} mapping: ${response.statusText}`)
            }
            return response
          }),
        )
      }

      alert(`Variant mappings saved successfully! ${operations.length} operations completed.`)
    } catch (error) {
      console.error('Error saving mappings:', error)
      alert('Error saving variant mappings')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state during hydration to prevent mismatches
  if (!mounted || initialLoading) {
    return (
      <div
        style={{
          padding: '20px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          margin: '20px 0',
        }}
      >
        <h3>Manage Product Variants</h3>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {!mounted ? 'Initializing...' : 'Loading variant mappings...'}
        </div>
      </div>
    )
  }

  return (
    <ClientOnlyWrapper
      fallback={
        <div
          style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            margin: '20px 0',
            textAlign: 'center',
          }}
        >
          <h3>Manage Product Variants</h3>
          <div>Loading variant manager...</div>
        </div>
      }
    >
      <ErrorBoundary>
        <div
          style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            margin: '20px 0',
          }}
          key={`variant-manager-${currentProductId || 'new'}`}
        >
          <h3>Manage Product Variants</h3>

          <div style={{ marginBottom: '20px' }}>
            <Button onClick={addVariantMapping} type="button">
              Add Variant
            </Button>
          </div>

          {mappings.map((mapping, index) => {
            // Create a stable key that won't change during renders
            const stableKey = mapping.id
              ? `existing-${mapping.id}`
              : mapping.tempId
                ? mapping.tempId
                : `new-${index}-${mapping.variant || 'empty'}`

            return (
              <div
                key={stableKey}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <Select
                    key={`select-${stableKey}`}
                    value={
                      availableVariants.find((v) => v.id === mapping.variant)
                        ? {
                            label:
                              availableVariants.find((v) => v.id === mapping.variant)?.name || '',
                            value: mapping.variant,
                          }
                        : undefined
                    }
                    onChange={(value) => {
                      const selectedValue = Array.isArray(value) ? value[0]?.value : value?.value
                      updateMapping(
                        index,
                        'variant',
                        typeof selectedValue === 'string' ? selectedValue : '',
                      )
                    }}
                    options={availableVariants.map((variant) => ({
                      label: variant.name,
                      value: variant.id,
                    }))}
                    placeholder="Select Variant"
                    isClearable={true}
                  />
                </div>

                <div style={{ width: '100px' }}>
                  <input
                    key={`quantity-${stableKey}`}
                    type="number"
                    value={mapping.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateMapping(index, 'quantity', parseInt(e.target.value) || 0)
                    }
                    placeholder="Qty"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div style={{ width: '100px' }}>
                  <input
                    key={`price-${stableKey}`}
                    type="number"
                    value={mapping.priceOverride || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateMapping(index, 'priceOverride', parseFloat(e.target.value) || 0)
                    }
                    placeholder="Price Override"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      key={`default-${stableKey}`}
                      type="checkbox"
                      checked={mapping.isDefault}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateMapping(index, 'isDefault', e.target.checked)
                      }
                    />
                    Default
                  </label>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      key={`active-${stableKey}`}
                      type="checkbox"
                      checked={mapping.isActive}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateMapping(index, 'isActive', e.target.checked)
                      }
                    />
                    Active
                  </label>
                </div>

                <Button
                  key={`remove-${stableKey}`}
                  onClick={() => removeMapping(index)}
                  type="button"
                  buttonStyle="icon-label"
                  icon="x"
                >
                  Remove
                </Button>
              </div>
            )
          })}

          <div style={{ marginTop: '20px' }}>
            <Button onClick={saveMappings} disabled={loading} type="button">
              {loading ? 'Saving...' : 'Save Variant Mappings'}
            </Button>
          </div>

          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Total Stock: {calculateTotalStock(mappings)}
          </div>
        </div>
      </ErrorBoundary>
    </ClientOnlyWrapper>
  )
}

export default ProductVariantManager
