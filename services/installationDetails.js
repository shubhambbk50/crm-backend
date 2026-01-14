const { pool } = require('../db/pool');

// Helper function to create image upload task for designated technician
async function createImageUploadTask(applicationId, imageUploaderTechnicianId, applicantData) {
  // Only create task if internal technician is designated
  if (!imageUploaderTechnicianId) return null;

  // Get technician name
  const [[technician]] = await pool.query(
    'SELECT name FROM employees WHERE id = ? LIMIT 1',
    [imageUploaderTechnicianId]
  );

  const technicianName = technician ? technician.name : `Technician ID ${imageUploaderTechnicianId}`;

  const workDescription = `Upload installation images (Solar Panel, Inverter, Logger) for ${applicantData.applicant_name} (${applicantData.mobile_number}) - Assigned to ${technicianName}`;

  // Check if task already exists
  const [existing] = await pool.query(
    'SELECT id FROM tasks WHERE application_id = ? AND work LIKE ? LIMIT 1',
    [applicationId, '%Upload installation images%']
  );

  if (existing[0]) return existing[0].id;

  // Create task
  const [result] = await pool.query(
    'INSERT INTO tasks (application_id, work, assigned_to_id, status) VALUES (?, ?, ?, ?)',
    [applicationId, workDescription, imageUploaderTechnicianId, 'pending']
  );
  return result.insertId;
}

// Save or update installation details
async function saveInstallationDetails(data) {
  const {
    applicationId,
    storeLocation,
    plantInstallationDate,
    technicianDetails, // Array of {type: 'internal'|'external', id, name, phone}
    imageUploaderTechnicianId, // ID of internal technician who will upload images
    applicantData
  } = data;

  const [existing] = await pool.query(
    'SELECT id FROM installation_details WHERE application_id = ?',
    [applicationId]
  );

  const technicianJson = JSON.stringify(technicianDetails || []);

  if (existing.length > 0) {
    // Update existing record
    await pool.query(
      `UPDATE installation_details SET 
        store_location = ?,
        plant_installation_date = ?,
        technician_details = ?,
        image_uploader_technician_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE application_id = ?`,
      [
        storeLocation,
        plantInstallationDate,
        technicianJson,
        imageUploaderTechnicianId,
        applicationId
      ]
    );

    // Create image upload task for designated technician
    const taskId = await createImageUploadTask(
      applicationId,
      imageUploaderTechnicianId,
      applicantData
    );

    return {
      success: true,
      message: 'Installation details updated successfully',
      id: existing[0].id,
      application_id: applicationId,
      task_id: taskId
    };
  } else {
    // Insert new record
    const [result] = await pool.query(
      `INSERT INTO installation_details 
        (application_id, store_location, plant_installation_date, technician_details, image_uploader_technician_id) 
      VALUES (?, ?, ?, ?, ?)`,
      [
        applicationId,
        storeLocation,
        plantInstallationDate,
        technicianJson,
        imageUploaderTechnicianId
      ]
    );

    // Create image upload task for designated technician
    const taskId = await createImageUploadTask(
      applicationId,
      imageUploaderTechnicianId,
      applicantData
    );

    return {
      success: true,
      message: 'Installation details saved successfully',
      id: result.insertId,
      application_id: applicationId,
      task_id: taskId
    };
  }
}

// Get installation details by application_id
async function getInstallationDetails(applicationId) {
  const [rows] = await pool.query(
    'SELECT * FROM installation_details WHERE application_id = ? LIMIT 1',
    [applicationId]
  );

  if (rows[0] && rows[0].technician_details) {
    rows[0].technician_details = JSON.parse(rows[0].technician_details);
  }

  return rows[0] || null;
}

module.exports = {
  saveInstallationDetails,
  getInstallationDetails,
};
