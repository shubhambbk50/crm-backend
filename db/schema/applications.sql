-- Applications Table
-- Captures sales ownership, applicant details, solar plant info, documents, flags, payment, feasibility and system fields

CREATE TABLE IF NOT EXISTS applications (
  application_id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- SALES OWNERSHIP
  sales_executive_id INT NOT NULL,
  sales_executive_name VARCHAR(150) NULL,

  -- APPLICANT DETAILS
  applicant_name VARCHAR(150) NULL,
  mobile_number VARCHAR(20) NOT NULL,
  email_id VARCHAR(150) NULL,

  -- SOLAR PLANT DETAILS
  solar_plant_type VARCHAR(50) NULL,
  solar_system_type VARCHAR(20) NULL,
  plant_size_kw VARCHAR(20) NULL,
  plant_price DECIMAL(12,2) NULL,

  -- LOCATION DETAILS
  installation_pincode VARCHAR(10) NULL,
  district VARCHAR(100) NULL,
  site_address TEXT NULL,
  site_latitude DECIMAL(10,6) NULL,
  site_longitude DECIMAL(10,6) NULL,

  -- DOCUMENT URLS
  aadhaar_front_url TEXT NULL,
  aadhaar_back_url TEXT NULL,
  pan_card_url TEXT NULL,
  electric_bill_url TEXT NULL,
  smart_meter_doc_url TEXT NULL,
  cancel_cheque_url TEXT NULL,
  bank_details_doc_url TEXT NULL,

  -- COT DOCUMENT URLS
  cot_death_certificate_url TEXT NULL,
  cot_house_papers_url TEXT NULL,
  cot_passport_photo_url TEXT NULL,
  cot_family_registration_url TEXT NULL,
  cot_aadhaar_photos_urls JSON NULL,
  cot_live_to_live_aadhaar_1_url TEXT NULL,
  cot_live_to_live_aadhaar_2_url TEXT NULL,

  -- METER DETAILS
  meter_type VARCHAR(20) NULL,

  -- SPECIAL REQUEST FLAGS
  name_correction_required VARCHAR(20) DEFAULT 'Not Required',
  correct_name VARCHAR(150) NULL,
  load_enhancement_required VARCHAR(20) DEFAULT 'Not Required',
  current_load VARCHAR(50) NULL,
  required_load VARCHAR(50) NULL,

  cot_required VARCHAR(20) DEFAULT 'No',
  cot_type VARCHAR(20) NULL,
  cot_documents TEXT NULL,

  -- PAYMENT DETAILS
  payment_mode VARCHAR(20) NULL,
  advance_payment_mode VARCHAR(20) NULL,
  upi_type VARCHAR(20) NULL,
  margin_money DECIMAL(12,2) NULL,
  special_finance_required VARCHAR(20) DEFAULT 'No',

  -- PLANT STRUCTURE
  building_floor_number INT NULL,
  structure_type VARCHAR(20) NULL,
  free_shadow_area VARCHAR(50) NULL,

  -- PROJECT FEASIBILITY
  installation_date_feasible DATE NULL,

  -- SYSTEM FIELDS
  application_status ENUM('DRAFT','COMPLETED') DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_app_sales_exec FOREIGN KEY (sales_executive_id) REFERENCES employees(id) ON DELETE RESTRICT,

  -- Indexes
  INDEX idx_sales_executive_id (sales_executive_id),
  INDEX idx_mobile_number (mobile_number),
  INDEX idx_pincode (installation_pincode),
  INDEX idx_application_status (application_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
