const { pool } = require('../../db/pool');

async function run() {
  try {
    console.log('Updating application_status enum to DRAFT/COMPLETED...');

    // Map older statuses to new values
    await pool.query(`
      UPDATE applications 
      SET application_status = 'COMPLETED' 
      WHERE application_status IN ('SUBMITTED', 'VERIFIED');
    `);

    // Alter enum definition
    await pool.query(`
      ALTER TABLE applications 
      MODIFY application_status ENUM('DRAFT','COMPLETED') DEFAULT 'DRAFT';
    `);

    console.log('✓ application_status enum updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
