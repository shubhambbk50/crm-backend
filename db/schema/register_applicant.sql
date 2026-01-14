-- Register Applicant Table
-- Stores documents for applicant registration process
-- Links to applications table via application_id

CREATE TABLE IF NOT EXISTS register_applicant (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- Association
  application_id BIGINT NOT NULL UNIQUE,

  -- Document URLs
  application_form_url TEXT NULL,
  feasibility_form_url TEXT NULL,
  subsidy_form_url TEXT NULL,
  plan_commissioning_form_url TEXT NULL,
  intent_document_url TEXT NULL,
  commission_doc_url TEXT NULL,

  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key
  CONSTRAINT fk_register_applicant_application FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,

  -- Index
  INDEX idx_application_id (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
