-- Run this SQL directly in your MySQL client or phpMyAdmin

-- Add image_uploader_technician_id column to installation_details table
ALTER TABLE installation_details
  ADD COLUMN IF NOT EXISTS image_uploader_technician_id INT NULL COMMENT 'Employee ID of technician who will upload images' AFTER technician_details;

-- Add foreign key constraint
ALTER TABLE installation_details
  ADD CONSTRAINT fk_installation_image_uploader 
  FOREIGN KEY (image_uploader_technician_id) 
  REFERENCES employees(id) 
  ON DELETE SET NULL;

-- Add index for better query performance
ALTER TABLE installation_details
  ADD INDEX idx_image_uploader (image_uploader_technician_id);

-- Update column comment for better clarity
ALTER TABLE installation_details
  MODIFY COLUMN technician_details JSON NULL COMMENT 'Array of all technicians (internal: {type, id, name}, external: {type, name, phone})';

-- Verify the changes
DESCRIBE installation_details;
