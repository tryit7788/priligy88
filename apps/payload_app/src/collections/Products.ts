import type { CollectionConfig } from 'payload'
import { slugField } from '../utils/slug'
import { calculateTotalStock } from '../utils/stockUtils'

// Helper function to calculate total stock from variant mappings
async function calculateTotalStockFromMappings(
  variantMappings:
    | (number | { id: number; quantity: number; isActive: boolean })[]
    | null
    | undefined,
  req: { payload: any },
): Promise<number> {
  if (!variantMappings || variantMappings.length === 0) {
    return 0
  }

  try {
    // Get the actual mapping documents with quantities
    const mappingIds = variantMappings.map((mapping) =>
      typeof mapping === 'object' ? mapping.id : mapping,
    )

    const mappings = await req.payload.find({
      collection: 'product-variant-mappings',
      where: {
        id: { in: mappingIds },
      },
      limit: 1000,
      depth: 0,
    })

    // Use the centralized calculation function
    return calculateTotalStock(mappings.docs)
  } catch (error) {
    console.error('Error calculating total stock:', error)
    return 0
  }
}

const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'originalPrice', 'totalStock', 'published'],
    group: 'Product Management',
    listSearchableFields: ['title', 'slug'],
    pagination: {
      defaultLimit: 25,
      limits: [10, 25, 50],
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      label: 'Featured Image',
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      hasMany: false,
    },
    slugField('products', 'title'),
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'discountedPrice',
      type: 'number',
      required: false,
    },
    {
      name: 'originalPrice',
      type: 'number',
      required: true,
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      required: false,
      hasMany: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'product-categories',
      required: true,
    },

    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'product-tags',
      hasMany: true,
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
    },
    {
      name: 'additionalData',
      type: 'richText',
      label: 'Additional Information (optional)',
    },
    // Virtual/computed on read – see collection afterRead hook
    {
      name: 'variantDetails',
      type: 'array',
      admin: {
        readOnly: true,
        description: 'Computed from active variant mappings. Not persisted.',
      },
      access: {
        create: () => false,
        update: () => false,
      },
      fields: [
        { name: 'id', type: 'text' },
        { name: 'variantId', type: 'text' },
        { name: 'name', type: 'text' },
        { name: 'price', type: 'number' },
        { name: 'stock', type: 'number' },
        { name: 'sku', type: 'text' },
        { name: 'isDefault', type: 'checkbox' },
        { name: 'availableForSale', type: 'checkbox' },
        { name: 'category', type: 'text' },
        { name: 'active', type: 'checkbox' },
      ],
    },
    {
      name: 'variantMappings',
      type: 'relationship',
      relationTo: 'product-variant-mappings',
      hasMany: true,
      label: 'Attached Variants',
      admin: {
        description:
          'Variants attached to this product with quantities. Use the Product Variant Mappings collection to manage these.',
      },
      filterOptions: ({ id }) => {
        // Only show product variant mappings that belong to the current product
        // This prevents users from adding mappings that belong to other products
        if (id) {
          return {
            product: {
              equals: id,
            },
          }
        }
        // For new products (no ID yet), show no options until product is saved
        return false
      },
    },

    {
      name: 'totalStock',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Auto-calculated: sum of all variant quantities',
      },
    },

    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  hooks: {
    // Only calculate totalStock when reading products - no expensive variant population
    afterRead: [
      async ({ doc, req }) => {
        if (doc.variantMappings) {
          // Only calculate total stock - this is lightweight and needed for admin
          doc.totalStock = await calculateTotalStockFromMappings(doc.variantMappings, req)

          // Don't populate variantDetails here - use API endpoint instead for better performance
          doc.variantDetails = []
        } else {
          doc.variantDetails = []
          doc.totalStock = 0
        }
        console.log("[TRACE] doc.totalStock = ", doc.totalSotck)
        return doc
      },
    ],
    // Update totalStock when product is created or updated
    afterChange: [
      async ({ doc, req, operation: _operation }) => {
        if (doc.variantMappings) {
          const totalStock = await calculateTotalStockFromMappings(doc.variantMappings, req)

          // Only update if totalStock has changed to avoid infinite loops
          if (doc.totalStock !== totalStock) {
            await req.payload.update({
              collection: 'products',
              id: doc.id,
              data: { totalStock },
              overrideAccess: true,
            })
          }
        }
        console.log("[TRACE] doc.totalStock = ", doc.totalSotck)
        return doc
      },
    ],
  },
}

export default Products
