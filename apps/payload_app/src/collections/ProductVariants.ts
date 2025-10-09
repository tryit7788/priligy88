import type { CollectionConfig } from 'payload'

const ProductVariants: CollectionConfig = {
  slug: 'product-variants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'category', 'isActive', 'createdAt'],
    description: 'Centralized product variants that can be attached to multiple products',
    group: 'Product Management',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Variant Name',
      admin: {
        description: 'e.g., "Bottle of 30 tablets", "Large Size", "Red Color"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Variant Description (optional)',
      admin: {
        description: 'Additional details about this variant',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Base Price',
      admin: {
        description: 'Base price for this variant (can be overridden per product)',
      },
    },
    {
      name: 'sku',
      type: 'text',
      label: 'SKU (optional)',
      admin: {
        description: 'Stock Keeping Unit identifier',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Variant Category',
      options: [
        { label: 'Size', value: 'size' },
        { label: 'Quantity', value: 'quantity' },
        { label: 'Color', value: 'color' },
        { label: 'Material', value: 'material' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'other',
      admin: {
        description: 'Category to help organize variants',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
      admin: {
        description: 'Inactive variants cannot be attached to new products',
      },
    },
  ],
  timestamps: true,
}

export default ProductVariants
