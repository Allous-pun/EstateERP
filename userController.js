exports.registerUser = async (req, res) => {
  try {
    const data = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);

    let result;

    switch (data.role) {
      case "ADMIN":
        result = await User.createAdmin(data);
        break;

      case "TENANT":
        result = await User.createTenant(data);
        break;

      case "GUARD":
        result = await User.createGuard(data);
        break;

      default:
        return res.status(400).json({ msg: "Invalid role" });
    }

    res.status(201).json({
      message: `${data.role} created successfully`,
      result
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};