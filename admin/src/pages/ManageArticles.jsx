import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getArticles,
  deleteArticle as apiDeleteArticle,
} from "../services/adminService";
import { BASE_URL } from "../api";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import ZoomImg from "../components/ZoomImg";
import "./Admin.css";

const SERVER_URL = BASE_URL.replace("/api", "");
const UPLOADS_URL = `${SERVER_URL}/uploads`;

const ManageArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const loadArticles = async () => {
    try {
      const data = await getArticles();
      setArticles(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async (id) => {
    const ok = await confirm("Are you sure you want to delete this article?");
    if (!ok) return;
    try {
      await apiDeleteArticle(id);
      toast.success("Article deleted");
      loadArticles();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting article");
    }
  };

  return (
    <div className="admin-page">
      <h2 className="admin-title">Manage Articles</h2>

      <button
        className="admin-btn"
        style={{ marginBottom: 20 }}
        onClick={() => navigate("/articles/new")}
      >
        Create New Article
      </button>

      {loading ? (
        <Loader label="Loading articles..." />
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Status</th>
                <th>Image</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                    No articles available
                  </td>
                </tr>
              ) : (
                articles.map((a, i) => (
                  <tr key={a._id}>
                    <td>{i + 1}</td>
                    <td>{a.title}</td>
                    <td>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            a.status === "published" ? "#d4edda" : "#fff3cd",
                          color:
                            a.status === "published" ? "#155724" : "#856404",
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {a.featuredImage ? (
                        <ZoomImg
                          src={`${UPLOADS_URL}/${a.featuredImage}`}
                          alt={a.title}
                          style={{
                            width: 60,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => navigate(`/articles/edit/${a._id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(a._id)}
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
    </div>
  );
};

export default ManageArticles;
