-- Installation Details Table
-- Stores installation details filled by Operations Engineer
-- Tracks store, installation date, and assigned technicians

CREATE TABLE IF NOT EXISTS installation_details (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- Association
  application_id BIGINT NOT NULL UNIQUE,

  -- Installation Info
  store_location VARCHAR(100) NULL,
  plant_installation_date DATE NULL,
  technician_details JSON NULL COMMENT 'Array of all technicians (internal: {id, name}, external: {name, phone})',

  -- Image Uploader Technician (must be internal)
  image_uploader_technician_id INT NULL COMMENT 'Employee ID of technician who will upload images',

  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_installation_details_application FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
  CONSTRAINT fk_installation_image_uploader FOREIGN KEY (image_uploader_technician_id) REFERENCES employees(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_application_id (application_id),
  INDEX idx_image_uploader (image_uploader_technician_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
