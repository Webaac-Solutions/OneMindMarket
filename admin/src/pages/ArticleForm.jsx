import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { createArticle, updateArticle } from "../services/adminService";
import { BASE_URL } from "../api";
import { useToast } from "../components/Toast";
import { prepareImages } from "../utils/imageUtils";
import { useConfirm } from "../components/ConfirmDialog";
import useUnsavedChanges from "../hooks/useUnsavedChanges";
import Loader from "../components/Loader";
import "./Admin.css";
import "./ArticleForm.css";

const SERVER_URL = BASE_URL.replace("/api", "");
const UPLOADS_URL = `${SERVER_URL}/uploads`;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    [{ align: [] }],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "code-block",
  "link",
  "image",
  "align",
];

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const toast = useToast();
  const confirm = useConfirm();
  const { dirty, markDirty } = useUnsavedChanges();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("Admin");
  const [featuredImage, setFeaturedImage] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [removeFeaturedImage, setRemoveFeaturedImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      const fetchArticle = async () => {
        try {
          const res = await fetch(`${BASE_URL}/articles/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          });
          const data = await res.json();
          setTitle(data.title || "");
          setExcerpt(data.excerpt || "");
          setContent(data.content || "");
          setStatus(data.status || "draft");
          setTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
          setAuthor(data.author || "Admin");
          setExistingImage(data.featuredImage || "");
          setRemoveFeaturedImage(false);
        } catch (err) {
          console.error(err);
          toast.error("Failed to load article");
        } finally {
          setLoadingArticle(false);
        }
      };
      fetchArticle();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!content.trim()) return toast.error("Content is required");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("excerpt", excerpt);
      formData.append("content", content);
      formData.append("status", status);
      formData.append("tags", tags);
      formData.append("author", author);
      if (featuredImage) formData.append("featuredImage", featuredImage);
      if (isEdit && removeFeaturedImage && !featuredImage) {
        formData.append("removeFeaturedImage", "true");
      }

      if (isEdit) {
        await updateArticle(id, formData);
        toast.success("Article updated");
      } else {
        await createArticle(formData);
        toast.success("Article created");
      }
      navigate("/articles");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const getPreviewImageSrc = () => {
    if (featuredImage) return URL.createObjectURL(featuredImage);
    if (existingImage) return `${UPLOADS_URL}/${existingImage}`;
    return null;
  };

  return (
    <div className="admin-page">
      <h2 className="admin-title">
        {isEdit ? "Edit Article" : "Create Article"}
      </h2>

      {loadingArticle ? (
        <Loader label="Loading article..." />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="admin-form article-form"
          onChange={markDirty}
        >
          <label>Title *</label>
          <input
            className="admin-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            required
          />

          <label>Excerpt</label>
          <textarea
            className="admin-input"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary for cards & SEO (under 160 chars recommended)"
            rows={3}
            style={{ resize: "vertical" }}
          />

          <label>Content *</label>
          <div className="article-editor-wrapper">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={(value, _delta, source) => {
                setContent(value);
                if (source === "user") markDirty();
              }}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Write your article content here..."
            />
          </div>

          <label>Status</label>
          <select
            className="admin-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <label>Tags (comma-separated)</label>
          <input
            className="admin-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. business, tips, local"
          />

          <label>Author</label>
          <input
            className="admin-input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author name"
          />

          <label>Featured Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const input = e.target;
              const [file] = await prepareImages(
                Array.from(input.files || []),
                toast.error,
              );
              if (!file) input.value = "";
              setFeaturedImage(file || null);
            }}
            className="admin-input"
          />
          {existingImage && !featuredImage && !removeFeaturedImage && (
            <div
              style={{
                position: "relative",
                display: "inline-block",
                alignSelf: "flex-start",
                marginTop: 8,
              }}
            >
              <img
                src={`${UPLOADS_URL}/${existingImage}`}
                alt={`${title || "Article"} - Featured image`}
                style={{
                  width: 120,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />
              <button
                type="button"
                onClick={() => setRemoveFeaturedImage(true)}
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
                title="Delete this image"
              >
                X
              </button>
            </div>
          )}
          {removeFeaturedImage && !featuredImage && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#990a0a" }}>
              Image will be removed on save.{" "}
              <button
                type="button"
                onClick={() => setRemoveFeaturedImage(false)}
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

          <div
            className="form-actions-row"
            style={{ marginTop: 20, display: "flex", gap: 10 }}
          >
            <button type="submit" className="admin-btn" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update Article"
                  : "Create Article"}
            </button>
            <button
              type="button"
              className="admin-btn"
              style={{ backgroundColor: "#28a745" }}
              onClick={() => setShowPreview(true)}
            >
              Preview
            </button>
            <button
              type="button"
              className="admin-btn"
              style={{ backgroundColor: "#6c757d" }}
              onClick={async () => {
                if (dirty && !(await confirm("Discard unsaved changes?")))
                  return;
                navigate("/articles");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="preview-close"
              onClick={() => setShowPreview(false)}
            >
              &times;
            </button>
            <div className="preview-body">
              {getPreviewImageSrc() && (
                <img
                  src={getPreviewImageSrc()}
                  alt={title}
                  className="preview-image"
                />
              )}
              <h1 className="preview-title">{title || "Untitled"}</h1>
              {tags && (
                <div className="preview-tags">
                  {tags.split(",").map(
                    (t, i) =>
                      t.trim() && (
                        <span key={i} className="preview-tag">
                          {t.trim()}
                        </span>
                      ),
                  )}
                </div>
              )}
              <div
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleForm;
