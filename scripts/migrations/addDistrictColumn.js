require('dotenv').config();
const { pool } = require('./db/pool');

async function addDistrictColumn() {
  try {
    console.log('Adding district column to employees table...');

    await pool.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL 
      AFTER phone_number
    `);

    console.log('✓ District column added successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('District column already exists. Skipping...');
      process.exit(0);
    }
    console.error('Error adding district column:', error);
    process.exit(1);
  }
}

addDistrictColumn();
