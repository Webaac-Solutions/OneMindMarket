import React, { useEffect, useState } from "react";
import {
  getEnquiries,
  clearEnquiries as apiClearEnquiries,
  setEnquiryHandled,
} from "../services/adminService";
import { FiSearch, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "../components/Toast";
import Loader from "../components/Loader";
import { useConfirm } from "../components/ConfirmDialog";
import "./AdminEnquiries.css";

const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [clearing, setClearing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const toast = useToast();
  const confirm = useConfirm();

  const waNumber = (phone) => {
    const digits = (phone || "").replace(/\D/g, "");
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const fetchEnquiries = () => {
    getEnquiries()
      .then((data) => setEnquiries(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load enquiries");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const toggleHandled = async (id, current) => {
    setEnquiries((prev) =>
      prev.map((e) => (e._id === id ? { ...e, handled: !current } : e)),
    );
    try {
      await setEnquiryHandled(id, !current);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update enquiry");
      setEnquiries((prev) =>
        prev.map((e) => (e._id === id ? { ...e, handled: current } : e)),
      );
    }
  };

  const DAY = 24 * 60 * 60 * 1000;
  const rangeDays = { today: 1, week: 7, month: 30 }[dateRange];
  const filteredEnquiries = enquiries.filter((e) => {
    const term = search.trim().toLowerCase();
    if (
      term &&
      ![e.shop?.shopName, e.name, e.phone, e.enquiry, e.referredBy].some((v) =>
        (v || "").toLowerCase().includes(term),
      )
    )
      return false;
    if (rangeDays) {
      const start =
        dateRange === "today"
          ? new Date().setHours(0, 0, 0, 0)
          : Date.now() - rangeDays * DAY;
      if (new Date(e.createdAt).getTime() < start) return false;
    }
    if (statusFilter === "pending" && e.handled) return false;
    if (statusFilter === "handled" && !e.handled) return false;
    return true;
  });

  const clearEnquiries = async () => {
    const confirmed = await confirm(
      "Are you sure you want to clear all enquiry history? This action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setClearing(true);
      await apiClearEnquiries();
      setEnquiries([]);
      toast.success("Enquiry history cleared successfully.");
    } catch (err) {
      toast.error("Failed to clear enquiry history.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="admin-enquiry-page">
      <div className="admin-enquiry-header">
        <h2>Customer Enquiries</h2>

        <button
          className="admin-clear-btn"
          onClick={clearEnquiries}
          disabled={clearing || enquiries.length === 0}
        >
          {clearing ? "Clearing..." : "Clear Enquiry History"}
        </button>
      </div>

      {!loading && enquiries.length > 0 && (
        <>
          <div className="admin-search-bar">
            <FiSearch />
            <input
              className="admin-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search enquiries..."
            />
          </div>
          <div className="admin-filter-bar">
            <select
              className="admin-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="handled">Handled</option>
            </select>
          </div>
        </>
      )}

      {loading ? (
        <Loader label="Loading enquiries..." />
      ) : enquiries.length === 0 ? (
        <div className="admin-enquiry-empty">No enquiries available</div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="admin-enquiry-empty">No matching enquiries</div>
      ) : (
        <table className="admin-enquiry-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Enquiry</th>
              <th>Referred By</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnquiries.map((e) => (
              <tr key={e._id} style={e.handled ? { opacity: 0.6 } : undefined}>
                <td className="cell-business" data-label="Business">
                  {e.shop?.shopName}
                </td>
                <td className="cell-name" data-label="Name">
                  {e.name}
                </td>
                <td className="cell-phone" data-label="Phone">
                  {e.phone}
                  {e.phone && (
                    <span className="row-actions row-actions--inline">
                      <a
                        className="action-link"
                        href={`tel:${e.phone}`}
                        aria-label={`Call ${e.name || e.phone}`}
                      >
                        <FiPhone />
                      </a>
                      <a
                        className="action-link action-link--wa"
                        href={`https://wa.me/${waNumber(e.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${e.name || e.phone}`}
                      >
                        <FaWhatsapp />
                      </a>
                    </span>
                  )}
                </td>
                <td className="cell-enquiry" data-label="Enquiry">
                  {e.enquiry}
                </td>
                <td className="cell-referred" data-label="Referred by">
                  {e.referredBy}
                </td>
                <td className="cell-status" data-label="Status">
                  <div className="cell-status-inner">
                    <label className="featured-switch">
                      <input
                        type="checkbox"
                        checked={!!e.handled}
                        onChange={() => toggleHandled(e._id, !!e.handled)}
                      />
                      <span className="featured-slider" />
                    </label>
                    <span
                      className={`status-badge ${e.handled ? "status-badge--active" : "status-badge--inactive"}`}
                    >
                      {e.handled ? "Handled" : "Pending"}
                    </span>
                  </div>
                </td>
                <td className="cell-date" data-label="Date">
                  {new Date(e.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminEnquiries;
