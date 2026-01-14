const fs = require('fs');
const path = require('path');
const { pool } = require('../../db/pool');

async function runMigration() {
  try {
    console.log('🚀 Starting image uploader field migration...\n');

    console.log('📝 Adding image_uploader_technician_id to installation_details table...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'addImageUploaderToInstallationDetails.sql'),
      'utf-8'
    );
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log('   ✓ Executed statement');
      } catch (err) {
        // Ignore errors for already existing columns/constraints
        if (err.message.includes('Duplicate column') || err.message.includes('Duplicate key')) {
          console.log('   ⚠️  Column/constraint already exists, skipping...');
        } else {
          throw err;
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!\n');
    console.log('Summary:');
    console.log('  - Added image_uploader_technician_id column');
    console.log('  - Added foreign key constraint');
    console.log('  - Updated technician_details column comment');
    console.log('\nReady to assign image upload responsibilities!\n');

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
