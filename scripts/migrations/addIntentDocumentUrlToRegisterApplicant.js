const { pool } = require('../../db/pool');

async function run() {
  try {
    console.log('Adding intent_document_url column to register_applicant...');

    await pool.query(`
      ALTER TABLE register_applicant 
      ADD COLUMN intent_document_url TEXT NULL AFTER plan_commissioning_form_url;
    `);

    console.log('✓ intent_document_url column added successfully');
    process.exit(0);
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('✓ Column already exists, skipping');
      process.exit(0);
    }
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
