import React, { useState, useEffect, useMemo } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory as apiDeleteCategory,
  setCategoryPopular,
} from "../services/adminService";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import ZoomImg from "../components/ZoomImg";
import { FiSearch, FiPlus } from "react-icons/fi";
import { BASE_URL } from "../api";
import "./Admin.css";

const UPLOADS_URL = `${BASE_URL.replace("/api", "")}/uploads`;

const AddCategory = () => {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirm = useConfirm();

  // fetch categories
  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile],
  );

  const resetForm = () => {
    setName("");
    setEditingId(null);
    setImageFile(null);
    setExistingImage("");
    setFileKey((k) => k + 1);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  // create or update category
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter category name");

    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, name, imageFile);
        toast.success("Category updated");
      } else {
        await createCategory(name, imageFile);
        toast.success("Category added");
      }
      closeModal();
      loadCategories();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Server error");
    } finally {
      setSaving(false);
    }
  };

  // edit category
  const editCategory = (c) => {
    setName(c.name);
    setEditingId(c._id);
    setImageFile(null);
    setExistingImage(c.image || "");
    setFileKey((k) => k + 1);
    setShowModal(true);
  };

  // delete category
  const deleteCategory = async (id) => {
    const ok = await confirm("Are you sure?");
    if (!ok) return;

    try {
      await apiDeleteCategory(id);
      toast.success("Category deleted");
      loadCategories();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error deleting category");
    }
  };

  // toggle a category's "popular" flag (shown on the Business Listing page)
  const handleTogglePopular = async (id, currentValue) => {
    setCategories((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isPopular: !currentValue } : c)),
    );
    try {
      await setCategoryPopular(id, !currentValue);
      toast.success(
        !currentValue ? "Marked as popular" : "Removed from popular",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update popular status");
      setCategories((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isPopular: currentValue } : c)),
      );
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-section-header">
        <h3 className="table-title">Available Categories</h3>
        <button
          type="button"
          className="admin-add-icon-btn"
          onClick={openAdd}
          aria-label="Add category"
          title="Add category"
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
          placeholder="Search categories..."
        />
      </div>

      {loading ? (
        <Loader label="Loading categories..." />
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Category Name</th>
                <th>Popular</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: 20 }}>
                    No categories available
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c, i) => (
                  <tr key={c._id}>
                    <td>{i + 1}</td>
                    <td data-label="Image">
                      {c.image ? (
                        <ZoomImg
                          src={`${UPLOADS_URL}/${c.image}`}
                          alt={c.name}
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td data-label="Category Name">{c.name}</td>
                    <td data-label="Popular">
                      <label className="featured-switch">
                        <input
                          type="checkbox"
                          checked={!!c.isPopular}
                          onChange={() =>
                            handleTogglePopular(c._id, !!c.isPopular)
                          }
                        />
                        <span className="featured-slider" />
                      </label>
                    </td>
                    <td data-label="Action">
                      <button
                        className="edit-btn"
                        onClick={() => editCategory(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteCategory(c._id)}
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
          title={editingId ? "Edit Category" : "Add Category"}
          onClose={closeModal}
        >
          <form onSubmit={submit} className="admin-form">
            <div className="admin-form-group">
              <label className="admin-label">Category Name</label>
              <input
                className="admin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name"
                autoFocus
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Category Image</label>
              <input
                key={fileKey}
                type="file"
                accept="image/*"
                className="admin-input"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {(previewUrl || existingImage) && (
                <img
                  src={previewUrl || `${UPLOADS_URL}/${existingImage}`}
                  alt="Category preview"
                  className="modal-image-preview"
                />
              )}
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
                {editingId ? "Update Category" : "Add Category"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AddCategory;
