const { pool } = require('../db/pool');

// Helper: Get employee ID by role (with optional district matching for Utility Officer)
async function getEmployeeByRole(role, district = null) {
  let query = 'SELECT id FROM employees WHERE employee_role = ?';
  const params = [role];
  
  // For Utility Officer, prioritize matching district
  if (role === 'Utility Officer' && district) {
    query += ' AND district = ?';
    params.push(district);
  }
  
  query += ' LIMIT 1';
  
  const [rows] = await pool.query(query, params);
  
  // If no Utility Officer found with matching district, try any Utility Officer
  if (!rows[0] && role === 'Utility Officer' && district) {
    const [fallbackRows] = await pool.query(
      'SELECT id FROM employees WHERE employee_role = ? LIMIT 1',
      [role]
    );
    return fallbackRows[0]?.id || null;
  }
  
  return rows[0]?.id || null;
}

// Helper: Create task
async function createTask(applicationId, work, assigneeId) {
  const assignee = Number(assigneeId) || null;
  if (!assignee) {
    console.warn(`No assignee ID provided for task application_id=${applicationId}`);
    return null;
  }

  const [result] = await pool.query(
    'INSERT INTO tasks (application_id, work, assigned_to_id, status) VALUES (?, ?, ?, ?)',
    [applicationId, work, assignee, 'pending']
  );
  
  return result.insertId;
}

// Helper: Create draft completion task for Sales Executive
async function createDraftCompletionTask(applicationId, applicantName, mobileNumber, salesExecId) {
  const assignee = Number(salesExecId) || null;
  if (!assignee) return null;
  const work = `Complete applicant form for ${applicantName} (${mobileNumber})`;
  return createTask(applicationId, work, assignee);
}

async function createApplication(data) {
  const {
    sales_executive_id,
    sales_executive_name,
    applicant_name,
    mobile_number,
    email_id,
    solar_plant_type,
    solar_system_type,
    plant_size_kw,
    plant_price,
    installation_pincode,
    district,
    site_address,
    site_latitude,
    site_longitude,
    payment_mode,
    advance_payment_mode,
    upi_type,
    margin_money,
    special_finance_required,
    meter_type,
    name_correction_required,
    correct_name,
    load_enhancement_required,
    current_load,
    required_load,
    cot_required,
    cot_type,
    cot_documents,
    building_floor_number,
    structure_type,
    free_shadow_area,
    installation_date_feasible,
    application_status,
    aadhaar_front_url,
    aadhaar_back_url,
    pan_card_url,
    electric_bill_url,
    smart_meter_doc_url,
    cancel_cheque_url,
    bank_details_doc_url,
    cot_death_certificate_url,
    cot_house_papers_url,
    cot_passport_photo_url,
    cot_family_registration_url,
    cot_aadhaar_photos_urls,
    cot_live_to_live_aadhaar_1_url,
    cot_live_to_live_aadhaar_2_url,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO applications (
      sales_executive_id,
      sales_executive_name,
      applicant_name,
      mobile_number,
      email_id,
      solar_plant_type,
      solar_system_type,
      plant_size_kw,
      plant_price,
      installation_pincode,
      district,
      site_address,
      site_latitude,
      site_longitude,
      payment_mode,
      advance_payment_mode,
      upi_type,
      margin_money,
      special_finance_required,
      meter_type,
      name_correction_required,
      correct_name,
      load_enhancement_required,
      current_load,
      required_load,
      cot_required,
      cot_type,
      cot_documents,
      building_floor_number,
      structure_type,
      free_shadow_area,
      installation_date_feasible,
      application_status,
      aadhaar_front_url,
      aadhaar_back_url,
      pan_card_url,
      electric_bill_url,
      smart_meter_doc_url,
      cancel_cheque_url,
      bank_details_doc_url,
      cot_death_certificate_url,
      cot_house_papers_url,
      cot_passport_photo_url,
      cot_family_registration_url,
      cot_aadhaar_photos_urls,
      cot_live_to_live_aadhaar_1_url,
      cot_live_to_live_aadhaar_2_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sales_executive_id,
      sales_executive_name,
      applicant_name,
      mobile_number,
      email_id || null,
      solar_plant_type,
      solar_system_type,
      plant_size_kw,
      plant_price,
      installation_pincode || null,
      district || null,
      site_address || null,
      site_latitude || null,
      site_longitude || null,
      payment_mode || null,
      advance_payment_mode || null,
      upi_type || null,
      margin_money || null,
      special_finance_required || 'No',
      meter_type || null,
      name_correction_required || 'Not Required',
      correct_name || null,
      load_enhancement_required || 'Not Required',
      current_load || null,
      required_load || null,
      cot_required || 'No',
      cot_type || null,
      cot_documents || null,
      building_floor_number || null,
      structure_type || null,
      free_shadow_area || null,
      installation_date_feasible || null,
      application_status || 'DRAFT',
      aadhaar_front_url || null,
      aadhaar_back_url || null,
      pan_card_url || null,
      electric_bill_url || null,
      smart_meter_doc_url || null,
      cancel_cheque_url || null,
      bank_details_doc_url || null,
      cot_death_certificate_url || null,
      cot_house_papers_url || null,
      cot_passport_photo_url || null,
      cot_family_registration_url || null,
      cot_aadhaar_photos_urls || null,
      cot_live_to_live_aadhaar_1_url || null,
      cot_live_to_live_aadhaar_2_url || null,
    ]
  );

  const applicationId = result.insertId;
  const salesExecAssignee = Number(sales_executive_id) || null;

  // If saved as DRAFT, create a task for the Sales Executive to complete the form
  if ((application_status || 'DRAFT') === 'DRAFT') {
    await createDraftCompletionTask(
      applicationId,
      applicant_name,
      mobile_number,
      salesExecAssignee
    );
  }

  // Task 1: Create task for ADMIN for customer registration
  const adminId = await getEmployeeByRole('System Admin');
  if (adminId) {
    await createTask(
      applicationId,
      `Register customer ${applicant_name} (${mobile_number}) - Plant: ${solar_system_type} ${plant_size_kw}kW`,
      adminId
    );
  }

  // Task 2: If special requests or issues, create task for Utility Officer
  const needsUtilityOfficer = 
    (name_correction_required === 'Required') || 
    (load_enhancement_required === 'Required') || 
    (cot_required === 'Yes');

  if (needsUtilityOfficer) {
    let utilityWork = `Customer ${applicant_name} (${mobile_number}) requires: `;
    const requests = [];
    
    if (name_correction_required === 'Required') {
      requests.push(`Name Correction (Correct Name: ${correct_name})`);
    }
    if (load_enhancement_required === 'Required') {
      requests.push(`Load Enhancement (Current: ${current_load}kW → Required: ${required_load}kW)`);
    }
    if (cot_required === 'Yes') {
      requests.push(`COT - ${cot_type}`);
    }
    
    utilityWork += requests.join(', ');

    // Find Utility Officer with matching district
    const utilityOfficerId = await getEmployeeByRole('Utility Officer', district);
    if (utilityOfficerId) {
      await createTask(
        applicationId,
        utilityWork,
        utilityOfficerId
      );
    }
  }

  // Task 3: If special finance is required, create task for ADMIN (Finance)
  if (special_finance_required === 'Yes') {
    const financeAdminId = await getEmployeeByRole('System Admin');
    if (financeAdminId) {
      const financeType = 'Special Finance';
      await createTask(
        applicationId,
        `Arrange ${financeType} for ${applicant_name} (${mobile_number}) - Plant: ${solar_system_type} ${plant_size_kw}kW (₹${plant_price})`,
        financeAdminId
      );
    }
  }

  return {
    application_id: applicationId,
    ...data,
  };
}

// Update an existing application (partial updates allowed)
async function updateApplication(application_id, data) {
  const fields = {
    sales_executive_id: data.sales_executive_id,
    sales_executive_name: data.sales_executive_name,
    applicant_name: data.applicant_name,
    mobile_number: data.mobile_number,
    email_id: data.email_id,
    solar_plant_type: data.solar_plant_type,
    solar_system_type: data.solar_system_type,
    plant_size_kw: data.plant_size_kw,
    plant_price: data.plant_price,
    installation_pincode: data.installation_pincode,
    district: data.district,
    site_address: data.site_address,
    site_latitude: data.site_latitude,
    site_longitude: data.site_longitude,
    payment_mode: data.payment_mode,
    advance_payment_mode: data.advance_payment_mode,
    upi_type: data.upi_type,
    margin_money: data.margin_money,
    special_finance_required: data.special_finance_required,
    meter_type: data.meter_type,
    name_correction_required: data.name_correction_required,
    correct_name: data.correct_name,
    load_enhancement_required: data.load_enhancement_required,
    current_load: data.current_load,
    required_load: data.required_load,
    cot_required: data.cot_required,
    cot_type: data.cot_type,
    cot_documents: data.cot_documents,
    building_floor_number: data.building_floor_number,
    structure_type: data.structure_type,
    free_shadow_area: data.free_shadow_area,
    installation_date_feasible: data.installation_date_feasible,
    application_status: data.application_status,
    aadhaar_front_url: data.aadhaar_front_url,
    aadhaar_back_url: data.aadhaar_back_url,
    pan_card_url: data.pan_card_url,
    electric_bill_url: data.electric_bill_url,
    smart_meter_doc_url: data.smart_meter_doc_url,
    cancel_cheque_url: data.cancel_cheque_url,
    bank_details_doc_url: data.bank_details_doc_url,
    cot_death_certificate_url: data.cot_death_certificate_url,
    cot_house_papers_url: data.cot_house_papers_url,
    cot_passport_photo_url: data.cot_passport_photo_url,
    cot_family_registration_url: data.cot_family_registration_url,
    cot_aadhaar_photos_urls: data.cot_aadhaar_photos_urls,
    cot_live_to_live_aadhaar_1_url: data.cot_live_to_live_aadhaar_1_url,
    cot_live_to_live_aadhaar_2_url: data.cot_live_to_live_aadhaar_2_url,
  };

  const setClauses = [];
  const params = [];

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (setClauses.length === 0) {
    return { success: true, application_id };
  }

  params.push(application_id);

  await pool.query(
    `UPDATE applications SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE application_id = ?`,
    params
  );

  // If marked completed, complete the draft task for the sales executive
  if (data.application_status === 'COMPLETED') {
    const [[existing]] = await pool.query(
      'SELECT sales_executive_id FROM applications WHERE application_id = ? LIMIT 1',
      [application_id]
    );

    const salesExecId = data.sales_executive_id || existing?.sales_executive_id;

    if (salesExecId) {
      await pool.query(
        `UPDATE tasks 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
         WHERE application_id = ? AND assigned_to_id = ? AND work LIKE 'Complete applicant form%'`,
        [application_id, salesExecId]
      );
    }
  }

  return { success: true, application_id };
}

async function getApplications(filters = {}) {
  let query = 'SELECT * FROM applications';
  const params = [];

  if (filters.sales_executive_id) {
    query += ' WHERE sales_executive_id = ?';
    params.push(filters.sales_executive_id);
  }

  query += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getApplicationById(application_id) {
  const [rows] = await pool.query(
    'SELECT * FROM applications WHERE application_id = ? LIMIT 1',
    [application_id]
  );
  return rows[0] || null;
}

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
};
