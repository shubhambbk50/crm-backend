const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Connecting to database...\n');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ Connected to database!\n');
    console.log('📝 Adding image_uploader_technician_id column...\n');

    // Step 1: Add column
    try {
      await connection.query(`
        ALTER TABLE installation_details
        ADD COLUMN image_uploader_technician_id INT NULL 
        COMMENT 'Employee ID of technician who will upload images' 
        AFTER technician_details
      `);
      console.log('   ✓ Added image_uploader_technician_id column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('   ⚠️  Column already exists, skipping...');
      } else {
        throw err;
      }
    }

    // Step 2: Add foreign key
    try {
      await connection.query(`
        ALTER TABLE installation_details
        ADD CONSTRAINT fk_installation_image_uploader 
        FOREIGN KEY (image_uploader_technician_id) 
        REFERENCES employees(id) 
        ON DELETE SET NULL
      `);
      console.log('   ✓ Added foreign key constraint');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_FK_DUP_NAME') {
        console.log('   ⚠️  Foreign key already exists, skipping...');
      } else {
        throw err;
      }
    }

    // Step 3: Add index
    try {
      await connection.query(`
        ALTER TABLE installation_details
        ADD INDEX idx_image_uploader (image_uploader_technician_id)
      `);
      console.log('   ✓ Added index');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('   ⚠️  Index already exists, skipping...');
      } else {
        throw err;
      }
    }

    // Step 4: Update column comment
    try {
      await connection.query(`
        ALTER TABLE installation_details
        MODIFY COLUMN technician_details JSON NULL 
        COMMENT 'Array of all technicians (internal: {type, id, name}, external: {type, name, phone})'
      `);
      console.log('   ✓ Updated technician_details column comment');
    } catch (err) {
      console.log('   ⚠️  Could not update comment, skipping...');
    }

    console.log('\n✅ Migration completed successfully!\n');

    // Verify the changes
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'installation_details'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    console.log('Current installation_details table structure:');
    console.table(columns);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 Migration failed');
      process.exit(1);
    });
}

module.exports = { runMigration };
