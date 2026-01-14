const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    charset: 'utf8mb4',
    ssl: {
      rejectUnauthorized: false
    }
  };

  if (!config.host || !config.user || !config.database) {
    throw new Error('Missing DB env vars. Ensure DB_HOST, DB_USER, DB_PASS, DB_NAME are set.');
  }

  const conn = await mysql.createConnection(config);
  try {
    const schemaDir = path.join(__dirname, 'db', 'schema');
    // Apply schemas in order to satisfy foreign keys
    const files = ['employees.sql', 'applications.sql', 'tasks.sql'];

    for (const file of files) {
      const fullPath = path.join(schemaDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`\nApplying ${file}...`);
      await conn.query(sql);
      console.log(`Applied ${file}.`);
    }

    console.log('\nMigration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

run();
