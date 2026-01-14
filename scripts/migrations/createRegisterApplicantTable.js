const { pool } = require('./db/pool');
const fs = require('fs');
const path = require('path');

async function runRegisterApplicantSchema() {
  try {
    console.log('Creating register_applicant table...');
    
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'db/schema/register_applicant.sql'),
      'utf8'
    );
    
    await pool.query(schemaSQL);
    
    console.log('✓ register_applicant table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

runRegisterApplicantSchema();
