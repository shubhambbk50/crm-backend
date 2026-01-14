-- Tasks Table
-- Tracks application-linked tasks, assignee, and status

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- Association
  application_id BIGINT NOT NULL,

  -- Task content
  work TEXT NOT NULL,

  -- Status lifecycle
  status ENUM('pending','in_progress','completed') DEFAULT 'pending',

  -- Assignee
  assigned_to_id INT NOT NULL,

  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_tasks_application FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES employees(id) ON DELETE RESTRICT,

  -- Indexes
  INDEX idx_application_id (application_id),
  INDEX idx_assigned_to_id (assigned_to_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
