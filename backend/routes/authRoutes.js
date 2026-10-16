const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

const JWT_SECRET = require("../config/jwt");
const TOKEN_EXP = process.env.JWT_EXP || "8h";

// login route - accepts JSON { username, password }
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password)
      return res
        .status(400)
        .json({ message: "Username and password required" });

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const payload = { username: admin.username, id: admin._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXP });
    return res.json({ token, expiresIn: TOKEN_EXP });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
