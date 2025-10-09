'use client'

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { calculateTotalStock } from '../utils/stockUtils'
import { ErrorBoundary } from './ErrorBoundary'

interface VariantQuantityManagerProps {
  productId: string
}

export const ProductVariantQuantityManager: React.FC<VariantQuantityManagerProps> = ({
  productId,
}) => {
  const [mounted, setMounted] = useState(false)
  const [mappings, setMappings] = useState<
    Array<{
      id: string
      quantity: number
      isDefault: boolean
      variant?: { name: string; price: number }
      priceOverride?: number
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Use useLayoutEffect for synchronous mounting to prevent hydration issues
  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  const fetchMappings = useCallback(async () => {
    if (!mounted) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/product-variant-mappings?where[product][equals]=${productId}&depth=2`,
      )
      const data = await response.json()
      setMappings(data.docs || [])
    } catch (error) {
      console.error('Error fetching mappings:', error)
    } finally {
      setLoading(false)
    }
  }, [productId, mounted])

  // Fetch current variant mappings
  useEffect(() => {
    if (productId && mounted) {
      fetchMappings()
    }
  }, [productId, fetchMappings, mounted])

  const updateQuantity = async (mappingId: string, newQuantity: number) => {
    setSaving(true)
    try {
      await fetch(`/api/product-variant-mappings/${mappingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      // Update local state
      setMappings((prev) =>
        prev.map((mapping) =>
          mapping.id === mappingId ? { ...mapping, quantity: newQuantity } : mapping,
        ),
      )

      // Note: totalStock is now automatically updated via PayloadCMS hooks
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Error updating quantity')
    } finally {
      setSaving(false)
    }
  }

  const toggleDefault = async (mappingId: string) => {
    setSaving(true)
    try {
      // First, unset all other defaults for this product
      for (const mapping of mappings) {
        if (mapping.id !== mappingId && mapping.isDefault) {
          await fetch(`/api/product-variant-mappings/${mapping.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDefault: false }),
          })
        }
      }

      // Set this one as default
      await fetch(`/api/product-variant-mappings/${mappingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      // Update local state
      setMappings((prev) =>
        prev.map((mapping) => ({
          ...mapping,
          isDefault: mapping.id === mappingId,
        })),
      )
    } catch (error) {
      console.error('Error updating default:', error)
      alert('Error updating default variant')
    } finally {
      setSaving(false)
    }
  }

  // Show loading state during hydration to prevent mismatches
  if (!mounted || loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        {!mounted ? 'Initializing...' : 'Loading variant mappings...'}
      </div>
    )
  }

  if (mappings.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No variants attached to this product.
        <br />
        <small>Use the &quot;Attached Variants&quot; field above to add variants.</small>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div
        style={{
          padding: '20px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          margin: '20px 0',
        }}
      >
        <h4>Quick Variant Quantity Management</h4>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Update variant quantities and default selection. Changes are saved automatically.
        </p>

        <div style={{ display: 'grid', gap: '10px' }}>
          {mappings.map((mapping) => (
            <div
              key={mapping.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '15px',
                border: '1px solid #f0f0f0',
                borderRadius: '6px',
                backgroundColor: mapping.isDefault ? '#f8f9fa' : 'white',
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>{mapping.variant?.name}</strong>
                <br />
                <small style={{ color: '#666' }}>
                  Base Price: ${mapping.variant?.price || 0}
                  {mapping.priceOverride && ` | Override: $${mapping.priceOverride}`}
                  {mapping.isDefault && ' | DEFAULT'}
                </small>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '14px' }}>Qty:</label>
                <input
                  type="number"
                  value={mapping.quantity}
                  onChange={(e) => updateQuantity(mapping.id, parseInt(e.target.value) || 0)}
                  min="0"
                  style={{
                    width: '80px',
                    padding: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                  disabled={saving}
                />
              </div>

              <button
                onClick={() => toggleDefault(mapping.id)}
                disabled={saving || mapping.isDefault}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #007cba',
                  borderRadius: '4px',
                  backgroundColor: mapping.isDefault ? '#007cba' : 'white',
                  color: mapping.isDefault ? 'white' : '#007cba',
                  cursor: mapping.isDefault ? 'default' : 'pointer',
                  fontSize: '12px',
                }}
              >
                {mapping.isDefault ? 'Default' : 'Set Default'}
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <strong>Total Stock:</strong> {calculateTotalStock(mappings)} units
        </div>
      </div>
    </ErrorBoundary>
  )
}
