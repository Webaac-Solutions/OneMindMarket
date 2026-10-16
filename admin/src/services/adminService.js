import { BASE_URL } from "../api";
import auth from "./authService";

// Helper to handle responses
const handleResponse = async (res) => {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  } else if (res.status === 401) {
    auth.logoutAndRedirect();
    throw new Error("Session expired. Redirecting to login...");
  } else {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
};

const authHeaders = (extra = {}) => {
  const token = auth.getToken && auth.getToken();
  const headers = { ...extra };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// --- Categories ---
export const getCategories = async () => {
  const res = await fetch(`${BASE_URL}/categories`, { headers: authHeaders() });
  return handleResponse(res);
};

const categoryFormData = (name, imageFile) => {
  const formData = new FormData();
  formData.append("name", name);
  if (imageFile) formData.append("image", imageFile);
  return formData;
};

export const createCategory = async (name, imageFile) => {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: "POST",
    headers: authHeaders(),
    body: categoryFormData(name, imageFile),
  });
  return handleResponse(res);
};

export const updateCategory = async (id, name, imageFile) => {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: categoryFormData(name, imageFile),
  });
  return handleResponse(res);
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const setCategoryPopular = async (id, isPopular) => {
  const res = await fetch(`${BASE_URL}/categories/${id}/popular`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ isPopular }),
  });
  return handleResponse(res);
};

// --- Locations ---
export const getLocations = async () => {
  const res = await fetch(`${BASE_URL}/locations`, { headers: authHeaders() });
  return handleResponse(res);
};

export const createLocation = async (name) => {
  const res = await fetch(`${BASE_URL}/locations`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
};

export const updateLocation = async (id, name) => {
  const res = await fetch(`${BASE_URL}/locations/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
};

export const deleteLocation = async (id) => {
  const res = await fetch(`${BASE_URL}/locations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// --- Customers ---
export const getCustomers = async () => {
  const res = await fetch(`${BASE_URL}/customers`, { headers: authHeaders() });
  return handleResponse(res);
};

export const createCustomer = async (formData) => {
  const res = await fetch(`${BASE_URL}/customers`, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const updateCustomer = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/customers/${id}`, {
    method: "PUT",
    body: formData,
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const deleteCustomer = async (id) => {
  const res = await fetch(`${BASE_URL}/customers/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const getCustomerStats = async () => {
  const res = await fetch(`${BASE_URL}/customers/admin/stats`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const getCustomerActivity = async (id) => {
  const res = await fetch(`${BASE_URL}/customers/${id}/activity`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const setCustomerActive = async (id, isActive) => {
  const res = await fetch(`${BASE_URL}/customers/${id}/active`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ isActive }),
  });
  return handleResponse(res);
};

export const setCustomerOneMindApproved = async (id, isOneMindApproved) => {
  const res = await fetch(`${BASE_URL}/customers/${id}/one-mind-approved`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ isOneMindApproved }),
  });
  return handleResponse(res);
};

// --- Articles ---
export const getArticles = async () => {
  const res = await fetch(`${BASE_URL}/articles`, { headers: authHeaders() });
  return handleResponse(res);
};

export const createArticle = async (formData) => {
  const res = await fetch(`${BASE_URL}/articles`, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const updateArticle = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/articles/${id}`, {
    method: "PUT",
    body: formData,
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const deleteArticle = async (id) => {
  const res = await fetch(`${BASE_URL}/articles/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// --- Gallery ---
export const getGalleryItems = async () => {
  const res = await fetch(`${BASE_URL}/gallery`, { headers: authHeaders() });
  return handleResponse(res);
};

export const createGalleryItem = async (formData) => {
  const res = await fetch(`${BASE_URL}/gallery`, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const updateGalleryItem = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/gallery/${id}`, {
    method: "PUT",
    body: formData,
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const deleteGalleryItem = async (id) => {
  const res = await fetch(`${BASE_URL}/gallery/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const reorderGalleryItems = async (items) => {
  const res = await fetch(`${BASE_URL}/gallery/reorder`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ items }),
  });
  return handleResponse(res);
};

// --- Join Requests ---
export const getJoinRequests = async () => {
  const res = await fetch(`${BASE_URL}/join-requests`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const deleteJoinRequest = async (id) => {
  const res = await fetch(`${BASE_URL}/join-requests/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// --- Enquiries ---
export const getEnquiries = async () => {
  const res = await fetch(`${BASE_URL}/enquiries`, { headers: authHeaders() });
  return handleResponse(res);
};

export const setEnquiryHandled = async (id, handled) => {
  const res = await fetch(`${BASE_URL}/enquiries/${id}/handled`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ handled }),
  });
  return handleResponse(res);
};

export const clearEnquiries = async () => {
  const res = await fetch(`${BASE_URL}/enquiries`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// --- Announcements ---
export const getAnnouncements = async ({
  skip = 0,
  limit = 10,
  q = "",
} = {}) => {
  const params = new URLSearchParams({ skip, limit });
  if (q) params.set("q", q);
  const res = await fetch(`${BASE_URL}/announcements?${params}`);
  return handleResponse(res);
};

export const getSubscriberCount = async () => {
  const res = await fetch(`${BASE_URL}/announcements/subscribers`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const createAnnouncement = async ({ image, sendPush, ...fields }) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
  formData.append("sendPush", String(sendPush));
  if (image) formData.append("image", image);
  const res = await fetch(`${BASE_URL}/announcements`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(res);
};

export const deleteAnnouncement = async (id) => {
  const res = await fetch(`${BASE_URL}/announcements/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};
