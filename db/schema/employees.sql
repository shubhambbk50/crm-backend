-- Employees Table
-- Stores staff accounts used for authentication and role-based access

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Identity
  name VARCHAR(150) NOT NULL,
  email_id VARCHAR(150) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  district VARCHAR(100) NULL,

  -- Role (system role names as per mapping)
  employee_role ENUM(
    'Sales Executive',
    'System Admin',
    'Utility Officer',
    'Finance Officer',
    'Operations Engineer',
    'Installation Technician',
    'Super Admin'
  ) NOT NULL,

  -- Authentication
  password_hash VARCHAR(255) NOT NULL,

  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_email_id (email_id),
  INDEX idx_employee_role (employee_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
