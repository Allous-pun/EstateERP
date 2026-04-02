All code must be inside the `src` folder. Follow this structure:

src/
├── config/ # Database config, migration files
│ ├── database.js
│ ├── migrate.js
│ └── schema.sql
├── models/ # Database models (User.js, Role.js, etc.)
├── controllers/ # Route controllers (userController.js)
├── routes/ # API routes (userRoutes.js)
├── middleware/ # Auth middleware, validation
├── utils/ # Helper functions, JWT, emails
├── app.js # Express app setup
└── server.js # Server entry point


## Naming Conventions:
- Models: PascalCase (User.js, Role.js)
- Controllers: camelCase (userController.js)
- Routes: camelCase (userRoutes.js)
- Middleware: camelCase (authMiddleware.js)
- Config: kebab-case (database.js)

## No files in root except:
- package.json
- package-lock.json
- .env
- .gitignore
- README.md
- PHASE-1-TASKS.md
- PROJECT-STRUCTURE.md

All JavaScript files go in `src/` with proper subfolders.
