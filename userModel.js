const db = require('../config/db');

const User = {

  // ===============================
  // 🔹 CREATE ADMIN
  // ===============================
  createAdmin: async (data) => {
    const { full_name, email, phone, password, admin_level } = data;

    const query = `
      INSERT INTO users 
      (full_name, email, phone, password, role, admin_level)
      VALUES (?, ?, ?, ?, 'ADMIN', ?)
    `;

    const [result] = await db.execute(query, [
      full_name,
      email,
      phone,
      password,
      admin_level || 1
    ]);

    return result;
  },

  // ===============================
  // 🔹 CREATE TENANT
  // ===============================
  createTenant: async (data) => {
    const {
      full_name,
      email,
      phone,
      password,
      house_number,
      lease_start,
      lease_end
    } = data;

    const query = `
      INSERT INTO users 
      (full_name, email, phone, password, role,
       house_number, lease_start, lease_end)
      VALUES (?, ?, ?, ?, 'TENANT', ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      full_name,
      email,
      phone,
      password,
      house_number,
      lease_start,
      lease_end
    ]);

    return result;
  },

  // ===============================
  // 🔹 CREATE GUARD
  // ===============================
  createGuard: async (data) => {
    const {
      full_name,
      email,
      phone,
      password,
      shift,
      assigned_gate
    } = data;

    const query = `
      INSERT INTO users 
      (full_name, email, phone, password, role,
       shift, assigned_gate)
      VALUES (?, ?, ?, ?, 'GUARD', ?, ?)
    `;

    const [result] = await db.execute(query, [
      full_name,
      email,
      phone,
      password,
      shift,
      assigned_gate
    ]);

    return result;
  },

  // ===============================
  // 🔹 COMMON METHODS
  // ===============================
  findByEmail: async (email) => {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ?", [email]
    );
    return rows[0];
  },

  getAllUsers: async () => {
    const [rows] = await db.execute("SELECT * FROM users");
    return rows;
  },

  getUserById: async (id) => {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE id = ?", [id]
    );
    return rows[0];
  }

};

module.exports = User;