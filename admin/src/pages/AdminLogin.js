import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import auth from "../services/authService";
import "./Admin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(() => {
    if (sessionStorage.getItem("adminSessionExpired")) {
      sessionStorage.removeItem("adminSessionExpired");
      return "Your session expired. Please log in again.";
    }
    return null;
  });

  if (auth.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    try {
      await auth.login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-form-card" style={{ maxWidth: 420, width: "100%" }}>
        <h2 className="admin-login-title">
          OneMind <span>Admin</span>
        </h2>
        <form onSubmit={submit} className="admin-form">
          <div className="admin-form-group">
            <label className="admin-label">Username</label>
            <input
              className="admin-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Password</label>
            <div className="admin-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="admin-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ color: "#990a0a", fontWeight: 600, fontSize: 14 }}>
              {error}
            </div>
          )}
          <div style={{ marginTop: 6 }}>
            <button
              type="submit"
              className="admin-btn"
              style={{ width: "100%" }}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
