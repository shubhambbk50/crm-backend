const { pool } = require('../../db/pool');

async function addCommissionDocUrlColumn() {
  try {
    // Check if column already exists
    const [columns] = await pool.query(
      `SHOW COLUMNS FROM register_applicant LIKE 'commission_doc_url'`
    );

    if (columns.length > 0) {
      console.log('⚠️  commission_doc_url column already exists');
      return;
    }

    // Add commission_doc_url column
    await pool.query(
      `ALTER TABLE register_applicant 
       ADD COLUMN commission_doc_url TEXT NULL 
       AFTER intent_document_url`
    );

    console.log('✅ commission_doc_url column added successfully');
  } catch (error) {
    console.error('❌ Error adding commission_doc_url column:', error.message);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  addCommissionDocUrlColumn()
    .then(() => {
      console.log('Migration completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { addCommissionDocUrlColumn };
