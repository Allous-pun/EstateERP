-- ============================================
-- Omni-Estate ERP - Database Schema
-- Phase 1: Authentication & User Management
-- ============================================

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- 1. ROLES TABLE
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. USERS TABLE (with role-based fields and password reset)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    -- Core fields
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Personal info
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    id_number VARCHAR(20) UNIQUE,
    
    -- Role & Status
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Role-specific fields (nullable based on role)
    -- For Tenants
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    occupation VARCHAR(100),
    
    -- For Staff
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(50),
    hire_date DATE,
    
    -- Timestamps
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 🔐 PASSWORD RESET FIELDS (ADDED)
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL,
    
    -- Foreign key
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_role (role_id),
    INDEX idx_is_active (is_active),
    INDEX idx_reset_token (reset_token)  -- Index for password reset lookups
);

-- 3. SESSIONS TABLE (for refresh tokens)
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    refresh_token VARCHAR(512) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);

-- ============================================
-- Insert default roles
-- ============================================
INSERT INTO roles (name, description) VALUES
('super_admin', 'Full system access - can manage all aspects'),
('admin', 'Estate administrator - manages properties and staff'),
('finance_officer', 'Manages invoices, payments, and financial reports'),
('facility_manager', 'Oversees maintenance operations and inventory'),
('technician', 'Performs maintenance tasks and requests materials'),
('security_guard', 'Manages visitor entries and exits'),
('tenant', 'Regular tenant - pays rent and requests maintenance');

-- ============================================
-- Create a test admin user (password: Admin@123)
-- ============================================
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role_id,
    email_verified,
    employee_id
) VALUES (
    'admin@omniestate.com',
    '$2a$10$YourHashedPasswordHere', -- You'll update this with actual hash
    'System',
    'Admin',
    (SELECT id FROM roles WHERE name = 'super_admin'),
    TRUE,
    'EMP001'
);

-- properties table
CREATE TABLE IF NOT EXISTS properties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    total_units INT DEFAULT 0,
    building_type ENUM('apartment', 'commercial', 'residential', 'mixed') DEFAULT 'apartment',
    amenities JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_location (location)
);

-- Units table
CREATE TABLE IF NOT EXISTS units (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unit_number VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INT,
    bedroom_count INT DEFAULT 1,
    bathroom_count INT DEFAULT 1,
    size_sqm DECIMAL(10, 2),
    rent_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status ENUM('vacant', 'occupied', 'maintenance', 'reserved') DEFAULT 'vacant',
    property_id INT NOT NULL,
    current_tenant_id INT,
    description TEXT,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (current_tenant_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_property_id (property_id),
    INDEX idx_unit_number (unit_number),
    INDEX idx_status (status)
);