const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createEmployee, validateCredentials, findByEmail, getEmployeesByRole } = require('./services/employees');
const { createApplication, getApplications, getApplicationById, updateApplication } = require('./services/applications');
const { getTasksByEmployee, updateTaskStatus, getTaskById } = require('./services/tasks');
const { saveRegisterApplicantDocs, updateIntentDocumentUrl, getRegisterApplicantDocs, updateCommissionDocUrl } = require('./services/registerApplicant');
const { saveInstallationDetails, getInstallationDetails } = require('./services/installationDetails');
const { getInstallationTechnicians, saveTechnicianImages, getTechnicianImages, getTechnicianImagesByTask, getTechnicianImagesByTechnician } = require('./services/technicianImages');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer storage (grouped by applicant + timestamp)
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const applicant = slugify(req.body.applicant_name || 'unknown');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(__dirname, 'uploads', 'applications', applicant, ts);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = slugify(file.fieldname || 'file');
    cb(null, `${base}${ext || '.jpg'}`);
  },
});

const upload = multer({ storage });

// Database is handled via services using a shared pool (see db/pool.js)

const allowedRoles = [
  'Sales Executive',
  'System Admin',
  'Utility Officer',
  'Finance Officer',
  'Operations Engineer',
  'Installation Technician',
  'Super Admin',
];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email_id, phone_number, employee_role, password } = req.body || {};

    if (!name || !email_id || !phone_number || !employee_role || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (!allowedRoles.includes(employee_role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    try {
      const created = await createEmployee({ name, email_id, phone_number, employee_role, password });
      return res.status(201).json(created);
    } catch (err) {
      if (err.code === 'DUP_EMAIL') {
        return res.status(409).json({ error: 'Email already in use.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email_id, password } = req.body || {};
    if (!email_id || !password) {
      return res.status(400).json({ error: 'Missing email or password.' });
    }

    const user = await validateCredentials(email_id, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    return res.json(user);
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Applications endpoints
const fileFields = upload.fields([
  { name: 'aadhaar_front', maxCount: 1 },
  { name: 'aadhaar_back', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
  { name: 'electric_bill', maxCount: 1 },
  { name: 'smart_meter_doc', maxCount: 1 },
  { name: 'cancel_cheque', maxCount: 1 },
  { name: 'bank_details_doc', maxCount: 1 },
  // COT Documents
  { name: 'cot_death_certificate', maxCount: 1 },
  { name: 'cot_house_papers', maxCount: 1 },
  { name: 'cot_passport_photo', maxCount: 1 },
  { name: 'cot_family_registration', maxCount: 1 },
  { name: 'cot_aadhaar_photos', maxCount: 6 },
  { name: 'cot_live_to_live_aadhaar_1', maxCount: 1 },
  { name: 'cot_live_to_live_aadhaar_2', maxCount: 1 },
]);

app.post('/api/applications', fileFields, async (req, res) => {
  try {
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
    } = req.body || {};

    if (!sales_executive_id || !applicant_name || !mobile_number || !plant_size_kw || !plant_price) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    function urlFor(file) {
      return file
        ? path
            .join(
              '/uploads',
              path.relative(path.join(__dirname, 'uploads'), file.destination),
              file.filename
            )
            .replace(/\\/g, '/')
        : null;
    }

    const files = req.files || {};

    // Handle multiple aadhaar photos
    const cotAadhaarPhotosUrls = files.cot_aadhaar_photos 
      ? files.cot_aadhaar_photos.map(file => urlFor(file))
      : [];

    const application = await createApplication({
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
      application_status: application_status || 'DRAFT',
      aadhaar_front_url: urlFor(files.aadhaar_front?.[0]),
      aadhaar_back_url: urlFor(files.aadhaar_back?.[0]),
      pan_card_url: urlFor(files.pan_card?.[0]),
      electric_bill_url: urlFor(files.electric_bill?.[0]),
      smart_meter_doc_url: urlFor(files.smart_meter_doc?.[0]),
      cancel_cheque_url: urlFor(files.cancel_cheque?.[0]),
      bank_details_doc_url: urlFor(files.bank_details_doc?.[0]),
      cot_death_certificate_url: urlFor(files.cot_death_certificate?.[0]),
      cot_house_papers_url: urlFor(files.cot_house_papers?.[0]),
      cot_passport_photo_url: urlFor(files.cot_passport_photo?.[0]),
      cot_family_registration_url: urlFor(files.cot_family_registration?.[0]),
      cot_aadhaar_photos_urls: cotAadhaarPhotosUrls.length > 0 ? JSON.stringify(cotAadhaarPhotosUrls) : null,
      cot_live_to_live_aadhaar_1_url: urlFor(files.cot_live_to_live_aadhaar_1?.[0]),
      cot_live_to_live_aadhaar_2_url: urlFor(files.cot_live_to_live_aadhaar_2?.[0]),
    });
    return res.status(201).json(application);
  } catch (err) {
    console.error('Create application error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update application (used by Sales Executive to complete draft)
app.put('/api/applications/:id', fileFields, async (req, res) => {
  try {
    const applicationId = req.params.id;

    const allowedStatuses = ['DRAFT', 'COMPLETED'];
    if (req.body.application_status && !allowedStatuses.includes(req.body.application_status)) {
      return res.status(400).json({ error: 'Invalid application_status. Use DRAFT or COMPLETED.' });
    }

    function urlFor(file) {
      return file
        ? path
            .join(
              '/uploads',
              path.relative(path.join(__dirname, 'uploads'), file.destination),
              file.filename
            )
            .replace(/\\/g, '/')
        : null;
    }

    const files = req.files || {};

    const cotAadhaarPhotosUrls = files.cot_aadhaar_photos 
      ? files.cot_aadhaar_photos.map(file => urlFor(file))
      : [];

    const payload = {
      ...req.body,
      aadhaar_front_url: urlFor(files.aadhaar_front?.[0]),
      aadhaar_back_url: urlFor(files.aadhaar_back?.[0]),
      pan_card_url: urlFor(files.pan_card?.[0]),
      electric_bill_url: urlFor(files.electric_bill?.[0]),
      smart_meter_doc_url: urlFor(files.smart_meter_doc?.[0]),
      cancel_cheque_url: urlFor(files.cancel_cheque?.[0]),
      bank_details_doc_url: urlFor(files.bank_details_doc?.[0]),
      cot_death_certificate_url: urlFor(files.cot_death_certificate?.[0]),
      cot_house_papers_url: urlFor(files.cot_house_papers?.[0]),
      cot_passport_photo_url: urlFor(files.cot_passport_photo?.[0]),
      cot_family_registration_url: urlFor(files.cot_family_registration?.[0]),
      cot_aadhaar_photos_urls: cotAadhaarPhotosUrls.length > 0 ? JSON.stringify(cotAadhaarPhotosUrls) : undefined,
      cot_live_to_live_aadhaar_1_url: urlFor(files.cot_live_to_live_aadhaar_1?.[0]),
      cot_live_to_live_aadhaar_2_url: urlFor(files.cot_live_to_live_aadhaar_2?.[0]),
    };

    const result = await updateApplication(applicationId, payload);

    return res.json(result);
  } catch (err) {
    console.error('Update application error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/applications', async (req, res) => {
  try {
    const { sales_executive_id } = req.query;
    const filters = {};
    if (sales_executive_id) {
      filters.sales_executive_id = sales_executive_id;
    }
    const applications = await getApplications(filters);
    return res.json(applications);
  } catch (err) {
    console.error('Get applications error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/applications/:id', async (req, res) => {
  try {
    const application = await getApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    return res.json(application);
  } catch (err) {
    console.error('Get application error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Tasks endpoints
app.get('/api/tasks', async (req, res) => {
  try {
    const { employee_id } = req.query;
    
    if (!employee_id) {
      return res.status(400).json({ error: 'employee_id is required.' });
    }
    
    const tasks = await getTasksByEmployee(employee_id);
    return res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.patch('/api/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.id;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }
    
    const result = await updateTaskStatus(taskId, status);
    return res.json(result);
  } catch (err) {
    console.error('Update task status error:', err);
    
    if (err.message === 'Invalid status value') {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === 'Task not found') {
      return res.status(404).json({ error: err.message });
    }
    
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    
    return res.json(task);
  } catch (err) {
    console.error('Get task error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Register Applicant endpoints
const registerApplicantFields = upload.fields([
  { name: 'application_form', maxCount: 1 },
  { name: 'feasibility_form', maxCount: 1 },
  { name: 'subsidy_form', maxCount: 1 },
  { name: 'plan_commissioning_form', maxCount: 1 },
  { name: 'intent_document', maxCount: 1 },
  { name: 'commission_document', maxCount: 1 },
]);

app.post('/api/register-applicant', registerApplicantFields, async (req, res) => {
  try {
    const { application_id } = req.body;

    if (!application_id) {
      return res.status(400).json({ error: 'application_id is required.' });
    }

    function urlFor(file) {
      return file
        ? path
            .join(
              '/uploads',
              path.relative(path.join(__dirname, 'uploads'), file.destination),
              file.filename
            )
            .replace(/\\/g, '/')
        : null;
    }

    const files = req.files || {};

    // Fetch application data for task creation
    const applicationData = await getApplicationById(application_id);

    const result = await saveRegisterApplicantDocs({
      application_id,
      application_form_url: urlFor(files.application_form?.[0]),
      feasibility_form_url: urlFor(files.feasibility_form?.[0]),
      subsidy_form_url: urlFor(files.subsidy_form?.[0]),
      plan_commissioning_form_url: urlFor(files.plan_commissioning_form?.[0]),
    }, applicationData);

    return res.status(200).json(result);
  } catch (err) {
    console.error('Save register applicant docs error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update intent document URL
app.patch('/api/register-applicant/:application_id/intent', registerApplicantFields, async (req, res) => {
  try {
    const { application_id } = req.params;

    if (!application_id) {
      return res.status(400).json({ error: 'application_id is required.' });
    }

    function urlFor(file) {
      return file
        ? path
            .join(
              '/uploads',
              path.relative(path.join(__dirname, 'uploads'), file.destination),
              file.filename
            )
            .replace(/\\/g, '/')
        : null;
    }

    const files = req.files || {};
    const intentDocumentUrl = urlFor(files.intent_document?.[0]);

    if (!intentDocumentUrl) {
      return res.status(400).json({ error: 'Intent document file is required.' });
    }

    const result = await updateIntentDocumentUrl(application_id, intentDocumentUrl);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Update intent document URL error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update commission document URL
app.patch('/api/register-applicant/:application_id/commission', registerApplicantFields, async (req, res) => {
  try {
    const { application_id } = req.params;

    if (!req.files || !req.files.commission_document) {
      return res.status(400).json({ error: 'No commission document uploaded.' });
    }

    function urlFor(file) {
      return file
        ? path
            .join(
              '/uploads',
              path.relative(path.join(__dirname, 'uploads'), file.destination),
              file.filename
            )
            .replace(/\\/g, '/')
        : null;
    }

    const commissionFile = req.files.commission_document[0];
    const commissionDocumentUrl = urlFor(commissionFile);

    if (!commissionDocumentUrl) {
      return res.status(400).json({ error: 'Failed to process commission document.' });
    }

    const result = await updateCommissionDocUrl(application_id, commissionDocumentUrl);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Update commission document URL error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/register-applicant/:application_id', async (req, res) => {
  try {
    const docs = await getRegisterApplicantDocs(req.params.application_id);
    
    if (!docs) {
      return res.status(404).json({ error: 'Register applicant documents not found.' });
    }
    
    return res.json(docs);
  } catch (err) {
    console.error('Get register applicant docs error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Installation Details API Endpoints

// Get Installation Technicians
app.get('/api/installation-technicians', async (req, res) => {
  try {
    const technicians = await getInstallationTechnicians();
    return res.json(technicians);
  } catch (err) {
    console.error('Get installation technicians error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get employees by role (generic endpoint)
app.get('/api/employees/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    const allowedRoles = [
      'Sales Executive',
      'System Admin',
      'Utility Officer',
      'Finance Officer',
      'Operations Engineer',
      'Installation Technician',
      'Super Admin',
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const employees = await getEmployeesByRole(role);
    return res.json(employees);
  } catch (err) {
    console.error('Get employees by role error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Save or update installation details
app.post('/api/installation-details', async (req, res) => {
  try {
    const { 
      application_id, 
      store_location, 
      plant_installation_date, 
      technician_details, // Array of {type: 'internal'|'external', id, name, phone}
      image_uploader_technician_id, // ID of internal technician who will upload images
      task_id
    } = req.body || {};

    if (!application_id) {
      return res.status(400).json({ error: 'Missing application_id.' });
    }

    if (!store_location) {
      return res.status(400).json({ error: 'Store location is required.' });
    }

    if (!plant_installation_date) {
      return res.status(400).json({ error: 'Plant installation date is required.' });
    }

    // Validate technician_details structure
    if (technician_details && technician_details.length > 0) {
      const hasInvalidTechnician = technician_details.some(tech => {
        if (tech.type === 'internal') {
          return !tech.id || !tech.name;
        } else if (tech.type === 'external') {
          return !tech.name || !tech.phone;
        }
        return true; // Invalid type
      });

      if (hasInvalidTechnician) {
        return res.status(400).json({ 
          error: 'Invalid technician details. Internal technicians need id and name, external need name and phone.' 
        });
      }

      // Validate that image uploader is one of the internal technicians
      if (image_uploader_technician_id) {
        const internalTechnicians = technician_details.filter(t => t.type === 'internal');
        const isUploaderInList = internalTechnicians.some(t => t.id === image_uploader_technician_id);
        
        if (!isUploaderInList) {
          return res.status(400).json({ 
            error: 'Image uploader must be one of the assigned internal technicians.' 
          });
        }
      }
    }

    // Fetch application data for task creation
    const applicantData = await getApplicationById(application_id);
    if (!applicantData) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Save installation details
    const result = await saveInstallationDetails({
      applicationId: application_id,
      storeLocation: store_location,
      plantInstallationDate: plant_installation_date,
      technicianDetails: technician_details || [],
      imageUploaderTechnicianId: image_uploader_technician_id,
      applicantData
    });

    // Update task status to in_progress if task_id provided
    if (task_id) {
      try {
        await updateTaskStatus(task_id, 'in_progress');
      } catch (err) {
        console.error('Error updating task status:', err);
        // Continue anyway - details were saved
      }
    }

    return res.json(result);
  } catch (err) {
    console.error('Save installation details error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get installation details
app.get('/api/installation-details/:application_id', async (req, res) => {
  try {
    const details = await getInstallationDetails(req.params.application_id);

    if (!details) {
      return res.status(404).json({ error: 'Installation details not found.' });
    }

    return res.json(details);
  } catch (err) {
    console.error('Get installation details error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Technician Images API Endpoints

// Multer storage for technician images
const techImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const appId = req.body.application_id || 'unknown';
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(__dirname, 'uploads', 'technician-images', String(appId), ts);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = slugify(file.fieldname || 'image');
    cb(null, `${base}${ext || '.jpg'}`);
  },
});

const techImageUpload = multer({ storage: techImageStorage });

const techImageFields = techImageUpload.fields([
  { name: 'solar_panel_image', maxCount: 1 },
  { name: 'inverter_image', maxCount: 1 },
  { name: 'logger_image', maxCount: 1 },
]);

// Upload technician images
app.post('/api/technician-images', techImageFields, async (req, res) => {
  try {
    const { 
      application_id, 
      task_id,
      technician_id,
      external_technician_name,
      external_technician_phone
    } = req.body || {};

    if (!application_id) {
      return res.status(400).json({ error: 'application_id is required.' });
    }

    function urlFor(file) {
      return file
        ? path
            .join(
              '/uploads',
              path.relative(path.join(__dirname, 'uploads'), file.destination),
              file.filename
            )
            .replace(/\\/g, '/')
        : null;
    }

    const files = req.files || {};

    const result = await saveTechnicianImages({
      application_id,
      task_id,
      technician_id: technician_id || null,
      external_technician_name: external_technician_name || null,
      external_technician_phone: external_technician_phone || null,
      solar_panel_image_url: urlFor(files.solar_panel_image?.[0]),
      inverter_image_url: urlFor(files.inverter_image?.[0]),
      logger_image_url: urlFor(files.logger_image?.[0])
    });

    // If all images uploaded and task_id provided, mark task as completed
    if (task_id && result.success) {
      const images = await getTechnicianImages(application_id);
      if (images && images.upload_status === 'completed') {
        try {
          await updateTaskStatus(task_id, 'completed');
        } catch (err) {
          console.error('Error updating task status:', err);
        }
      }
    }

    return res.json(result);
  } catch (err) {
    console.error('Save technician images error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get technician images by application_id
app.get('/api/technician-images/application/:application_id', async (req, res) => {
  try {
    const images = await getTechnicianImages(req.params.application_id);

    if (!images) {
      return res.status(404).json({ error: 'Technician images not found.' });
    }

    return res.json(images);
  } catch (err) {
    console.error('Get technician images error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get technician images by task_id
app.get('/api/technician-images/task/:task_id', async (req, res) => {
  try {
    const images = await getTechnicianImagesByTask(req.params.task_id);

    if (!images) {
      return res.status(404).json({ error: 'Technician images not found.' });
    }

    return res.json(images);
  } catch (err) {
    console.error('Get technician images by task error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get technician images by technician_id (for technicians to see their assignments)
app.get('/api/technician-images/technician/:technician_id', async (req, res) => {
  try {
    const images = await getTechnicianImagesByTechnician(req.params.technician_id);
    return res.json(images);
  } catch (err) {
    console.error('Get technician images by technician error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
