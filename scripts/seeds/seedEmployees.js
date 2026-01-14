require('dotenv').config();
const { pool } = require('./db/pool');
const bcrypt = require('bcryptjs');

const employees = [
  {
    name: 'sales',
    email: 'sales@gmail.com',
    password: 'password123', // Default password for all
    phone_number: '12121212121',
    role: 'Sales Executive',
    district: 'Ghazipur'
  },
  {
    name: 'systemadmin',
    email: 'systemadmin@gmail.com',
    password: 'password123',
    phone_number: '12121212121',
    role: 'System Admin',
    district: 'Ghazipur'
  },
  {
    name: 'utilityofficer',
    email: 'utilityofficer@gmail.com',
    password: 'password123',
    phone_number: '12121212121',
    role: 'Utility Officer',
    district: 'Ghazipur'
  },
  {
    name: 'financeofficer',
    email: 'financeofficer@gmail.com',
    password: 'password123',
    phone_number: '12121212121',
    role: 'Finance Officer',
    district: 'Ghazipur'
  },
  {
    name: 'operationsengineer',
    email: 'operationsengineer@gmail.com',
    password: 'password123',
    phone_number: '12121212121',
    role: 'Operations Engineer',
    district: 'Ghazipur'
  },
  {
    name: 'installationtechnician',
    email: 'installationtechnician@gmail.com',
    password: 'password123',
    phone_number: '12121212121',
    role: 'Installation Technician',
    district: 'Ghazipur'
  },
  {
    name: 'superadmin',
    email: 'superadmin@gmail.com',
    password: 'password123',
    phone_number: '12121212121',
    role: 'Super Admin',
    district: 'Ghazipur'
  }
];

async function seedEmployees() {
  try {
    console.log('Starting employee seeding...');

    for (const employee of employees) {
      // Check if employee already exists
      const [existingEmployee] = await pool.query(
        'SELECT email_id FROM employees WHERE email_id = ?',
        [employee.email]
      );

      if (existingEmployee.length > 0) {
        console.log(`Employee ${employee.name} (${employee.email}) already exists. Skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(employee.password, 10);

      // Insert employee
      await pool.query(
        `INSERT INTO employees (name, email_id, password_hash, phone_number, employee_role, district)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          employee.name,
          employee.email,
          hashedPassword,
          employee.phone_number,
          employee.role,
          employee.district
        ]
      );

      console.log(`✓ Created employee: ${employee.name} (${employee.role})`);
    }

    console.log('\nEmployee seeding completed successfully!');
    console.log(`Total employees created/verified: ${employees.length}`);
    console.log('\nDefault password for all employees: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding employees:', error);
    process.exit(1);
  }
}

seedEmployees();
