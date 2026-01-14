const { pool } = require('./db/pool');

async function dropFinanceRequired() {
  try {
    console.log('Removing finance_required column from applications table...');
    
    const [result] = await pool.query("ALTER TABLE applications DROP COLUMN IF EXISTS finance_required");
    
    console.log('✓ Column finance_required removed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error removing column:', err.message);
    process.exit(1);
  }
}

dropFinanceRequired();
