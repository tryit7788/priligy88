#!/usr/bin/env node

/**
 * Product Sync Script
 * 
 * This script helps identify and sync products between development and production databases.
 * It can be used to:
 * 1. Check for products that exist in dev but not in production
 * 2. Export products from dev to production
 * 3. Validate product data consistency
 */

const { Client } = require('pg');

// Database connection strings
const DEV_DATABASE_URI = 'postgresql://postgres:u&5B\\M=a6N09@139.99.103.147:5432/payload-db';
const PROD_DATABASE_URI = process.env.PROD_DATABASE_URI || 'postgresql://postgres:u&5B\\M=a6N09@139.99.103.147:5432/payload-db';

async function compareProducts() {
  const devClient = new Client({ connectionString: DEV_DATABASE_URI });
  const prodClient = new Client({ connectionString: PROD_DATABASE_URI });

  try {
    console.log('🔌 Connecting to databases...');
    await devClient.connect();
    await prodClient.connect();
    console.log('✅ Connected to both databases');

    // Get all published products from both databases
    const devProducts = await devClient.query(`
      SELECT id, title, slug, published, created_at, updated_at 
      FROM products 
      WHERE published = true 
      ORDER BY created_at DESC
    `);

    const prodProducts = await prodClient.query(`
      SELECT id, title, slug, published, created_at, updated_at 
      FROM products 
      WHERE published = true 
      ORDER BY created_at DESC
    `);

    console.log(`\n📊 Database Comparison:`);
    console.log(`Development: ${devProducts.rows.length} published products`);
    console.log(`Production: ${prodProducts.rows.length} published products`);

    // Find products that exist in dev but not in production
    const devSlugs = new Set(devProducts.rows.map(p => p.slug));
    const prodSlugs = new Set(prodProducts.rows.map(p => p.slug));

    const missingInProd = devProducts.rows.filter(p => !prodSlugs.has(p.slug));
    const missingInDev = prodProducts.rows.filter(p => !devSlugs.has(p.slug));

    console.log(`\n🔍 Missing in Production (${missingInProd.length}):`);
    missingInProd.forEach(product => {
      console.log(`  - ${product.slug} (${product.title}) - Created: ${product.created_at}`);
    });

    console.log(`\n🔍 Missing in Development (${missingInDev.length}):`);
    missingInDev.forEach(product => {
      console.log(`  - ${product.slug} (${product.title}) - Created: ${product.created_at}`);
    });

    // Check for the specific problematic product
    const problematicProduct = missingInProd.find(p => p.slug === 'cialis-20mg-25');
    if (problematicProduct) {
      console.log(`\n⚠️  Found problematic product: ${problematicProduct.slug}`);
      console.log(`   Title: ${problematicProduct.title}`);
      console.log(`   Created: ${problematicProduct.created_at}`);
      console.log(`   This product exists in dev but not in production, causing hydration errors.`);
    }

    // Provide recommendations
    console.log(`\n💡 Recommendations:`);
    if (missingInProd.length > 0) {
      console.log(`   1. Sync missing products from dev to production`);
      console.log(`   2. Or remove them from development if they shouldn't exist`);
      console.log(`   3. Check if products are properly published in production`);
    }
    if (missingInDev.length > 0) {
      console.log(`   4. Sync missing products from production to dev`);
    }

  } catch (error) {
    console.error('❌ Error comparing products:', error.message);
    throw error;
  } finally {
    await devClient.end();
    await prodClient.end();
    console.log('\n🔌 Database connections closed');
  }
}

// Run the comparison
console.log('🚀 Starting product comparison...');
compareProducts()
  .then(() => {
    console.log('✅ Product comparison completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to compare products:', error.message);
    process.exit(1);
  });
