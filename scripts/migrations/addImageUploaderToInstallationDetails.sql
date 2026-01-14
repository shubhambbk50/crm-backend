-- Update installation_details table to support multiple technicians and designated image uploader
-- Adds image_uploader_technician_id field for the technician who will upload installation images

ALTER TABLE installation_details
  ADD COLUMN image_uploader_technician_id INT NULL COMMENT 'Employee ID of technician who will upload images' AFTER technician_details,
  ADD CONSTRAINT fk_installation_image_uploader FOREIGN KEY (image_uploader_technician_id) REFERENCES employees(id) ON DELETE SET NULL,
  ADD INDEX idx_image_uploader (image_uploader_technician_id);

-- Update column comment for better clarity
ALTER TABLE installation_details
  MODIFY COLUMN technician_details JSON NULL COMMENT 'Array of all technicians (internal: {id, name}, external: {name, phone})';
