# CRM Backend Setup

This backend includes SQL schemas for applications, tasks, employees, and register_applicant tables with a complete API for managing the CRM system.

## Prerequisites
- Node.js 18+
- A MySQL database (Hostinger or compatible)
- MySQL user with privileges to create tables

## 📁 Project Structure

```
backend/
├── db/
│   ├── pool.js                 # Database connection pool
│   └── schema/                 # SQL schema files
│       ├── applications.sql    # Applications table schema
│       ├── employees.sql       # Employees table schema
│       ├── tasks.sql          # Tasks table schema
│       └── register_applicant.sql # Register applicant documents table
├── services/
│   ├── applications.js        # Application business logic
│   ├── employees.js           # Employee/auth business logic
│   ├── tasks.js               # Tasks business logic
│   └── registerApplicant.js   # Register applicant business logic
├── scripts/
│   ├── migrations/            # Database migrations
│   │   ├── migrate.js         # Main migration runner
│   │   ├── createRegisterApplicantTable.js
│   │   └── ... other migrations
│   ├── seeds/                 # Seed data scripts
│   │   └── seedEmployees.js
│   └── utils/                 # Utility scripts
│       ├── test-connection.js
│       └── checkMismatch.js
├── uploads/                   # Uploaded files storage
├── server.js                  # Express server & API routes
├── package.json
└── .env.example              # Environment variables template
```

## Configure environment
Copy `.env.example` to `.env` and fill in your DB connection details:

```env
DB_HOST=your-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database
PORT=4000
```

## Install and run migration
```bash
cd backend
npm install
node scripts/migrations/migrate.js
```

## Notes
- Schemas use `InnoDB` and `utf8mb4`.
- Requires MySQL 5.7+ for `JSON` type used in `applications`.

## Run the server
```bash
cd backend
npm start
```
Server listens on `http://localhost:4000`.

## API Endpoints

### Auth endpoints
- `POST /api/auth/signup` - Create new employee account
- `POST /api/auth/login` - Login with email and password

### Application endpoints
- `POST /api/applications` - Create new application with file uploads
- `GET /api/applications` - Get all applications (filter by sales_executive_id)
- `GET /api/applications/:id` - Get single application

### Task endpoints
- `GET /api/tasks?employee_id=X` - Get tasks for an employee
- `GET /api/tasks/:id` - Get single task
- `PATCH /api/tasks/:id/status` - Update task status

### Register Applicant endpoints
- `POST /api/register-applicant` - Upload registration documents
- `GET /api/register-applicant/:application_id` - Get registration documents

For detailed API documentation, see the main project README.
