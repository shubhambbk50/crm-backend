require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing connection with:');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Connection successful!');
    
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('✅ Query successful:', rows);
    
    await connection.end();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n⚠️  This means:');
      console.log('   1. Remote MySQL is not enabled in Hostinger');
      console.log('   2. Or your IP address is not whitelisted');
      console.log('   3. Or the password is incorrect');
      console.log('\n👉 Go to Hostinger Panel → Databases → Remote MySQL');
      console.log('👉 Add your IP or "%" to allow all connections');
    }
  }
}

testConnection();
