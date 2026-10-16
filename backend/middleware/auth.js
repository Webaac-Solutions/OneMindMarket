const jwt = require("jsonwebtoken");

const JWT_SECRET = require("../config/jwt");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Missing Authorization header" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ message: "Invalid Authorization format" });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach payload if needed
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function isAdminRequest(req) {
  const parts = (req.headers.authorization || "").split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return false;
  try {
    jwt.verify(parts[1], JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

authMiddleware.isAdminRequest = isAdminRequest;

module.exports = authMiddleware;
