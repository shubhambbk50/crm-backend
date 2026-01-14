require('dotenv').config();
const { pool } = require('./db/pool');

async function updateApplicationsSchema() {
  try {
    console.log('Updating applications table schema...');

    // Add new columns
    const alterations = [
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS site_address TEXT NULL AFTER district",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS cot_death_certificate_url TEXT NULL AFTER bank_details_doc_url",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS cot_house_papers_url TEXT NULL AFTER cot_death_certificate_url",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS cot_passport_photo_url TEXT NULL AFTER cot_house_papers_url",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS cot_family_registration_url TEXT NULL AFTER cot_passport_photo_url",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS cot_aadhaar_photos_urls JSON NULL AFTER cot_family_registration_url",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS cot_live_to_live_aadhaar_1_url TEXT NULL AFTER cot_aadhaar_photos_urls",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS cot_live_to_live_aadhaar_2_url TEXT NULL AFTER cot_live_to_live_aadhaar_1_url",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS correct_name VARCHAR(150) NULL AFTER name_correction_required",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS special_finance_required VARCHAR(20) DEFAULT 'No' AFTER finance_required",
      "ALTER TABLE applications ADD COLUMN IF NOT EXISTS free_shadow_area VARCHAR(50) NULL AFTER structure_type",
      
      // Modify existing columns to VARCHAR
      "ALTER TABLE applications MODIFY COLUMN name_correction_required VARCHAR(20) DEFAULT 'Not Required'",
      "ALTER TABLE applications MODIFY COLUMN load_enhancement_required VARCHAR(20) DEFAULT 'Not Required'",
      "ALTER TABLE applications MODIFY COLUMN cot_required VARCHAR(20) DEFAULT 'No'",
      "ALTER TABLE applications MODIFY COLUMN finance_required VARCHAR(20) DEFAULT 'No'",
      "ALTER TABLE applications MODIFY COLUMN cot_documents TEXT NULL"
    ];

    for (const sql of alterations) {
      try {
        await pool.query(sql);
        console.log(`✓ ${sql.substring(0, 60)}...`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  Column already exists, skipping...`);
        } else {
          console.error(`Error: ${err.message}`);
        }
      }
    }

    console.log('\n✓ Applications table schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

updateApplicationsSchema();
