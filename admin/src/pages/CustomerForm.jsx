import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getCategories,
  getLocations,
  createCustomer,
  updateCustomer,
  deleteJoinRequest,
} from "../services/adminService";
import { prepareImages } from "../utils/imageUtils";
import { BASE_URL } from "../api";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import useUnsavedChanges from "../hooks/useUnsavedChanges";
import Loader from "../components/Loader";
import "./Admin.css";

const SERVER_URL = BASE_URL.replace("/api", "");
const UPLOADS_URL = `${SERVER_URL}/uploads`;

const REQUIRED_FIELDS = [
  { key: "shopName", label: "Business Name" },
  { key: "ownerName", label: "Entrepreneur Name" },
  { key: "ownerPhone", label: "Entrepreneur Phone" },
  { key: "shopPhone", label: "Business Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "address", label: "Address" },
  { key: "shopDescription", label: "Business Description" },
  { key: "category", label: "Category" },
  { key: "location", label: "Location" },
];

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^\d{10}$/.test(value);
const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);
const isValidWebsite = (value) =>
  /^(https?:\/\/)?([\w-]+\.)+[a-zA-Z]{2,}([/?#]\S*)?$/i.test(value);
const MIN_DESCRIPTION_LENGTH = 40;

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const toast = useToast();
  const confirm = useConfirm();
  const { dirty, markDirty } = useUnsavedChanges();

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(isEdit);
  const [imageBusy, setImageBusy] = useState(false);
  const joinRequest = useLocation().state?.joinRequest;
  const prefilled = useRef(false);

  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    ownerPhone: "",
    shopPhone: "",
    email: "",
    website: "",
    address: "",
    shopDescription: "",
    shopArticle: "",
    category: "",
    location: "",
    joinedAt: "",
    isActive: "true",
  });

  const [shopPhoto, setShopPhoto] = useState(null);
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [shopPhotos, setShopPhotos] = useState([]);

  // Existing photos (for edit mode previews)
  const [existingShopPhoto, setExistingShopPhoto] = useState("");
  const [existingOwnerPhoto, setExistingOwnerPhoto] = useState("");
  const [existingShopPhotos, setExistingShopPhotos] = useState([]);

  // Track deletions of existing (already-saved) images
  const [removeShopPhoto, setRemoveShopPhoto] = useState(false);
  const [removeOwnerPhoto, setRemoveOwnerPhoto] = useState(false);
  const [removedShopPhotos, setRemovedShopPhotos] = useState([]);

  // Load categories and locations
  useEffect(() => {
    Promise.all([getCategories(), getLocations()])
      .then(([catData, locData]) => {
        setCategories(catData);
        setLocations(locData);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (isEdit || !joinRequest || prefilled.current) return;
    if (categories.length === 0 || locations.length === 0) return;
    prefilled.current = true;
    const idByName = (list, name) =>
      list.find(
        (x) => x.name.toLowerCase() === (name || "").trim().toLowerCase(),
      )?._id || "";
    setForm((f) => ({
      ...f,
      ownerName: joinRequest.name || "",
      ownerPhone: sanitizePhone(joinRequest.mobile || ""),
      category: idByName(categories, joinRequest.category),
      location: idByName(locations, joinRequest.location),
    }));
  }, [categories, locations]);

  // Load customer data in edit mode
  useEffect(() => {
    let cancelled = false;

    if (isEdit) {
      const fetchCustomer = async () => {
        setLoadingCustomer(true);
        try {
          const res = await fetch(`${BASE_URL}/customers/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          });
          const data = await res.json();
          if (cancelled) return;

          setForm({
            shopName: data.shopName || "",
            ownerName: data.ownerName || "",
            ownerPhone: data.ownerPhone || "",
            shopPhone: data.shopPhone || "",
            email: data.email || "",
            website: data.website || "",
            address: data.address || "",
            shopDescription: data.shopDescription || "",
            shopArticle: data.shopArticle || "",
            category: data.category?._id || "",
            location: data.location?._id || "",
            joinedAt: data.joinedAt
              ? new Date(data.joinedAt).toISOString().split("T")[0]
              : "",
            isActive: data.isActive === false ? "false" : "true",
          });
          setExistingShopPhoto(data.shopPhoto || "");
          setExistingOwnerPhoto(data.ownerPhoto || "");
          setExistingShopPhotos(data.shopPhotos || []);
          setRemoveShopPhoto(false);
          setRemoveOwnerPhoto(false);
          setRemovedShopPhotos([]);
        } catch (err) {
          if (!cancelled) {
            console.error(err);
            toast.error("Failed to load customer");
          }
        } finally {
          if (!cancelled) setLoadingCustomer(false);
        }
      };
      fetchCustomer();
    } else {
      setLoadingCustomer(false);
      setForm({
        shopName: "",
        ownerName: "",
        ownerPhone: "",
        shopPhone: "",
        email: "",
        website: "",
        address: "",
        shopDescription: "",
        shopArticle: "",
        category: "",
        location: "",
        joinedAt: "",
      });
      setExistingShopPhoto("");
      setExistingOwnerPhoto("");
      setExistingShopPhotos([]);
      setRemoveShopPhoto(false);
      setRemoveOwnerPhoto(false);
      setRemovedShopPhotos([]);
    }

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const pickImages = async (fileList) => {
    setImageBusy(true);
    try {
      return await prepareImages(Array.from(fileList || []), toast.error);
    } finally {
      setImageBusy(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isPhoneField = name === "ownerPhone" || name === "shopPhone";
    setForm({ ...form, [name]: isPhoneField ? sanitizePhone(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const field of REQUIRED_FIELDS) {
      if (!form[field.key] || !form[field.key].trim()) {
        return toast.error(`${field.label} is required`);
      }
    }

    if (!isValidEmail(form.email.trim())) {
      return toast.error("Please enter a valid email address");
    }

    if (!isValidPhone(form.ownerPhone.trim())) {
      return toast.error("Please enter a valid entrepreneur phone number");
    }

    if (!isValidPhone(form.shopPhone.trim())) {
      return toast.error("Please enter a valid business phone number");
    }

    if (!isValidWebsite(form.website.trim())) {
      return toast.error("Please enter a valid website URL");
    }

    if (form.shopDescription.trim().length < MIN_DESCRIPTION_LENGTH) {
      return toast.error(
        `Business Description must be at least ${MIN_DESCRIPTION_LENGTH} characters so the business page reads well in search results`,
      );
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined) data.append(k, v);
      });
      if (shopPhoto) data.append("shopPhoto", shopPhoto);
      if (ownerPhoto) data.append("ownerPhoto", ownerPhoto);
      shopPhotos.forEach((photo) => data.append("shopPhotos", photo));

      if (isEdit) {
        if (removeShopPhoto) data.append("removeShopPhoto", "true");
        if (removeOwnerPhoto) data.append("removeOwnerPhoto", "true");
        removedShopPhotos.forEach((photo) =>
          data.append("removeShopPhotos", photo),
        );
      }

      if (isEdit) {
        await updateCustomer(id, data);
        toast.success("Customer updated");
      } else {
        await createCustomer(data);
        if (joinRequest?.id)
          await deleteJoinRequest(joinRequest.id).catch(() => {});
        toast.success("Customer added");
      }
      navigate("/customers");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error while saving");
    } finally {
      setSubmitting(false);
    }
  };

  const removeNewShopPhoto = (idx) => {
    setShopPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingShopPhoto = (photo) => {
    setExistingShopPhotos((prev) => prev.filter((p) => p !== photo));
    setRemovedShopPhotos((prev) => [...prev, photo]);
  };

  return (
    <div className="admin-page">
      <h2 className="admin-title">
        {isEdit ? "Edit Customer" : "Add Customer"}
      </h2>

      <div className="admin-form-card">
        {loadingCustomer ? (
          <Loader label="Loading customer..." />
        ) : (
          <form
            className="admin-form"
            onSubmit={handleSubmit}
            onChange={markDirty}
          >
            <h3 className="admin-form-section admin-full">Business</h3>

            {/* Business Name */}
            <div className="admin-form-group admin-full">
              <label className="admin-label">Business Name *</label>
              <input
                className="admin-input"
                name="shopName"
                value={form.shopName}
                onChange={handleChange}
                placeholder="Enter business name"
                required
              />
            </div>

            {/* Entrepreneur Name */}
            <div className="admin-form-group admin-full">
              <label className="admin-label">Entrepreneur Name *</label>
              <input
                className="admin-input"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                placeholder="Enter entrepreneur name"
                required
              />
            </div>

            <h3 className="admin-form-section admin-full">Contact</h3>

            {/* Phones - 2 column */}
            <div className="admin-form-group">
              <label className="admin-label">Entrepreneur Phone *</label>
              <input
                type="tel"
                className="admin-input"
                name="ownerPhone"
                value={form.ownerPhone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                inputMode="numeric"
                maxLength={10}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Business Phone *</label>
              <input
                type="tel"
                className="admin-input"
                name="shopPhone"
                value={form.shopPhone}
                onChange={handleChange}
                placeholder="10-digit business phone"
                inputMode="numeric"
                maxLength={10}
                required
              />
            </div>

            {/* Email & Website - 2 column */}
            <div className="admin-form-group">
              <label className="admin-label">Email *</label>
              <input
                type="email"
                className="admin-input"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Website *</label>
              <input
                className="admin-input"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="Enter website URL"
                required
              />
            </div>

            {/* Address */}
            <div className="admin-form-group admin-full">
              <label className="admin-label">Address *</label>
              <textarea
                className="admin-textarea"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter full address"
                rows={3}
                style={{ resize: "vertical" }}
                required
              />
            </div>

            <h3 className="admin-form-section admin-full">About</h3>

            {/* Business Description */}
            <div className="admin-form-group admin-full">
              <label className="admin-label">Business Description *</label>
              <textarea
                className="admin-textarea"
                name="shopDescription"
                value={form.shopDescription}
                onChange={handleChange}
                placeholder="Enter business description"
                rows={3}
                style={{ resize: "vertical" }}
                required
              />
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color:
                    form.shopDescription.trim().length < MIN_DESCRIPTION_LENGTH
                      ? "#990a0a"
                      : "#555",
                }}
              >
                {form.shopDescription.trim().length}/{MIN_DESCRIPTION_LENGTH}{" "}
                characters minimum
              </p>
            </div>

            {/* Business Article */}
            <div className="admin-form-group admin-full">
              <label className="admin-label">Business Article</label>
              <textarea
                className="admin-textarea"
                name="shopArticle"
                value={form.shopArticle}
                onChange={handleChange}
                placeholder="Enter business article"
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>

            <h3 className="admin-form-section admin-full">Listing</h3>

            {/* Category & Location */}
            <div className="admin-form-group">
              <label className="admin-label">Category *</label>
              <select
                className="admin-select"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Location *</label>
              <select
                className="admin-select"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Joined At */}
            <div className="admin-form-group">
              <label className="admin-label">Joined At</label>
              <input
                type="date"
                className="admin-input"
                name="joinedAt"
                value={form.joinedAt}
                onChange={handleChange}
              />
            </div>

            {/* Status */}
            <div className="admin-form-group">
              <label className="admin-label">Status</label>
              <select
                className="admin-input"
                name="isActive"
                value={form.isActive}
                onChange={handleChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <h3 className="admin-form-section admin-full">Photos</h3>

            {/* Shop Photo */}
            <div className="admin-form-group">
              <label className="admin-label">Shop Photo</label>
              <input
                type="file"
                className="admin-input"
                accept="image/*"
                onChange={async (e) => {
                  const input = e.target;
                  const [file] = await pickImages(input.files);
                  if (!file) input.value = "";
                  setShopPhoto(file || null);
                }}
              />
              {/* Existing shop photo preview */}
              {isEdit &&
                existingShopPhoto &&
                !shopPhoto &&
                !removeShopPhoto && (
                  <div
                    style={{
                      marginTop: 8,
                      position: "relative",
                      display: "inline-block",
                      alignSelf: "flex-start",
                    }}
                  >
                    <img
                      src={`${UPLOADS_URL}/${existingShopPhoto}`}
                      alt="Current shop"
                      style={{
                        width: 100,
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setRemoveShopPhoto(true)}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "#990a0a",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 22,
                        height: 22,
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: "22px",
                        textAlign: "center",
                      }}
                      title="Delete this photo"
                    >
                      X
                    </button>
                  </div>
                )}
              {isEdit && removeShopPhoto && !shopPhoto && (
                <p
                  style={{ margin: "4px 0 0", fontSize: 13, color: "#990a0a" }}
                >
                  Photo will be removed on save.{" "}
                  <button
                    type="button"
                    onClick={() => setRemoveShopPhoto(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6366f1",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Undo
                  </button>
                </p>
              )}
              {/* New shop photo preview */}
              {shopPhoto && (
                <div style={{ marginTop: 8, alignSelf: "flex-start" }}>
                  <img
                    src={URL.createObjectURL(shopPhoto)}
                    alt="New shop"
                    style={{
                      width: 100,
                      height: 70,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "2px solid #6366f1",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Owner Photo */}
            <div className="admin-form-group">
              <label className="admin-label">Owner Photo</label>
              <input
                type="file"
                className="admin-input"
                accept="image/*"
                onChange={async (e) => {
                  const input = e.target;
                  const [file] = await pickImages(input.files);
                  if (!file) input.value = "";
                  setOwnerPhoto(file || null);
                }}
              />
              {/* Existing owner photo preview */}
              {isEdit &&
                existingOwnerPhoto &&
                !ownerPhoto &&
                !removeOwnerPhoto && (
                  <div
                    style={{
                      marginTop: 8,
                      position: "relative",
                      display: "inline-block",
                      alignSelf: "flex-start",
                    }}
                  >
                    <img
                      src={`${UPLOADS_URL}/${existingOwnerPhoto}`}
                      alt="Current owner"
                      style={{
                        width: 100,
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setRemoveOwnerPhoto(true)}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "#990a0a",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 22,
                        height: 22,
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: "22px",
                        textAlign: "center",
                      }}
                      title="Delete this photo"
                    >
                      X
                    </button>
                  </div>
                )}
              {isEdit && removeOwnerPhoto && !ownerPhoto && (
                <p
                  style={{ margin: "4px 0 0", fontSize: 13, color: "#990a0a" }}
                >
                  Photo will be removed on save.{" "}
                  <button
                    type="button"
                    onClick={() => setRemoveOwnerPhoto(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6366f1",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Undo
                  </button>
                </p>
              )}
              {/* New owner photo preview */}
              {ownerPhoto && (
                <div style={{ marginTop: 8, alignSelf: "flex-start" }}>
                  <img
                    src={URL.createObjectURL(ownerPhoto)}
                    alt="New owner"
                    style={{
                      width: 100,
                      height: 70,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "2px solid #6366f1",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Additional Shop Photos */}
            <div className="admin-form-group admin-full">
              <label className="admin-label">
                Additional Shop Photos (up to 10)
              </label>
              <input
                type="file"
                className="admin-input"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const input = e.target;
                  const picked = Array.from(input.files || []);
                  input.value = "";
                  if (picked.length === 0) return;
                  const selectedFiles = await pickImages(picked);
                  if (selectedFiles.length === 0) return;
                  setShopPhotos((prev) => {
                    const combined = [...prev, ...selectedFiles];
                    if (combined.length > 10) {
                      toast.error(
                        "Maximum 10 photos allowed. Only the first 10 will be kept.",
                      );
                      return combined.slice(0, 10);
                    }
                    return combined;
                  });
                }}
              />
              {shopPhotos.length > 0 && (
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>
                  {shopPhotos.length} file(s) selected
                </p>
              )}

              {/* New shop photos previews */}
              {shopPhotos.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {shopPhotos.map((file, idx) => (
                    <div
                      key={idx}
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New photo ${idx + 1}`}
                        style={{
                          width: 100,
                          height: 70,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "2px solid #6366f1",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewShopPhoto(idx)}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          background: "#990a0a",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 22,
                          height: 22,
                          cursor: "pointer",
                          fontSize: 12,
                          lineHeight: "22px",
                          textAlign: "center",
                        }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing shop photos previews */}
              {isEdit && existingShopPhotos.length > 0 && (
                <>
                  <label
                    style={{
                      marginTop: 12,
                      display: "block",
                      fontSize: 13,
                      color: "#555",
                    }}
                  >
                    Existing Photos
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      marginTop: 4,
                    }}
                  >
                    {existingShopPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <img
                          src={`${UPLOADS_URL}/${photo}`}
                          alt={`Existing ${idx + 1}`}
                          style={{
                            width: 100,
                            height: 70,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingShopPhoto(photo)}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            background: "#990a0a",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            cursor: "pointer",
                            fontSize: 12,
                            lineHeight: "22px",
                            textAlign: "center",
                          }}
                          title="Delete this photo"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <div
              className="admin-full form-actions-row"
              style={{ marginTop: 20, display: "flex", gap: 10 }}
            >
              <button
                type="submit"
                className="admin-btn"
                disabled={submitting || imageBusy}
              >
                {submitting
                  ? "Saving..."
                  : imageBusy
                    ? "Preparing photos..."
                    : isEdit
                      ? "Update Customer"
                      : "Add Customer"}
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{ backgroundColor: "#6c757d" }}
                onClick={async () => {
                  if (dirty && !(await confirm("Discard unsaved changes?")))
                    return;
                  navigate("/customers");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerForm;
