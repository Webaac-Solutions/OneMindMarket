import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getJoinRequests, deleteJoinRequest } from "../services/adminService";
import { useToast } from "../components/Toast";
import Loader from "../components/Loader";
import { useConfirm } from "../components/ConfirmDialog";
import "./Admin.css";

const ViewJoinRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const waNumber = (mobile) => {
    const digits = (mobile || "").replace(/\D/g, "");
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const fetchRequests = () => {
    getJoinRequests()
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load join requests");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id) => {
    const ok = await confirm(
      "Are you sure you want to delete this join request?",
    );
    if (!ok) return;
    try {
      await deleteJoinRequest(id);
      toast.success("Join request deleted");
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting request");
    }
  };

  return (
    <div className="admin-page">
      <h2 className="admin-title">Join Requests</h2>
      {loading ? (
        <Loader label="Loading join requests..." />
      ) : requests.length === 0 ? (
        <p style={{ marginTop: 15 }}>No join requests yet.</p>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table join-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Location</th>
                <th>Category</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td className="join-name" data-label="Name">
                    {req.name}
                  </td>
                  <td data-label="Mobile">
                    <a className="join-call" href={`tel:${req.mobile}`}>
                      {req.mobile}
                    </a>
                  </td>
                  <td data-label="Location">{req.location || "N/A"}</td>
                  <td data-label="Category">{req.category || "N/A"}</td>
                  <td data-label="Submitted At">
                    {new Date(req.createdAt).toLocaleString()}
                  </td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      <a className="action-link" href={`tel:${req.mobile}`}>
                        <FiPhone /> Call
                      </a>
                      <a
                        className="action-link action-link--wa"
                        href={`https://wa.me/${waNumber(req.mobile)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaWhatsapp /> WhatsApp
                      </a>
                      <button
                        type="button"
                        className="action-link action-link--primary"
                        onClick={() =>
                          navigate("/customers/new", {
                            state: {
                              joinRequest: {
                                id: req._id,
                                name: req.name,
                                mobile: req.mobile,
                                location: req.location,
                                category: req.category,
                              },
                            },
                          })
                        }
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDelete(req._id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewJoinRequests;
