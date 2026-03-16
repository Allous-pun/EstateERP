// src/config/migrate.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables from .env file
dotenv.config();

console.log('🔧 Using database credentials:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   User: ${process.env.DB_USER}`); 
console.log(`   Database: ${process.env.DB_NAME}`);

async function runMigration() {
    let connection;
    
    try {
        // First connect without database to create it if needed
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL');

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'EstateERP'}`);
        console.log(`✅ Database ${process.env.DB_NAME || 'EstateERP'} ready`);

        // Close connection
        await connection.end();

        // Reconnect with database selected
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'EstateERP',
            multipleStatements: true
        });

        // Read and execute schema.sql
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        // Execute the entire schema
        await connection.query(schemaSQL);
        console.log('✅ Database schema created successfully');

        // Update admin password with actual hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);
        
        await connection.query(
            `UPDATE users SET password_hash = ? WHERE email = 'admin@omniestate.com'`,
            [hashedPassword]
        );

        console.log('✅ Admin user created with password: Admin@123');
        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
        process.exit(0);
    }
}

runMigration();
