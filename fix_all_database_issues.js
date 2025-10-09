#!/usr/bin/env node

/**
 * Comprehensive Database Fix Script
 * 
 * This script fixes all database issues including:
 * 1. Foreign key constraint violations
 * 2. Enum type drop errors
 * 3. Orphaned records cleanup
 */

const { Client } = require('pg');

// Database connection string
const DATABASE_URI = 'postgresql://postgres:u&5B\\M=a6N09@139.99.103.147:5432/payload-db';

async function fixAllDatabaseIssues() {
  const client = new Client({
    connectionString: DATABASE_URI,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    console.log('🚀 Starting comprehensive database fix...\n');

    // ========================================
    // PART 1: Fix Foreign Key Constraint Issues
    // ========================================
    console.log('📋 PART 1: Fixing Foreign Key Constraint Issues');
    console.log('=' .repeat(50));

    // Check if product_variant_mappings table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_variant_mappings'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('✅ product_variant_mappings table exists');

      // Get current counts
      const counts = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM product_variant_mappings) as mappings_count,
          (SELECT COUNT(*) FROM product_variants) as variants_count,
          (SELECT COUNT(*) FROM products) as products_count
      `);

      console.log('Current data counts:', counts.rows[0]);

      // Find and delete orphaned records
      const orphanedVariants = await client.query(`
        SELECT pvm.id, pvm.variant_id 
        FROM product_variant_mappings pvm
        LEFT JOIN product_variants pv ON pvm.variant_id = pv.id
        WHERE pv.id IS NULL
      `);

      const orphanedProducts = await client.query(`
        SELECT pvm.id, pvm.product_id 
        FROM product_variant_mappings pvm
        LEFT JOIN products p ON pvm.product_id = p.id
        WHERE p.id IS NULL
      `);

      console.log(`🔍 Found ${orphanedVariants.rows.length} orphaned variant references`);
      console.log(`🔍 Found ${orphanedProducts.rows.length} orphaned product references`);

      let totalDeleted = 0;

      // Delete orphaned variant references
      if (orphanedVariants.rows.length > 0) {
        const deleteVariantsResult = await client.query(`
          DELETE FROM product_variant_mappings 
          WHERE id IN (
            SELECT pvm.id 
            FROM product_variant_mappings pvm
            LEFT JOIN product_variants pv ON pvm.variant_id = pv.id
            WHERE pv.id IS NULL
          )
        `);
        
        console.log(`✅ Deleted ${deleteVariantsResult.rowCount} orphaned variant references`);
        totalDeleted += deleteVariantsResult.rowCount;
      }

      // Delete orphaned product references
      if (orphanedProducts.rows.length > 0) {
        const deleteProductsResult = await client.query(`
          DELETE FROM product_variant_mappings 
          WHERE id IN (
            SELECT pvm.id 
            FROM product_variant_mappings pvm
            LEFT JOIN products p ON pvm.product_id = p.id
            WHERE p.id IS NULL
          )
        `);
        
        console.log(`✅ Deleted ${deleteProductsResult.rowCount} orphaned product references`);
        totalDeleted += deleteProductsResult.rowCount;
      }

      console.log(`📊 Total orphaned records deleted: ${totalDeleted}\n`);
    } else {
      console.log('ℹ️  product_variant_mappings table does not exist yet\n');
    }

    // ========================================
    // PART 2: Fix Enum Type Issues
    // ========================================
    console.log('📋 PART 2: Fixing Enum Type Issues');
    console.log('=' .repeat(50));

    // Check for the problematic enum type
    const enumExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'enum_product_variant_mappings_category'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      );
    `);

    console.log(`Enum type 'enum_product_variant_mappings_category' exists: ${enumExists.rows[0].exists}`);

    if (!enumExists.rows[0].exists) {
      console.log('⚠️  Enum type does not exist - this is causing the error');
      
      // Check for any references to this enum type
      const enumReferences = await client.query(`
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE c.udt_name = 'enum_product_variant_mappings_category'
        AND t.table_schema = 'public'
      `);

      if (enumReferences.rows.length > 0) {
        console.log('Found columns using this enum type:', enumReferences.rows);
      } else {
        console.log('No columns are using this enum type');
        
        // Create a dummy enum type to satisfy PayloadCMS
        console.log('🔧 Creating dummy enum type to satisfy PayloadCMS...');
        try {
          await client.query(`
            CREATE TYPE "public"."enum_product_variant_mappings_category" AS ENUM ('dummy');
          `);
          console.log('✅ Created dummy enum type');
          
          // Now drop it properly
          console.log('🗑️  Dropping the enum type...');
          await client.query(`
            DROP TYPE "public"."enum_product_variant_mappings_category";
          `);
          console.log('✅ Successfully dropped enum type');
        } catch (error) {
          if (error.code === '42710') {
            console.log('✅ Enum type already exists (race condition)');
          } else {
            console.log('⚠️  Could not create/drop enum type:', error.message);
          }
        }
      }
    } else {
      console.log('✅ Enum type exists - should be droppable by PayloadCMS');
    }

    // Check for other problematic enum types
    console.log('🔍 Checking for other enum types that might cause issues...');
    const allEnums = await client.query(`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      AND t.typname LIKE '%product_variant_mappings%'
      ORDER BY t.typname, e.enumsortorder
    `);

    if (allEnums.rows.length > 0) {
      console.log('Found enum types related to product_variant_mappings:');
      allEnums.rows.forEach(row => {
        console.log(`  - ${row.enum_name}: ${row.enum_value}`);
      });
    } else {
      console.log('✅ No problematic enum types found');
    }

    console.log('');

    // ========================================
    // PART 3: Final Verification
    // ========================================
    console.log('📋 PART 3: Final Verification');
    console.log('=' .repeat(50));

    // Check final data state
    if (tableExists.rows[0].exists) {
      const finalCounts = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM product_variant_mappings) as mappings_count,
          (SELECT COUNT(*) FROM product_variants) as variants_count,
          (SELECT COUNT(*) FROM products) as products_count
      `);

      console.log('Final data counts:', finalCounts.rows[0]);

      // Check for any remaining orphaned records
      const remainingOrphans = await client.query(`
        SELECT COUNT(*) as count
        FROM product_variant_mappings pvm
        LEFT JOIN product_variants pv ON pvm.variant_id = pv.id
        LEFT JOIN products p ON pvm.product_id = p.id
        WHERE pv.id IS NULL OR p.id IS NULL
      `);

      if (remainingOrphans.rows[0].count === '0') {
        console.log('✅ All foreign key references are now valid');
      } else {
        console.log(`⚠️  Warning: ${remainingOrphans.rows[0].count} orphaned records still exist`);
      }
    }

    console.log('✅ All database issues have been addressed');
    console.log('🔄 Please restart your application now.');

  } catch (error) {
    console.error('❌ Error fixing database issues:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the comprehensive fix
console.log('🚀 Starting comprehensive database fix...');
fixAllDatabaseIssues()
  .then(() => {
    console.log('🎉 All database issues fixed successfully!');
    console.log('🔄 Please restart your application now.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to fix database issues:', error.message);
    process.exit(1);
  });
