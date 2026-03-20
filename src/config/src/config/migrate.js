require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log("✅ Connected to database");

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role ENUM('ADMIN','TENANT','GUARD'),

        house_number VARCHAR(20),
        lease_start DATE,
        lease_end DATE,

        shift VARCHAR(50),
        assigned_gate VARCHAR(50),

        admin_level INT DEFAULT 1,

        reset_token VARCHAR(255),
        reset_token_expiry DATETIME,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Users table created/verified");

    await connection.end();
    console.log("🎉 Migration completed");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

runMigration();