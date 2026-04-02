-- ============================================
-- Omni-Estate ERP - Database Schema
-- Complete Schema with Phase 1-4
-- ============================================

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS invoice_settings;
DROP TABLE IF EXISTS tenancies;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- ============================================
-- Phase 1: Authentication & User Management
-- ============================================

-- 1. ROLES TABLE
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    id_number VARCHAR(20) UNIQUE,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    occupation VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(50),
    hire_date DATE,
    last_login TIMESTAMP NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_role (role_id),
    INDEX idx_is_active (is_active),
    INDEX idx_reset_token (reset_token)
);

-- 3. SESSIONS TABLE
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
-- Phase 2: Properties & Units
-- ============================================

-- Properties table
CREATE TABLE properties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    total_units INT DEFAULT 0,
    building_type ENUM('apartment', 'commercial', 'residential', 'mixed') DEFAULT 'apartment',
    amenities JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_location (location),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Units table
CREATE TABLE units (
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

-- ============================================
-- Phase 3: Tenancy Management
-- ============================================

-- Tenancies table
CREATE TABLE tenancies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    unit_id INT NOT NULL,
    property_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    actual_move_out_date DATE NULL,
    rent_amount DECIMAL(12, 2) NOT NULL,
    deposit_amount DECIMAL(12, 2) DEFAULT 0,
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_refunded BOOLEAN DEFAULT FALSE,
    payment_cycle ENUM('monthly', 'quarterly', 'semi_annual', 'annual') DEFAULT 'monthly',
    payment_due_day INT DEFAULT 1,
    status ENUM('active', 'terminated', 'expired', 'pending') DEFAULT 'pending',
    lease_agreement_url VARCHAR(255) NULL,
    lease_agreement_filename VARCHAR(255) NULL,
    lease_agreement_uploaded_at DATETIME NULL,
    lease_terms TEXT NULL,
    move_in_notes TEXT NULL,
    move_out_notes TEXT NULL,
    move_inspection_report_url VARCHAR(255) NULL,
    move_out_inspection_report_url VARCHAR(255) NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    terminated_by VARCHAR(50) NULL,
    termination_reason TEXT NULL,
    terminated_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_unit_id (unit_id),
    INDEX idx_property_id (property_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
);

-- ============================================
-- Phase 4: Finance & Invoicing Tables
-- ============================================

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    tenancy_id INT NOT NULL,
    unit_id INT NOT NULL,
    tenant_id INT NOT NULL,
    property_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    rent_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    additional_charges DECIMAL(12, 2) DEFAULT 0,
    penalty_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    balance_due DECIMAL(12, 2) NOT NULL,
    payment_status ENUM('pending', 'partially_paid', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    last_payment_date DATE,
    last_payment_amount DECIMAL(12, 2),
    penalty_applied BOOLEAN DEFAULT FALSE,
    penalty_applied_date DATE,
    penalty_days_late INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenancy_id) REFERENCES tenancies(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_tenancy_id (tenancy_id),
    INDEX idx_unit_id (unit_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_property_id (property_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_due_date (due_date),
    INDEX idx_invoice_date (invoice_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'mpesa', 'cheque', 'card') NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    recorded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_recorded_by (recorded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice settings table (configurable per property/tenant)
CREATE TABLE IF NOT EXISTS invoice_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT,
    tenant_id INT,
    billing_day INT DEFAULT 1,
    due_day INT DEFAULT 5,
    penalty_rate DECIMAL(5, 2) DEFAULT 5.00,
    penalty_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    grace_period_days INT DEFAULT 3,
    setting_type ENUM('property', 'tenant') DEFAULT 'property',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_property_setting (property_id, setting_type),
    INDEX idx_property_id (property_id),
    INDEX idx_tenant_id (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- Phase 6: Visitor Management (Visitor Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS visitors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    id_number VARCHAR(50),
    purpose TEXT,
    property_id INT,
    unit_id INT,
    
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    qr_expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    
    check_in_time DATETIME,
    check_out_time DATETIME,
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_qr_token (qr_token),
    INDEX idx_property (property_id),
    INDEX idx_unit (unit_id),
    INDEX idx_phone (phone),
    INDEX idx_id_number (id_number),
    INDEX idx_is_blacklisted (is_blacklisted)
);

CREATE TABLE IF NOT EXISTS blacklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id INT NULL,
    phone VARCHAR(20),
    id_number VARCHAR(50),
    reason TEXT NOT NULL,
    added_by INT NOT NULL,
    expires_at DATETIME NULL,
    is_permanent BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    removed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_phone (phone),
    INDEX idx_id_number (id_number),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at),
    INDEX idx_visitor_id (visitor_id)
);

-- Visitor Logs table

CREATE TABLE IF NOT EXISTS visitor_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_id_number VARCHAR(50),
    purpose ENUM('delivery', 'meeting', 'inspection', 'maintenance', 'rental_viewing', 'guest', 'other') NOT NULL,
    purpose_description TEXT,
    visited_tenant_name VARCHAR(100),
    visited_unit_number VARCHAR(50),
    visited_property_id INT,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME,
    vehicle_plate VARCHAR(20),
    vehicle_make VARCHAR(50),
    logged_by INT NOT NULL,
    notes TEXT,
    status ENUM('active', 'exited') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (visited_property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_entry_time (entry_time),
    INDEX idx_exit_time (exit_time),
    INDEX idx_status (status),
    INDEX idx_visited_property_id (visited_property_id),
    INDEX idx_logged_by (logged_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance Tickets Table
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    category ENUM('plumbing', 'electrical', 'hvac', 'structural', 'appliance', 'furniture', 'cleaning', 'other') DEFAULT 'other',
    reported_by INT NOT NULL,
    unit_id INT NOT NULL,
    property_id INT NOT NULL,
    assigned_to INT,
    scheduled_date DATETIME,
    completed_date DATETIME,
    estimated_cost DECIMAL(12, 2) DEFAULT 0,
    actual_cost DECIMAL(12, 2) DEFAULT 0,
    materials_used JSON,
    notes TEXT,
    resolution_notes TEXT,
    before_photos JSON,
    after_photos JSON,
    is_billed BOOLEAN DEFAULT FALSE,
    invoice_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_reported_by (reported_by),
    INDEX idx_unit_id (unit_id),
    INDEX idx_assigned_to (assigned_to)
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category ENUM('tools', 'materials', 'equipment', 'spare_parts', 'consumables', 'cleaning', 'safety') NOT NULL,
    description TEXT,
    unit ENUM('piece', 'meter', 'kilogram', 'liter', 'box', 'set', 'roll', 'pack') DEFAULT 'piece',
    current_stock DECIMAL(12, 2) DEFAULT 0,
    minimum_stock DECIMAL(12, 2) DEFAULT 0,
    reorder_level DECIMAL(12, 2) DEFAULT 0,
    unit_cost DECIMAL(12, 2) DEFAULT 0,
    selling_price DECIMAL(12, 2) DEFAULT 0,
    supplier VARCHAR(200),
    supplier_contact VARCHAR(50),
    location VARCHAR(100),
    expiry_date DATE,
    last_restocked DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_item_code (item_code),
    INDEX idx_name (name),
    INDEX idx_category (category)
);

-- Stock Logs Table
CREATE TABLE IF NOT EXISTS stock_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventory_id INT NOT NULL,
    ticket_id INT,
    transaction_type ENUM('restock', 'usage', 'adjustment', 'return', 'damaged') NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    quantity_before DECIMAL(12, 2) NOT NULL,
    quantity_after DECIMAL(12, 2) NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL,
    reference_number VARCHAR(100),
    reason TEXT,
    performed_by INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (ticket_id) REFERENCES maintenance_tickets(id),
    FOREIGN KEY (performed_by) REFERENCES users(id),
    
    INDEX idx_inventory_id (inventory_id),
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at)
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
    '$2a$10$YourHashedPasswordHere',
    'System',
    'Admin',
    (SELECT id FROM roles WHERE name = 'super_admin'),
    TRUE,
    'EMP001'
);

-- ============================================
-- Verify all tables were created
-- ============================================
SHOW TABLES;