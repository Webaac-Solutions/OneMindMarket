import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  getGalleryItems,
  deleteGalleryItem as apiDeleteGalleryItem,
  reorderGalleryItems,
} from "../services/adminService";
import { BASE_URL } from "../api";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import ZoomImg from "../components/ZoomImg";
import "./Admin.css";

const SERVER_URL = BASE_URL.replace("/api", "");
const UPLOADS_URL = `${SERVER_URL}/uploads`;

const ManageGallery = () => {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const loadItems = async () => {
    try {
      const data = await getGalleryItems();
      setItems(data);
    } catch (err) {
      toast.error("Failed to load gallery items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleDelete = async (id) => {
    const ok = await confirm(
      "Are you sure you want to delete this gallery item?",
    );
    if (!ok) return;
    try {
      await apiDeleteGalleryItem(id);
      toast.success("Gallery item deleted");
      loadItems();
    } catch (err) {
      toast.error("Error deleting gallery item");
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered);

    const orderPayload = reordered.map((item, index) => ({
      id: item._id,
      sortOrder: index,
    }));

    setSaving(true);
    try {
      await reorderGalleryItems(orderPayload);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save order");
      loadItems();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <h2 className="admin-title">Manage Gallery</h2>

      <button
        className="admin-btn"
        style={{ marginBottom: 20 }}
        onClick={() => navigate("/gallery/new")}
      >
        Add Gallery Item
      </button>

      {saving && (
        <p style={{ color: "#6366f1", marginBottom: 10 }}>Saving order...</p>
      )}

      {loading ? (
        <Loader label="Loading gallery items..." />
      ) : (
        <div className="admin-table-card">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="gallery-list">
              {(provided) => (
                <table
                  className="admin-table"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th style={{ width: 40 }}></th>
                      <th style={{ width: 80 }}>Image</th>
                      <th>Title</th>
                      <th style={{ width: 80 }}>Visible</th>
                      <th>Tags</th>
                      <th style={{ width: 160 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          style={{ textAlign: "center", padding: 20 }}
                        >
                          No gallery items yet
                        </td>
                      </tr>
                    ) : (
                      items.map((item, i) => (
                        <Draggable
                          key={item._id}
                          draggableId={item._id}
                          index={i}
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                background: snapshot.isDragging
                                  ? "#f0f0ff"
                                  : undefined,
                              }}
                            >
                              <td>{i + 1}</td>
                              <td
                                {...provided.dragHandleProps}
                                style={{
                                  cursor: "grab",
                                  textAlign: "center",
                                  fontSize: 18,
                                }}
                              >
                                &#9776;
                              </td>
                              <td>
                                {(() => {
                                  const media =
                                    item.media && item.media.length > 0
                                      ? item.media
                                      : (item.images || []).map((img) => ({
                                          type: "image",
                                          url: img,
                                        }));
                                  const firstImage = media.find(
                                    (m) => m.type === "image",
                                  );
                                  if (firstImage) {
                                    return (
                                      <ZoomImg
                                        src={`${UPLOADS_URL}/${firstImage.url}`}
                                        alt={item.title}
                                        style={{
                                          width: 60,
                                          height: 40,
                                          objectFit: "cover",
                                          borderRadius: 4,
                                        }}
                                      />
                                    );
                                  }
                                  const firstYt = media.find(
                                    (m) => m.type === "youtube",
                                  );
                                  if (firstYt) {
                                    const match = firstYt.url.match(
                                      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
                                    );
                                    if (match) {
                                      return (
                                        <ZoomImg
                                          src={`https://img.youtube.com/vi/${match[1]}/default.jpg`}
                                          alt={item.title}
                                          style={{
                                            width: 60,
                                            height: 40,
                                            objectFit: "cover",
                                            borderRadius: 4,
                                          }}
                                        />
                                      );
                                    }
                                  }
                                  if (media.find((m) => m.type === "video")) {
                                    return (
                                      <span style={{ fontSize: 20 }}>
                                        &#9654;
                                      </span>
                                    );
                                  }
                                  return (
                                    <span
                                      style={{ color: "#999", fontSize: 12 }}
                                    >
                                      No media
                                    </span>
                                  );
                                })()}
                              </td>
                              <td>{item.title}</td>
                              <td>
                                <span
                                  style={{
                                    padding: "3px 10px",
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: item.visible
                                      ? "#d4edda"
                                      : "#fff3cd",
                                    color: item.visible ? "#155724" : "#856404",
                                  }}
                                >
                                  {item.visible ? "Visible" : "Hidden"}
                                </span>
                              </td>
                              <td>{(item.tags || []).join(", ")}</td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    justifyContent: "center",
                                  }}
                                >
                                  <button
                                    className="edit-btn"
                                    onClick={() =>
                                      navigate(`/gallery/edit/${item._id}`)
                                    }
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(item._id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </tbody>
                </table>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
};

export default ManageGallery;
