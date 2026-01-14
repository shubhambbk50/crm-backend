-- Technician Images Table
-- Stores images uploaded by installation technicians
-- Tracks solar panel, inverter, and logger images per application

CREATE TABLE IF NOT EXISTS technician_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- Association
  application_id BIGINT NOT NULL,
  task_id BIGINT NULL COMMENT 'Related task for image upload',

  -- Technician info (can be internal or external)
  technician_id INT NULL COMMENT 'Employee ID if internal technician',
  external_technician_name VARCHAR(150) NULL COMMENT 'Name if external technician',
  external_technician_phone VARCHAR(20) NULL COMMENT 'Phone if external technician',

  -- Image URLs
  solar_panel_image_url VARCHAR(500) NULL,
  inverter_image_url VARCHAR(500) NULL,
  logger_image_url VARCHAR(500) NULL,

  -- Upload status
  upload_status ENUM('pending', 'partial', 'completed') DEFAULT 'pending',

  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_tech_images_application FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
  CONSTRAINT fk_tech_images_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  CONSTRAINT fk_tech_images_technician FOREIGN KEY (technician_id) REFERENCES employees(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_tech_images_application (application_id),
  INDEX idx_tech_images_task (task_id),
  INDEX idx_tech_images_technician (technician_id),
  INDEX idx_upload_status (upload_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
