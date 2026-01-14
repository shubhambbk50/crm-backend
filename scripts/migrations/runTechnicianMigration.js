const fs = require('fs');
const path = require('path');
const { pool } = require('../../db/pool');

async function runMigration() {
  try {
    console.log('🚀 Starting technician features migration...\n');

    // Step 1: Update installation_details table
    console.log('📝 Step 1: Updating installation_details table...');
    const alterTablePath = path.join(__dirname, 'updateInstallationDetailsForTechnician.sql');
    const alterTableSQL = fs.readFileSync(alterTablePath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = alterTableSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        // Ignore duplicate column errors
        if (!err.message.includes('Duplicate column name')) {
          throw err;
        }
        console.log('   ⚠️  Column already exists, skipping...');
      }
    }
    console.log('   ✅ installation_details table updated\n');

    // Step 2: Create technician_images table
    console.log('📝 Step 2: Creating technician_images table...');
    const createTablePath = path.join(__dirname, '../../db/schema/technician_images.sql');
    const createTableSQL = fs.readFileSync(createTablePath, 'utf-8');
    await pool.query(createTableSQL);
    console.log('   ✅ technician_images table created\n');

    console.log('✅ Migration completed successfully!\n');
    console.log('Summary:');
    console.log('  - Updated installation_details table with technician fields');
    console.log('  - Created technician_images table for image tracking');
    console.log('  - Ready to use new technician assignment features\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigration };
