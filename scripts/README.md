# Backend Scripts Directory

This directory contains organized scripts for database management, migrations, seeds, and utilities.

## 📁 Folder Structure

### `/migrations/`
Database migration and schema management scripts:
- `migrate.js` - Main migration runner
- `createRegisterApplicantTable.js` - Creates register_applicant table
- `addDistrictColumn.js` - Adds district column to tables
- `addDistrictToApplications.js` - Migration for district field in applications
- `add_district.sql` - SQL for adding district column
- `dropFinanceRequired.js` - Drops finance_required column
- `updateApplicationsSchema.js` - Updates applications table schema

**Usage:**
```bash
node scripts/migrations/[migration-file].js
```

### `/seeds/`
Database seeding scripts for initial/test data:
- `seedEmployees.js` - Seeds employee test data

**Usage:**
```bash
node scripts/seeds/seedEmployees.js
```

### `/utils/`
Utility and helper scripts:
- `test-connection.js` - Tests database connection
- `checkMismatch.js` - Checks data mismatches/inconsistencies

**Usage:**
```bash
node scripts/utils/test-connection.js
node scripts/utils/checkMismatch.js
```

## 🚀 Quick Commands

Test database connection:
```bash
npm run test-db
# or
node scripts/utils/test-connection.js
```

Run migrations:
```bash
node scripts/migrations/migrate.js
```

Seed database:
```bash
node scripts/seeds/seedEmployees.js
```

## 📝 Notes

- All scripts should be run from the backend root directory
- Ensure `.env` file is properly configured before running scripts
- Migration scripts should be idempotent when possible
- Always backup database before running migrations in production
