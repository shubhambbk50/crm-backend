-- Update installation_details table to support technician assignment
-- Adds fields for internal/external technician selection and external technician details

ALTER TABLE installation_details
  ADD COLUMN assigned_technician_id INT NULL COMMENT 'Employee ID if internal technician',
  ADD COLUMN is_external_technician BOOLEAN DEFAULT FALSE COMMENT 'True if technician is external',
  ADD COLUMN external_technician_name VARCHAR(150) NULL COMMENT 'Name of external technician',
  ADD COLUMN external_technician_phone VARCHAR(20) NULL COMMENT 'Phone number of external technician',
  ADD CONSTRAINT fk_installation_assigned_technician FOREIGN KEY (assigned_technician_id) REFERENCES employees(id) ON DELETE SET NULL,
  ADD INDEX idx_assigned_technician (assigned_technician_id);
