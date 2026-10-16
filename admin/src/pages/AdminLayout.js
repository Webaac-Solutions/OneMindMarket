import React, { useEffect, useState } from "react";
import {
  Outlet,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  FiGrid,
  FiMapPin,
  FiUsers,
  FiClipboard,
  FiMessageSquare,
  FiHome,
  FiFileText,
  FiImage,
  FiBell,
  FiLogOut,
  FiMoreHorizontal,
} from "react-icons/fi";
import auth from "../services/authService";
import { getJoinRequests, getEnquiries } from "../services/adminService";
import "./Admin.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/add-category", label: "Add Category" },
  { to: "/add-location", label: "Add Location" },
  { to: "/customers", label: "Manage Customers" },
  { to: "/view-join-requests", label: "View Join Requests" },
  { to: "/AdminEnquiries", label: "Enquiry" },
  { to: "/articles", label: "Manage Articles" },
  { to: "/gallery", label: "Manage Gallery" },
  { to: "/notifications", label: "Notifications" },
];

const PRIMARY_NAV = [
  { to: "/dashboard", label: "Home", icon: FiHome },
  { to: "/add-category", label: "Category", icon: FiGrid },
  { to: "/add-location", label: "Location", icon: FiMapPin },
  { to: "/customers", label: "Customers", icon: FiUsers },
];

const MORE_NAV = [
  { to: "/view-join-requests", label: "Requests", icon: FiClipboard },
  { to: "/AdminEnquiries", label: "Enquiry", icon: FiMessageSquare },
  { to: "/articles", label: "Articles", icon: FiFileText },
  { to: "/gallery", label: "Gallery", icon: FiImage },
  { to: "/notifications", label: "Notify", icon: FiBell },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [counts, setCounts] = useState({ requests: 0, enquiries: 0 });

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!auth.isAuthenticated()) return;
    Promise.all([getJoinRequests(), getEnquiries()])
      .then(([requests, enquiries]) =>
        setCounts({
          requests: Array.isArray(requests) ? requests.length : 0,
          enquiries: Array.isArray(enquiries)
            ? enquiries.filter((e) => !e.handled).length
            : 0,
        }),
      )
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  const activeLabel =
    NAV_ITEMS.find(
      (item) => item.to.toLowerCase() === location.pathname.toLowerCase(),
    )?.label || "Admin Panel";

  const badgeFor = (to) =>
    to === "/view-join-requests"
      ? counts.requests
      : to === "/AdminEnquiries"
        ? counts.enquiries
        : 0;

  const isMoreActive = MORE_NAV.some(
    (item) => item.to.toLowerCase() === location.pathname.toLowerCase(),
  );

  return (
    <div className="admin-container">
      {/* mobile topbar */}
      <div className="admin-topbar">
        <div className="admin-topbar-top">
          <div
            className="admin-topbar-brand"
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer" }}
          >
            <span className="admin-topbar-logo">
              <img src="/onemindlogo.png" alt="OneMind" />
            </span>
            <span className="admin-topbar-brandname">OneMind Admin</span>
          </div>
          <button
            className="admin-topbar-logout"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <FiLogOut size={18} />
          </button>
        </div>
        <span className="admin-topbar-page">{activeLabel}</span>
      </div>

      {/* desktop sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/onemindlogo.png" alt="OneMind" />
          <span className="sidebar-logo-name">OneMind Admin</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {item.label}
              {badgeFor(item.to) > 0 && (
                <span className="nav-badge">{badgeFor(item.to)}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-logout">
          <button className="admin-btn admin-logout-btn" onClick={handleLogout}>
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div key={location.pathname} className="admin-route">
          <Outlet />
        </div>
      </main>

      {/* mobile bottom nav */}
      <nav className="admin-bottom-nav">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to.toLowerCase() === location.pathname.toLowerCase();
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`admin-bottom-nav-item${isActive ? " active" : ""}`}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button
          className={`admin-bottom-nav-item${isMoreActive || moreOpen ? " active" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <FiMoreHorizontal />
          {counts.requests + counts.enquiries > 0 && (
            <span className="nav-dot" />
          )}
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          className="admin-more-backdrop"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* more sheet */}
      <div className={`admin-more-sheet${moreOpen ? " is-open" : ""}`}>
        <div className="admin-more-handle" />
        <div className="admin-more-grid">
          {MORE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className="admin-more-item">
                <span className="admin-more-icon">
                  <Icon />
                  {badgeFor(item.to) > 0 && (
                    <span className="nav-badge nav-badge--corner">
                      {badgeFor(item.to)}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <button
            className="admin-more-item admin-more-item-logout"
            onClick={handleLogout}
          >
            <span className="admin-more-icon">
              <FiLogOut />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
