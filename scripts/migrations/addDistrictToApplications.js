require('dotenv').config();
const { pool } = require('./db/pool');

async function addDistrictToApplications() {
  try {
    console.log('Adding district column to applications table...');

    await pool.query(`
      ALTER TABLE applications 
      ADD COLUMN district VARCHAR(100) NULL 
      AFTER installation_pincode
    `);

    console.log('✓ District column added to applications table successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('District column already exists in applications table. Skipping...');
      process.exit(0);
    }
    console.error('Error adding district column to applications:', error);
    process.exit(1);
  }
}

addDistrictToApplications();
