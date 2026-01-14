const { pool } = require('../db/pool');

// Helper: Get employee ID by role (with optional district matching)
async function getEmployeeByRole(role, district = null) {
  let query = 'SELECT id FROM employees WHERE employee_role = ?';
  const params = [role];
  
  // For Utility Officer and Operations Engineer, prioritize matching district
  if ((role === 'Utility Officer' || role === 'Operations Engineer') && district) {
    query += ' AND district = ?';
    params.push(district);
  }
  
  query += ' LIMIT 1';
  const [rows] = await pool.query(query, params);
  
  // If no employee found with matching district, try without district filter
  if (!rows[0] && (role === 'Utility Officer' || role === 'Operations Engineer') && district) {
    const [fallback] = await pool.query(
      'SELECT id FROM employees WHERE employee_role = ? LIMIT 1',
      [role]
    );
    return fallback[0]?.id || null;
  }
  
  return rows[0]?.id || null;
}

// Helper: Create a task if not already exists
async function createTaskIfNotExists(applicationId, work, assigneeId) {
  const assignee = Number(assigneeId) || null;
  if (!assignee) return null;

  const [existing] = await pool.query(
    'SELECT id FROM tasks WHERE application_id = ? AND work = ? LIMIT 1',
    [applicationId, work]
  );
  if (existing[0]) return existing[0].id;

  const [result] = await pool.query(
    'INSERT INTO tasks (application_id, work, assigned_to_id, status) VALUES (?, ?, ?, ?)',
    [applicationId, work, assignee, 'pending']
  );
  return result.insertId;
}

// Create tasks when registration is completed
async function createRegistrationFollowupTasks(applicationData) {
  const {
    application_id,
    applicant_name,
    mobile_number,
    district,
    installation_pincode,
    solar_system_type,
    plant_size_kw,
    site_latitude,
    site_longitude,
  } = applicationData;

  // Get role-based assignees
  const adminId = await getEmployeeByRole('System Admin');
  const operationsHeadId = await getEmployeeByRole('Operations Engineer', district);

  // 1) Hard Copy Indent Creation for ADMIN
  if (adminId) {
    await createTaskIfNotExists(
      application_id,
      `Hard Copy Indent Creation for ${applicant_name} (${mobile_number})`,
      adminId
    );
  }

  // 2) Customer Details to Operation Head
  if (operationsHeadId) {
    const geoInfo = `${site_latitude || 'N/A'},${site_longitude || 'N/A'}`;
    const customerDetailsWork = `Customer Details to Operation Head - ${applicant_name} (${mobile_number}), District: ${district || 'N/A'}, PIN: ${installation_pincode || 'N/A'}, Plant: ${solar_system_type || 'N/A'} ${plant_size_kw || ''}kW, Geo: ${geoInfo}`;
    await createTaskIfNotExists(
      application_id,
      customerDetailsWork,
      operationsHeadId
    );
  }
}

// Save or update register applicant documents
async function saveRegisterApplicantDocs(data, applicationData = null) {
  const {
    application_id,
    application_form_url,
    feasibility_form_url,
    subsidy_form_url,
    plan_commissioning_form_url
  } = data;

  // Check if record exists
  const [existing] = await pool.query(
    'SELECT id FROM register_applicant WHERE application_id = ?',
    [application_id]
  );

  if (existing.length > 0) {
    // Update existing record
    const [result] = await pool.query(
      `UPDATE register_applicant SET 
        application_form_url = COALESCE(?, application_form_url),
        feasibility_form_url = COALESCE(?, feasibility_form_url),
        subsidy_form_url = COALESCE(?, subsidy_form_url),
        plan_commissioning_form_url = COALESCE(?, plan_commissioning_form_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE application_id = ?`,
      [
        application_form_url,
        feasibility_form_url,
        subsidy_form_url,
        plan_commissioning_form_url,
        application_id
      ]
    );

    // Create follow-up tasks when documents are saved
    if (applicationData) {
      await createRegistrationFollowupTasks(applicationData);
    }

    return { 
      success: true, 
      message: 'Documents updated successfully',
      id: existing[0].id,
      application_id
    };
  } else {
    // Insert new record
    const [result] = await pool.query(
      `INSERT INTO register_applicant 
        (application_id, application_form_url, feasibility_form_url, subsidy_form_url, plan_commissioning_form_url) 
      VALUES (?, ?, ?, ?, ?)`,
      [
        application_id,
        application_form_url,
        feasibility_form_url,
        subsidy_form_url,
        plan_commissioning_form_url
      ]
    );

    // Create follow-up tasks when documents are saved
    if (applicationData) {
      await createRegistrationFollowupTasks(applicationData);
    }

    return { 
      success: true, 
      message: 'Documents saved successfully',
      id: result.insertId,
      application_id
    };
  }
}

// Update intent document URL
async function updateIntentDocumentUrl(applicationId, intentDocumentUrl) {
  const [existing] = await pool.query(
    'SELECT id FROM register_applicant WHERE application_id = ?',
    [applicationId]
  );

  if (!existing.length) {
    return {
      success: false,
      error: 'Registration record not found for this application',
      application_id: applicationId
    };
  }

  await pool.query(
    'UPDATE register_applicant SET intent_document_url = ?, updated_at = CURRENT_TIMESTAMP WHERE application_id = ?',
    [intentDocumentUrl, applicationId]
  );

  return {
    success: true,
    message: 'Intent document uploaded successfully',
    id: existing[0].id,
    application_id: applicationId,
    intent_document_url: intentDocumentUrl
  };
}

// Update commission document URL
async function updateCommissionDocUrl(applicationId, commissionDocUrl) {
  const [existing] = await pool.query(
    'SELECT id FROM register_applicant WHERE application_id = ?',
    [applicationId]
  );

  if (!existing.length) {
    return {
      success: false,
      error: 'Registration record not found for this application',
      application_id: applicationId
    };
  }

  await pool.query(
    'UPDATE register_applicant SET commission_doc_url = ?, updated_at = CURRENT_TIMESTAMP WHERE application_id = ?',
    [commissionDocUrl, applicationId]
  );

  return {
    success: true,
    message: 'Commission document uploaded successfully',
    id: existing[0].id,
    application_id: applicationId,
    commission_doc_url: commissionDocUrl
  };
}

// Get register applicant documents by application_id
async function getRegisterApplicantDocs(applicationId) {
  const [rows] = await pool.query(
    'SELECT * FROM register_applicant WHERE application_id = ? LIMIT 1',
    [applicationId]
  );

  return rows[0] || null;
}

module.exports = {
  saveRegisterApplicantDocs,
  updateIntentDocumentUrl,
  updateCommissionDocUrl,
  getRegisterApplicantDocs
};
