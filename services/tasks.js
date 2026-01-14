const { pool } = require('../db/pool');

// Helper: Get employee ID by role and district
async function getEmployeeByRole(role, district = null) {
  let query = 'SELECT id FROM employees WHERE employee_role = ?';
  const params = [role];
  
  if (district) {
    query += ' AND district = ?';
    params.push(district);
  }
  
  query += ' LIMIT 1';
  const [rows] = await pool.query(query, params);
  
  // Fallback to any employee with the role if no district match
  if (!rows[0] && district) {
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

// Get tasks with application details for a specific employee
async function getTasksByEmployee(employeeId) {
  const [rows] = await pool.query(
    `SELECT 
      t.id as task_id,
      t.application_id,
      t.work,
      t.status,
      t.assigned_to_id,
      t.created_at as task_created_at,
      t.updated_at as task_updated_at,
      a.*
    FROM tasks t
    INNER JOIN applications a ON t.application_id = a.application_id
    WHERE t.assigned_to_id = ?
    ORDER BY t.created_at DESC`,
    [employeeId]
  );
  
  // Transform to nest application data
  return rows.map(row => {
    const { task_id, work, status, assigned_to_id, task_created_at, task_updated_at, ...applicationData } = row;
    
    return {
      task_id,
      application_id: row.application_id,
      work,
      status,
      assigned_to_id,
      task_created_at,
      task_updated_at,
      applications: applicationData
    };
  });
}

// Update task status
async function updateTaskStatus(taskId, newStatus) {
  const validStatuses = ['pending', 'in_progress', 'completed'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid status value');
  }

  // Fetch the task with application details to check if it's an admin intent task or operations engineer task
  const [[task]] = await pool.query(
    `SELECT t.id, t.application_id, t.work, t.assigned_to_id, t.status, a.district, a.applicant_name, a.mobile_number
     FROM tasks t
     INNER JOIN applications a ON t.application_id = a.application_id
     WHERE t.id = ?
     LIMIT 1`,
    [taskId]
  );

  if (!task) {
    throw new Error('Task not found');
  }

  // Update the task status
  const [result] = await pool.query(
    'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newStatus, taskId]
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Task not found');
  }

  // Check if this is a completed admin intent task
  const isAdminIntentTask = task.work && task.work.toLowerCase().includes('hard copy indent creation') && newStatus === 'completed';
  
  if (isAdminIntentTask) {
    // Get admin role to verify this task belongs to an admin
    const [[adminCheck]] = await pool.query(
      'SELECT employee_role FROM employees WHERE id = ? LIMIT 1',
      [task.assigned_to_id]
    );

    if (adminCheck && adminCheck.employee_role === 'System Admin') {
      // Create 2 tasks for Utility Officer with matching district
      const utilityOfficerId = await getEmployeeByRole('Utility Officer', task.district);

      if (utilityOfficerId) {
        // Task 1: Submit indent to electric department
        await createTaskIfNotExists(
          task.application_id,
          `Submit indent to electric department for ${task.applicant_name} (${task.mobile_number})`,
          utilityOfficerId
        );

        // Task 2: Meter installation at customer site
        await createTaskIfNotExists(
          task.application_id,
          `Meter installation at customer site for ${task.applicant_name} (${task.mobile_number})`,
          utilityOfficerId
        );
      }
    }
  }

  // Check if this is a completed Operations Engineer "Customer Details to Operation Head" task
  const isOperationsEngineerDetailsTask = task.work && task.work.toLowerCase().includes('customer details to operation head') && newStatus === 'completed';
  
  if (isOperationsEngineerDetailsTask) {
    // Get Operations Engineer role to verify this task belongs to an Operations Engineer
    const [[engCheck]] = await pool.query(
      'SELECT employee_role FROM employees WHERE id = ? LIMIT 1',
      [task.assigned_to_id]
    );

    if (engCheck && engCheck.employee_role === 'Operations Engineer') {
      // Get System Admin ID (there is one system admin in the database)
      const systemAdminId = await getEmployeeByRole('System Admin');
      
      // Get Utility Officer ID with same district
      const utilityOfficerId = await getEmployeeByRole('Utility Officer', task.district);

      // Create 4 tasks when Operations Engineer completes the task
      if (utilityOfficerId) {
        // Task 12: Inspection (Utility Officer - same district)
        await createTaskIfNotExists(
          task.application_id,
          `Inspection for ${task.applicant_name} (${task.mobile_number})`,
          utilityOfficerId
        );
      }

      if (systemAdminId) {
        // Task 13: Admin upload commissioning report
        await createTaskIfNotExists(
          task.application_id,
          `Upload commissioning report for ${task.applicant_name} (${task.mobile_number})`,
          systemAdminId
        );

        // Task 14: Admin apply Subsidy
        await createTaskIfNotExists(
          task.application_id,
          `Apply subsidy for ${task.applicant_name} (${task.mobile_number})`,
          systemAdminId
        );

        // Task 15: Admin Subsidy redemption
        await createTaskIfNotExists(
          task.application_id,
          `Subsidy redemption for ${task.applicant_name} (${task.mobile_number})`,
          systemAdminId
        );
      }
    }
  }

  return { success: true, taskId, newStatus };
}

// Get single task with application details
async function getTaskById(taskId) {
  const [rows] = await pool.query(
    `SELECT 
      t.id as task_id,
      t.application_id,
      t.work,
      t.status,
      t.assigned_to_id,
      t.created_at as task_created_at,
      t.updated_at as task_updated_at,
      a.*
    FROM tasks t
    INNER JOIN applications a ON t.application_id = a.application_id
    WHERE t.id = ?
    LIMIT 1`,
    [taskId]
  );
  
  return rows[0] || null;
}

module.exports = {
  getTasksByEmployee,
  updateTaskStatus,
  getTaskById,
};
