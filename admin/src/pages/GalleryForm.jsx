import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createGalleryItem, updateGalleryItem } from "../services/adminService";
import { BASE_URL } from "../api";
import { useToast } from "../components/Toast";
import { prepareImages } from "../utils/imageUtils";
import { useConfirm } from "../components/ConfirmDialog";
import useUnsavedChanges from "../hooks/useUnsavedChanges";
import Loader from "../components/Loader";
import "./Admin.css";

const SERVER_URL = BASE_URL.replace("/api", "");
const UPLOADS_URL = `${SERVER_URL}/uploads`;

function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

const GalleryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const toast = useToast();
  const confirm = useConfirm();
  const { dirty, markDirty } = useUnsavedChanges();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [website, setWebsite] = useState("");
  const [tags, setTags] = useState("");
  const [visible, setVisible] = useState(true);
  const [existingMedia, setExistingMedia] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newVideoFiles, setNewVideoFiles] = useState([]);
  const [youtubeLinks, setYoutubeLinks] = useState([]);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingItem, setLoadingItem] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      const fetchItem = async () => {
        try {
          const res = await fetch(`${BASE_URL}/gallery/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          });
          const data = await res.json();
          setTitle(data.title || "");
          setCaption(data.caption || "");
          setWebsite(data.website || "");
          setTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
          setVisible(data.visible !== false);

          // Use media[] if available, otherwise fall back to images[]
          if (data.media && data.media.length > 0) {
            const uploaded = data.media.filter(
              (m) => m.type === "image" || m.type === "video",
            );
            const yt = data.media
              .filter((m) => m.type === "youtube")
              .map((m) => m.url);
            setExistingMedia(uploaded);
            setYoutubeLinks(yt);
          } else {
            const imgs = data.images || (data.image ? [data.image] : []);
            setExistingMedia(imgs.map((img) => ({ type: "image", url: img })));
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load gallery item");
        } finally {
          setLoadingItem(false);
        }
      };
      fetchItem();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");

    const totalMedia =
      existingMedia.length +
      newImageFiles.length +
      newVideoFiles.length +
      youtubeLinks.length;
    if (!isEdit && totalMedia === 0)
      return toast.error("At least one media item is required");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("caption", caption);
      formData.append("website", website);
      formData.append("tags", tags);
      formData.append("visible", visible);

      if (isEdit) {
        formData.append("existingMedia", JSON.stringify(existingMedia));
      }

      newImageFiles.forEach((file) => formData.append("images", file));
      newVideoFiles.forEach((file) => formData.append("videos", file));

      if (youtubeLinks.length > 0) {
        formData.append("youtubeLinks", JSON.stringify(youtubeLinks));
      }

      if (isEdit) {
        await updateGalleryItem(id, formData);
        toast.success("Gallery item updated");
      } else {
        await createGalleryItem(formData);
        toast.success("Gallery item created");
      }
      navigate("/gallery");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const removeExistingMedia = (idx) => {
    setExistingMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNewImageFile = (idx) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNewVideoFile = (idx) => {
    setNewVideoFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeYoutubeLink = (idx) => {
    setYoutubeLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const addYoutubeLink = () => {
    const url = youtubeInput.trim();
    if (!url) return;
    if (!extractYoutubeId(url)) {
      return toast.error(
        "Invalid YouTube URL. Please use a valid YouTube link.",
      );
    }
    setYoutubeLinks((prev) => [...prev, url]);
    setYoutubeInput("");
  };

  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  return (
    <div className="admin-page">
      <h2 className="admin-title">
        {isEdit ? "Edit Gallery Item" : "Add Gallery Item"}
      </h2>

      <div className="admin-form-card">
        {loadingItem ? (
          <Loader label="Loading gallery item..." />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="admin-form"
            onChange={markDirty}
          >
            <label>Title *</label>
            <input
              className="admin-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gallery item title"
              required
            />

            <label>Caption / Description</label>
            <textarea
              className="admin-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption or description"
              rows={3}
              style={{ resize: "vertical" }}
            />

            <label>Live Website URL</label>
            <input
              className="admin-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. https://example.com"
            />

            <label>Tags (comma-separated)</label>
            <input
              className="admin-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. food, restaurant, interior"
            />

            <label>Visible</label>
            <select
              className="admin-input"
              value={visible ? "true" : "false"}
              onChange={(e) => setVisible(e.target.value === "true")}
            >
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>

            {/* Images upload */}
            <label>Images (max 10)</label>
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
                const selectedFiles = await prepareImages(picked, toast.error);
                if (selectedFiles.length === 0) return;
                setNewImageFiles((prev) => {
                  const combined = [...prev, ...selectedFiles];
                  if (combined.length > 10) {
                    toast.error(
                      "Maximum 10 images allowed. Only the first 10 will be kept.",
                    );
                    return combined.slice(0, 10);
                  }
                  return combined;
                });
              }}
            />
            {newImageFiles.length > 0 && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>
                {newImageFiles.length} image(s) selected
              </p>
            )}

            {/* Videos upload */}
            <label>Videos (max 5, up to 100MB each)</label>
            <input
              type="file"
              className="admin-input"
              accept="video/mp4,video/webm,video/quicktime"
              multiple
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                e.target.value = "";
                if (selectedFiles.length === 0) return;
                const valid = selectedFiles.filter((f) => {
                  if (f.size > MAX_VIDEO_SIZE) {
                    toast.error(
                      `"${f.name}" exceeds 100MB limit and was skipped.`,
                    );
                    return false;
                  }
                  return true;
                });
                setNewVideoFiles((prev) => {
                  const combined = [...prev, ...valid];
                  if (combined.length > 5) {
                    toast.error(
                      "Maximum 5 videos allowed. Only the first 5 will be kept.",
                    );
                    return combined.slice(0, 5);
                  }
                  return combined;
                });
              }}
            />
            {newVideoFiles.length > 0 && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>
                {newVideoFiles.length} video(s) selected
              </p>
            )}

            {/* YouTube links */}
            <label>YouTube Videos</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="admin-input"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="Paste YouTube URL and click Add"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addYoutubeLink();
                  }
                }}
              />
              <button
                type="button"
                className="admin-btn"
                onClick={addYoutubeLink}
                style={{ whiteSpace: "nowrap" }}
              >
                Add
              </button>
            </div>

            {/* YouTube link previews */}
            {youtubeLinks.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                {youtubeLinks.map((url, idx) => {
                  const ytId = extractYoutubeId(url);
                  return (
                    <div
                      key={idx}
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                        alt={`YouTube ${idx + 1}`}
                        style={{
                          width: 120,
                          height: 70,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          color: "#fff",
                          fontSize: 24,
                          pointerEvents: "none",
                          textShadow: "0 0 6px rgba(0,0,0,0.7)",
                        }}
                      >
                        &#9654;
                      </div>
                      <button
                        type="button"
                        onClick={() => removeYoutubeLink(idx)}
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
                  );
                })}
              </div>
            )}

            {/* Existing media preview (images + videos from server) */}
            {existingMedia.length > 0 && (
              <>
                <label style={{ marginTop: 12 }}>Existing Media</label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  {existingMedia.map((item, idx) => (
                    <div
                      key={idx}
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      {item.type === "video" ? (
                        <div
                          style={{
                            width: 100,
                            height: 70,
                            background: "#222",
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 28,
                          }}
                        >
                          &#9654;
                        </div>
                      ) : (
                        <img
                          src={`${UPLOADS_URL}/${item.url}`}
                          alt={`${title || "Gallery"} - ${idx + 1}`}
                          style={{
                            width: 100,
                            height: 70,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(idx)}
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
              </>
            )}

            {/* New image file previews */}
            {newImageFiles.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                {newImageFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`${title || "Gallery"} - New image ${idx + 1}`}
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
                      onClick={() => removeNewImageFile(idx)}
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

            {/* New video file previews */}
            {newVideoFiles.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                {newVideoFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <div
                      style={{
                        width: 100,
                        height: 70,
                        background: "#222",
                        borderRadius: 6,
                        border: "2px solid #6366f1",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 11,
                        padding: 4,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>&#9654;</span>
                      <span
                        style={{
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "90%",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewVideoFile(idx)}
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

            <div
              className="form-actions-row"
              style={{ marginTop: 20, display: "flex", gap: 10 }}
            >
              <button type="submit" className="admin-btn" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : isEdit
                    ? "Update Item"
                    : "Create Item"}
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{ backgroundColor: "#6c757d" }}
                onClick={async () => {
                  if (dirty && !(await confirm("Discard unsaved changes?")))
                    return;
                  navigate("/gallery");
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

export default GalleryForm;
