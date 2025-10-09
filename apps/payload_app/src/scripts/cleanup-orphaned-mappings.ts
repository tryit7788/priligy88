/**
 * Cleanup Orphaned Product Variant Mappings
 *
 * This script runs before PayloadCMS starts to clean up any orphaned records
 * that would cause foreign key constraint violations.
 */

import { getPayload } from 'payload'
import config from '../payload.config'

export async function cleanupOrphanedMappings() {
  try {
    console.log('🧹 Starting cleanup of orphaned product variant mappings...')

    const payload = await getPayload({ config: await config })

    // Get all variant mappings
    const mappings = await payload.find({
      collection: 'product-variant-mappings',
      limit: 1000,
      depth: 0,
    })

    console.log(`Found ${mappings.docs.length} variant mappings to check`)

    let deletedCount = 0
    const orphanedIds: number[] = []

    // Check each mapping for orphaned references
    for (const mapping of mappings.docs) {
      let isOrphaned = false

      // Check if variant exists
      if (mapping.variant) {
        try {
          await payload.findByID({
            collection: 'product-variants',
            id: typeof mapping.variant === 'object' ? mapping.variant.id : mapping.variant,
            depth: 0,
          })
        } catch (error) {
          console.log(`❌ Variant ${mapping.variant} not found for mapping ${mapping.id}`)
          isOrphaned = true
        }
      } else {
        isOrphaned = true
      }

      // Check if product exists
      if (mapping.product && !isOrphaned) {
        try {
          await payload.findByID({
            collection: 'products',
            id: typeof mapping.product === 'object' ? mapping.product.id : mapping.product,
            depth: 0,
          })
        } catch (error) {
          console.log(`❌ Product ${mapping.product} not found for mapping ${mapping.id}`)
          isOrphaned = true
        }
      } else if (!mapping.product) {
        isOrphaned = true
      }

      if (isOrphaned) {
        orphanedIds.push(mapping.id)
      }
    }

    // Delete orphaned mappings
    for (const id of orphanedIds) {
      try {
        await payload.delete({
          collection: 'product-variant-mappings',
          id,
          overrideAccess: true,
        })
        deletedCount++
        console.log(`✅ Deleted orphaned mapping ${id}`)
      } catch (error) {
        console.error(`❌ Failed to delete mapping ${id}:`, error)
      }
    }

    console.log(`🧹 Cleanup complete: Deleted ${deletedCount} orphaned mappings`)

    // Verify no orphaned records remain
    const remainingMappings = await payload.find({
      collection: 'product-variant-mappings',
      limit: 1000,
      depth: 0,
    })

    let stillOrphaned = 0
    for (const mapping of remainingMappings.docs) {
      let isOrphaned = false

      if (mapping.variant) {
        try {
          await payload.findByID({
            collection: 'product-variants',
            id: typeof mapping.variant === 'object' ? mapping.variant.id : mapping.variant,
            depth: 0,
          })
        } catch {
          isOrphaned = true
        }
      } else {
        isOrphaned = true
      }

      if (mapping.product && !isOrphaned) {
        try {
          await payload.findByID({
            collection: 'products',
            id: typeof mapping.product === 'object' ? mapping.product.id : mapping.product,
            depth: 0,
          })
        } catch {
          isOrphaned = true
        }
      } else if (!mapping.product) {
        isOrphaned = true
      }

      if (isOrphaned) {
        stillOrphaned++
      }
    }

    if (stillOrphaned === 0) {
      console.log('✅ All variant mappings are now valid - foreign key constraints should work')
    } else {
      console.log(`⚠️  Warning: ${stillOrphaned} orphaned mappings still exist`)
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupOrphanedMappings()
    .then(() => {
      console.log('✅ Cleanup script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error)
      process.exit(1)
    })
}
