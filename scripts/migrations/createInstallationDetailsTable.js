const { pool } = require('../../db/pool');

async function createInstallationDetailsTable() {
  try {
    const sqlQuery = `
      CREATE TABLE IF NOT EXISTS installation_details (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        application_id BIGINT NOT NULL UNIQUE,
        store_location VARCHAR(100) NULL,
        plant_installation_date DATE NULL,
        technician_details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_installation_details_application FOREIGN KEY (application_id) 
          REFERENCES applications(application_id) ON DELETE CASCADE,
        INDEX idx_application_id (application_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await pool.query(sqlQuery);
    console.log('✅ installation_details table created successfully');
  } catch (error) {
    console.error('❌ Error creating installation_details table:', error.message);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  createInstallationDetailsTable()
    .then(() => {
      console.log('Migration completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { createInstallationDetailsTable };
