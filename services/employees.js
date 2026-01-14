const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');

async function findByEmail(email_id) {
  const [rows] = await pool.query(
    'SELECT id, name, email_id, phone_number, district, employee_role, password_hash FROM employees WHERE email_id = ? LIMIT 1',
    [email_id]
  );
  return rows[0] || null;
}

async function createEmployee({ name, email_id, phone_number, district, employee_role, password }) {
  const existing = await findByEmail(email_id);
  if (existing) {
    const err = new Error('Email already in use.');
    err.code = 'DUP_EMAIL';
    throw err;
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const [result] = await pool.query(
    'INSERT INTO employees (name, email_id, phone_number, district, employee_role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email_id, phone_number, district || null, employee_role, password_hash]
  );
  return { employeeId: result.insertId, name, role: employee_role };
}

async function validateCredentials(email_id, password) {
  const user = await findByEmail(email_id);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return null;
  return { employeeId: user.id, name: user.name, role: user.employee_role };
}

async function getEmployeesByRole(role) {
  const [rows] = await pool.query(
    'SELECT id, name, email_id, phone_number, district FROM employees WHERE employee_role = ? ORDER BY name ASC',
    [role]
  );
  return rows;
}

module.exports = {
  findByEmail,
  createEmployee,
  validateCredentials,
  getEmployeesByRole,
};
