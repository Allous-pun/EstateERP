const db = require('../config/db');

const User = {

  createUser: async (data) => {
    const {
      full_name,
      email,
      phone,
      password,
      role,
      house_number,
      lease_start,
      lease_end,
      shift,
      assigned_gate,
      admin_level
    } = data;

    const query = `
      INSERT INTO users 
      (full_name, email, phone, password, role,
       house_number, lease_start, lease_end,
       shift, assigned_gate, admin_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      full_name,
      email,
      phone,
      password,
      role,
      house_number || null,
      lease_start || null,
      lease_end || null,
      shift || null,
      assigned_gate || null,
      admin_level || 1
    ]);

    return result;
  },

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