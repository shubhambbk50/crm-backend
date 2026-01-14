const fs = require('fs');
const path = require('path');
const { pool } = require('../../db/pool');

async function createTechnicianImagesTable() {
  try {
    const schemaPath = path.join(__dirname, '../../db/schema/technician_images.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);
    console.log('✅ technician_images table created successfully');
  } catch (error) {
    console.error('❌ Error creating technician_images table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createTechnicianImagesTable()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { createTechnicianImagesTable };
