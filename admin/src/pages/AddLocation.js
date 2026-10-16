import React, { useState, useEffect } from "react";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation as apiDeleteLocation,
} from "../services/adminService";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import { FiSearch, FiPlus } from "react-icons/fi";
import "./Admin.css";

const AddLocation = () => {
  const [name, setName] = useState("");
  const [locations, setLocations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirm = useConfirm();

  // Load all locations
  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setName("");
    setEditingId(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setName("");
    setEditingId(null);
  };

  // Create or Update Location
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter location name");

    setSaving(true);
    try {
      if (editingId) {
        await updateLocation(editingId, name);
        toast.success("Location updated");
      } else {
        await createLocation(name);
        toast.success("Location added");
      }
      closeModal();
      loadLocations(); // Refresh table
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Server error");
    } finally {
      setSaving(false);
    }
  };

  // Pre-fill form for editing
  const editLocation = (loc) => {
    setName(loc.name);
    setEditingId(loc._id);
    setShowModal(true);
  };

  // Delete Location
  const deleteLocation = async (id) => {
    const ok = await confirm("Are you sure?");
    if (!ok) return;

    try {
      await apiDeleteLocation(id);
      toast.success("Location deleted");
      loadLocations();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error deleting location");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-section-header">
        <h3 className="table-title">Available Locations</h3>
        <button
          type="button"
          className="admin-add-icon-btn"
          onClick={openAdd}
          aria-label="Add location"
          title="Add location"
        >
          <FiPlus size={22} />
        </button>
      </div>

      <div className="admin-search-bar">
        <FiSearch />
        <input
          className="admin-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search locations..."
        />
      </div>

      {loading ? (
        <Loader label="Loading locations..." />
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Location Name</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: 20 }}>
                    No locations available
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc, i) => (
                  <tr key={loc._id}>
                    <td>{i + 1}</td>
                    <td data-label="Location Name">{loc.name}</td>
                    <td data-label="Action">
                      <button
                        className="edit-btn"
                        onClick={() => editLocation(loc)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteLocation(loc._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal
          title={editingId ? "Edit Location" : "Add Location"}
          onClose={closeModal}
        >
          <form onSubmit={submit} className="admin-form">
            <div className="admin-form-group">
              <label className="admin-label">Location Name</label>
              <input
                className="admin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Location name"
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="admin-btn cancel-btn-flat"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button type="submit" className="admin-btn" disabled={saving}>
                {editingId ? "Update Location" : "Add Location"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AddLocation;
