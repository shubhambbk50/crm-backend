# Backend Folder Organization

## 📂 Complete Backend Structure

```
backend/
│
├── 📄 server.js                    # Main Express server & API routes
├── 📄 package.json                 # Dependencies & scripts
├── 📄 .env                         # Environment variables (not in git)
├── 📄 .env.example                # Environment template
├── 📄 README.md                   # Backend documentation
│
├── 📁 db/                         # Database layer
│   ├── pool.js                    # MySQL connection pool
│   └── schema/                    # SQL table schemas
│       ├── applications.sql       # Applications table
│       ├── employees.sql          # Employees/auth table
│       ├── tasks.sql              # Tasks table
│       └── register_applicant.sql # Register applicant documents
│
├── 📁 services/                   # Business logic layer
│   ├── applications.js            # Application CRUD operations
│   ├── employees.js               # Employee/auth operations
│   ├── tasks.js                   # Task operations
│   └── registerApplicant.js       # Register applicant operations
│
├── 📁 scripts/                    # Utility & maintenance scripts
│   ├── README.md                  # Scripts documentation
│   │
│   ├── migrations/                # Database migrations
│   │   ├── migrate.js             # Main migration runner
│   │   ├── createRegisterApplicantTable.js
│   │   ├── addDistrictColumn.js
│   │   ├── addDistrictToApplications.js
│   │   ├── add_district.sql
│   │   ├── dropFinanceRequired.js
│   │   └── updateApplicationsSchema.js
│   │
│   ├── seeds/                     # Database seeding
│   │   └── seedEmployees.js       # Seed employee data
│   │
│   └── utils/                     # Helper utilities
│       ├── test-connection.js     # Test DB connection
│       └── checkMismatch.js       # Data validation
│
└── 📁 uploads/                    # File storage
    └── applications/              # Application documents
        └── [applicant]/[timestamp]/  # Organized by applicant
```

## 🎯 Benefits of This Organization

### ✅ **Clear Separation of Concerns**
- **db/** - All database-related code
- **services/** - Business logic separated from routes
- **scripts/** - Development & maintenance tools organized by purpose

### ✅ **Easy to Navigate**
- New developers can quickly understand the structure
- Files are grouped by their function
- Related files are together

### ✅ **Scalable**
- Easy to add new migrations in `scripts/migrations/`
- Simple to add new services in `services/`
- Clear place for new utility scripts

### ✅ **Maintainable**
- Scripts are organized by type (migrations, seeds, utils)
- Each folder has a specific purpose
- Documentation in relevant locations

## 🚀 Common Tasks

### Running Scripts

**Test database connection:**
```bash
node scripts/utils/test-connection.js
```

**Run migrations:**
```bash
node scripts/migrations/migrate.js
```

**Create a new table:**
```bash
node scripts/migrations/createRegisterApplicantTable.js
```

**Seed database:**
```bash
node scripts/seeds/seedEmployees.js
```

**Check data consistency:**
```bash
node scripts/utils/checkMismatch.js
```

### Adding New Components

**New database table:**
1. Create schema in `db/schema/[table-name].sql`
2. Create migration in `scripts/migrations/create[TableName].js`
3. Create service in `services/[tableName].js`
4. Add routes in `server.js`

**New migration:**
1. Create file in `scripts/migrations/[migration-name].js`
2. Use existing migrations as template
3. Test thoroughly before running on production

**New utility:**
1. Create file in `scripts/utils/[utility-name].js`
2. Document usage in `scripts/README.md`

## 📝 File Naming Conventions

### Migrations
- Use camelCase: `createTableName.js`, `addColumnName.js`
- Be descriptive: `updateApplicationsSchema.js`
- SQL files: snake_case: `add_district.sql`

### Services
- Use camelCase: `registerApplicant.js`
- Match table name when possible: `tasks.js`, `employees.js`

### Schemas
- Use snake_case: `register_applicant.sql`
- Match table name: `applications.sql`

### Utilities
- Use kebab-case: `test-connection.js`
- Be descriptive: `checkMismatch.js`

## 🔒 Best Practices

1. **Never commit `.env` file** - Use `.env.example` as template
2. **Test migrations locally first** - Always backup before production
3. **Keep migrations idempotent** - Use `IF NOT EXISTS`, `IF EXISTS`
4. **Document complex scripts** - Add comments and README entries
5. **Use descriptive names** - Files should explain their purpose
6. **One responsibility per script** - Don't mix concerns
7. **Handle errors gracefully** - Always include try-catch blocks
8. **Log operations clearly** - Use console.log for important steps

---

**Last Updated:** January 12, 2026
