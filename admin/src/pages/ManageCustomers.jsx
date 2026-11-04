import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomers,
  getCategories,
  getLocations,
  deleteCustomer as apiDeleteCustomer,
  setCustomerOneMindApproved,
  setCustomerActive,
  getCustomerStats,
} from "../services/adminService";
import { BASE_URL } from "../api";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import ZoomImg from "../components/ZoomImg";
import {
  FiSearch,
  FiChevronUp,
  FiChevronDown,
  FiInfo,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "./Admin.css";

const SERVER_URL = BASE_URL.replace("/api", "");
const UPLOADS_URL = `${SERVER_URL}/uploads`;

// Column -> value accessor, used by both sorting and (where relevant) filtering
const SORT_ACCESSORS = {
  shopName: (c) => c.shopName || "",
  ownerName: (c) => c.ownerName || "",
  joinedAt: (c) => (c.joinedAt ? new Date(c.joinedAt).getTime() : 0),
  enquiryCount: (c) => c.enquiryCount || 0,
  callCount: (c) => c.callCount || 0,
  visitorCount: (c) => c.uniqueVisitors || 0,
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "-");

// days left out of 365 from join date
const getValidUpto = (joinedAt) => {
  if (!joinedAt) return 0;
  const days = Math.floor((new Date() - new Date(joinedAt)) / 86400000);
  return Math.max(0, 365 - days);
};

const DetailRow = ({ label, children }) => (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{children || "-"}</span>
  </div>
);

const CustomerDetails = ({ customer: c }) => {
  const site = c.website
    ? /^https?:\/\//i.test(c.website)
      ? c.website
      : `https://${c.website}`
    : null;
  return (
    <div className="customer-detail">
      <div className="detail-head">
        {c.shopPhoto && (
          <ZoomImg
            className="detail-shop-photo"
            src={`${UPLOADS_URL}/${c.shopPhoto}`}
            alt={c.shopName}
          />
        )}
        <div>
          <h4 className="detail-name">{c.shopName}</h4>
          <span
            className={`status-badge ${c.isActive === false ? "status-badge--inactive" : "status-badge--active"}`}
          >
            {c.isActive === false ? "Inactive" : "Active"}
          </span>{" "}
          {c.isOneMindApproved && (
            <span className="status-badge status-badge--active">
              One Mind Approved
            </span>
          )}
        </div>
      </div>

      <div className="detail-section">Business</div>
      <DetailRow label="Category">{c.category?.name}</DetailRow>
      <DetailRow label="Location">{c.location?.name}</DetailRow>
      <DetailRow label="Address">{c.address}</DetailRow>
      <DetailRow label="Shop Phone">{c.shopPhone}</DetailRow>
      <DetailRow label="Email">{c.email}</DetailRow>
      <DetailRow label="Website">
        {site && (
          <a href={site} target="_blank" rel="noreferrer">
            {c.website}
          </a>
        )}
      </DetailRow>
      <DetailRow label="Description">{c.shopDescription}</DetailRow>

      <div className="detail-section">Owner</div>
      <div className="detail-owner">
        {c.ownerPhoto && (
          <ZoomImg
            className="detail-owner-photo"
            src={`${UPLOADS_URL}/${c.ownerPhoto}`}
            alt={c.ownerName}
          />
        )}
        <div className="detail-owner-info">
          <DetailRow label="Name">{c.ownerName}</DetailRow>
          <DetailRow label="Phone">{c.ownerPhone}</DetailRow>
        </div>
      </div>

      <div className="detail-section">Membership and Activity</div>
      <DetailRow label="Joined At">{fmtDate(c.joinedAt)}</DetailRow>
      <DetailRow label="Valid Upto">{`${getValidUpto(c.joinedAt)} days`}</DetailRow>
      <DetailRow label="Enquiries">{String(c.enquiryCount ?? 0)}</DetailRow>
      <DetailRow label="Calls">
        {`${c.callCount ?? 0} (last: ${fmtDateTime(c.lastCallAt)})`}
      </DetailRow>
      <DetailRow label="Visitors">
        {`${c.uniqueVisitors ?? 0} unique, ${c.visitCount ?? 0} total (last: ${fmtDateTime(c.lastVisitAt)})`}
      </DetailRow>

      {c.shopPhotos?.length > 0 && (
        <>
          <div className="detail-section">Photos</div>
          <div className="detail-gallery">
            {c.shopPhotos.map((ph) => (
              <ZoomImg key={ph} src={`${UPLOADS_URL}/${ph}`} alt="" />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterApproved, setFilterApproved] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Details modal
  const [viewCustomer, setViewCustomer] = useState(null);

  // Sort
  const [sortField, setSortField] = useState("joinedAt");
  const [sortDir, setSortDir] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const loadCustomers = async () => {
    try {
      const [data, stats] = await Promise.all([
        getCustomers(),
        getCustomerStats().catch(() => ({})),
      ]);
      setCustomers(
        data.map((c) => ({
          ...c,
          enquiryCount: stats[c._id]?.enquiryCount || 0,
          callCount: stats[c._id]?.callCount || 0,
          lastCallAt: stats[c._id]?.lastCallAt || null,
          visitCount: stats[c._id]?.visitCount || 0,
          uniqueVisitors: stats[c._id]?.uniqueVisitors || 0,
          lastVisitAt: stats[c._id]?.lastVisitAt || null,
        })),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    Promise.all([getCategories(), getLocations()])
      .then(([catData, locData]) => {
        setCategories(catData);
        setLocations(locData);
      })
      .catch(console.error);
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredCustomers = customers
    .filter((c) => {
      const term = search.toLowerCase();
      return (
        c.shopName?.toLowerCase().includes(term) ||
        c.ownerName?.toLowerCase().includes(term) ||
        c.shopPhone?.toLowerCase().includes(term)
      );
    })
    .filter((c) => !filterCategory || c.category?._id === filterCategory)
    .filter((c) => !filterLocation || c.location?._id === filterLocation)
    .filter((c) => {
      if (filterStatus === "") return true;
      return filterStatus === "active"
        ? c.isActive !== false
        : c.isActive === false;
    })
    .filter((c) => {
      if (filterApproved === "") return true;
      return filterApproved === "approved"
        ? !!c.isOneMindApproved
        : !c.isOneMindApproved;
    })
    .sort((a, b) => {
      const accessor = SORT_ACCESSORS[sortField];
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  useEffect(() => {
    setPage(1);
  }, [
    search,
    filterCategory,
    filterLocation,
    filterApproved,
    filterStatus,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedCustomers = filteredCustomers.slice(
    pageStart,
    pageStart + PAGE_SIZE,
  );

  const SortableHeader = ({ field, children }) => (
    <th
      onClick={() => toggleSort(field)}
      style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
      title="Click to sort"
    >
      {children}{" "}
      {sortField === field &&
        (sortDir === "asc" ? (
          <FiChevronUp size={12} style={{ verticalAlign: "middle" }} />
        ) : (
          <FiChevronDown size={12} style={{ verticalAlign: "middle" }} />
        ))}
    </th>
  );

  const handleToggleOneMindApproved = async (id, currentValue) => {
    // optimistic, reverted below if the request fails
    setCustomers((prev) =>
      prev.map((c) =>
        c._id === id ? { ...c, isOneMindApproved: !currentValue } : c,
      ),
    );
    try {
      await setCustomerOneMindApproved(id, !currentValue);
      toast.success(
        !currentValue ? "Marked as One Mind Approved" : "Approval removed",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update approval status");
      setCustomers((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, isOneMindApproved: currentValue } : c,
        ),
      );
    }
  };

  const handleToggleActive = async (id, currentValue) => {
    setCustomers((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isActive: !currentValue } : c)),
    );
    try {
      await setCustomerActive(id, !currentValue);
      toast.success(
        !currentValue ? "Customer activated" : "Customer deactivated",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
      setCustomers((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: currentValue } : c)),
      );
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm("Are you sure you want to delete this customer?");
    if (!ok) return;
    try {
      await apiDeleteCustomer(id);
      toast.success("Customer deleted");
      loadCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting customer");
    }
  };

  return (
    <div className="admin-page">
      <h2 className="admin-title">Manage Customers</h2>

      <div className="admin-form admin-form-flat">
        <button
          className="admin-btn"
          onClick={() => navigate("/customers/new")}
        >
          Add Customer
        </button>
      </div>

      <div className="admin-search-bar">
        <FiSearch />
        <input
          className="admin-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
        />
      </div>

      {/* Filters */}
      <div className="admin-filter-bar">
        <select
          className="admin-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="admin-select"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          className="admin-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="admin-select"
          value={filterApproved}
          onChange={(e) => setFilterApproved(e.target.value)}
        >
          <option value="">All Businesses</option>
          <option value="approved">One Mind Approved</option>
          <option value="not-approved">Not Approved</option>
        </select>

        {(filterCategory ||
          filterLocation ||
          filterApproved ||
          filterStatus) && (
          <button
            className="admin-btn"
            style={{ backgroundColor: "#6c757d" }}
            onClick={() => {
              setFilterCategory("");
              setFilterLocation("");
              setFilterApproved("");
              setFilterStatus("");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <Loader label="Loading customers..." />
      ) : (
        <div className="admin-table-card">
          <table className="admin-table customers-table">
            <thead>
              <tr>
                <th>#</th>
                <SortableHeader field="shopName">Business Name</SortableHeader>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>One Mind Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: 20 }}>
                    No customers available
                  </td>
                </tr>
              ) : (
                pagedCustomers.map((c, i) => {
                  return (
                    <tr
                      key={c._id}
                      style={
                        c.isActive === false ? { opacity: 0.6 } : undefined
                      }
                    >
                      <td className="cust-index">{pageStart + i + 1}</td>
                      <td className="cust-name" data-label="Business Name">
                        {c.shopName}
                      </td>
                      <td data-label="Category">{c.category?.name || "-"}</td>
                      <td data-label="Location">{c.location?.name || "-"}</td>
                      <td data-label="Status">
                        <div className="cust-inline">
                          <label className="featured-switch">
                            <input
                              type="checkbox"
                              checked={c.isActive !== false}
                              onChange={() =>
                                handleToggleActive(c._id, c.isActive !== false)
                              }
                            />
                            <span className="featured-slider" />
                          </label>
                          <span
                            className={`status-badge ${c.isActive === false ? "status-badge--inactive" : "status-badge--active"}`}
                          >
                            {c.isActive === false ? "Inactive" : "Active"}
                          </span>
                        </div>
                      </td>
                      <td data-label="One Mind Approved">
                        <label className="featured-switch">
                          <input
                            type="checkbox"
                            checked={!!c.isOneMindApproved}
                            aria-label={`One Mind Approved for ${c.shopName}`}
                            onChange={() =>
                              handleToggleOneMindApproved(
                                c._id,
                                !!c.isOneMindApproved,
                              )
                            }
                          />
                          <span className="featured-slider" />
                        </label>
                      </td>
                      <td className="cust-actions" data-label="Actions">
                        <div className="row-actions">
                          <button
                            className="info-btn icon-btn"
                            title="Customer details"
                            aria-label="Customer details"
                            onClick={() => setViewCustomer(c)}
                          >
                            <FiInfo size={16} />
                          </button>
                          <button
                            className="edit-btn icon-btn"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => navigate(`/customers/edit/${c._id}`)}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            className="delete-btn icon-btn"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => handleDelete(c._id)}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredCustomers.length > PAGE_SIZE && (
        <div className="admin-pager">
          <span className="admin-pager-info">
            {pageStart + 1}-
            {Math.min(pageStart + PAGE_SIZE, filteredCustomers.length)} of{" "}
            {filteredCustomers.length}
          </span>
          <div className="admin-pager-controls">
            <button
              type="button"
              className="admin-pager-btn"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
              Prev
            </button>
            <span className="admin-pager-page">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="admin-pager-btn"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Customer details modal */}
      {viewCustomer && (
        <Modal title="Customer Details" onClose={() => setViewCustomer(null)}>
          <CustomerDetails customer={viewCustomer} />
        </Modal>
      )}
    </div>
  );
};

export default ManageCustomers;
