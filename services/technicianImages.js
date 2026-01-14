const { pool } = require('../db/pool');

// Get all Installation Technicians
async function getInstallationTechnicians() {
  const [rows] = await pool.query(
    `SELECT id, name, email_id, phone_number, district 
     FROM employees 
     WHERE employee_role = 'Installation Technician' 
     ORDER BY name ASC`
  );
  return rows;
}

// Save technician images
async function saveTechnicianImages(data) {
  const {
    application_id,
    task_id,
    technician_id,
    external_technician_name,
    external_technician_phone,
    solar_panel_image_url,
    inverter_image_url,
    logger_image_url
  } = data;

  // Check if record exists
  const [existing] = await pool.query(
    'SELECT id FROM technician_images WHERE application_id = ? LIMIT 1',
    [application_id]
  );

  // Determine upload status
  let upload_status = 'pending';
  const uploadedCount = [solar_panel_image_url, inverter_image_url, logger_image_url].filter(Boolean).length;
  if (uploadedCount === 3) {
    upload_status = 'completed';
  } else if (uploadedCount > 0) {
    upload_status = 'partial';
  }

  if (existing.length > 0) {
    // Update existing record
    await pool.query(
      `UPDATE technician_images SET 
        task_id = ?,
        technician_id = ?,
        external_technician_name = ?,
        external_technician_phone = ?,
        solar_panel_image_url = COALESCE(?, solar_panel_image_url),
        inverter_image_url = COALESCE(?, inverter_image_url),
        logger_image_url = COALESCE(?, logger_image_url),
        upload_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE application_id = ?`,
      [
        task_id,
        technician_id,
        external_technician_name,
        external_technician_phone,
        solar_panel_image_url,
        inverter_image_url,
        logger_image_url,
        upload_status,
        application_id
      ]
    );

    return {
      success: true,
      message: 'Technician images updated successfully',
      id: existing[0].id,
      application_id
    };
  } else {
    // Insert new record
    const [result] = await pool.query(
      `INSERT INTO technician_images 
        (application_id, task_id, technician_id, external_technician_name, external_technician_phone,
         solar_panel_image_url, inverter_image_url, logger_image_url, upload_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        application_id,
        task_id,
        technician_id,
        external_technician_name,
        external_technician_phone,
        solar_panel_image_url,
        inverter_image_url,
        logger_image_url,
        upload_status
      ]
    );

    return {
      success: true,
      message: 'Technician images saved successfully',
      id: result.insertId,
      application_id
    };
  }
}

// Get technician images by application_id
async function getTechnicianImages(applicationId) {
  const [rows] = await pool.query(
    'SELECT * FROM technician_images WHERE application_id = ? LIMIT 1',
    [applicationId]
  );
  return rows[0] || null;
}

// Get technician images by task_id
async function getTechnicianImagesByTask(taskId) {
  const [rows] = await pool.query(
    'SELECT * FROM technician_images WHERE task_id = ? LIMIT 1',
    [taskId]
  );
  return rows[0] || null;
}

// Get technician images by technician_id (for internal technicians)
async function getTechnicianImagesByTechnician(technicianId) {
  const [rows] = await pool.query(
    `SELECT ti.*, a.applicant_name, a.mobile_number, a.site_address 
     FROM technician_images ti
     INNER JOIN applications a ON ti.application_id = a.application_id
     WHERE ti.technician_id = ?
     ORDER BY ti.created_at DESC`,
    [technicianId]
  );
  return rows;
}

module.exports = {
  getInstallationTechnicians,
  saveTechnicianImages,
  getTechnicianImages,
  getTechnicianImagesByTask,
  getTechnicianImagesByTechnician
};
