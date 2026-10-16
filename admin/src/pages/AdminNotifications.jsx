import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FiBell,
  FiImage,
  FiLink,
  FiSearch,
  FiSend,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  getAnnouncements,
  getSubscriberCount,
  createAnnouncement,
  deleteAnnouncement,
} from "../services/adminService";
import { prepareImage } from "../utils/imageUtils";
import { BASE_URL } from "../api";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import "./Admin.css";
import "./AdminNotifications.css";

const TITLE_MAX = 65;
const MESSAGE_MAX = 240;
const PAGE_SIZE = 10;
const UPLOADS_URL = `${BASE_URL.replace(/\/api\/?$/, "")}/uploads`;
const EMPTY_FORM = { title: "", message: "", url: "" };

const formatDate = (d) =>
  new Date(d).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const AdminNotifications = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sendPush, setSendPush] = useState(true);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [subscribers, setSubscribers] = useState(null);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const fileRef = useRef(null);
  const requestId = useRef(0);
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const confirm = useConfirm();

  const fetchPage = useCallback(async (q, skip) => {
    const id = ++requestId.current;
    try {
      const data = await getAnnouncements({ skip, limit: PAGE_SIZE, q });
      if (id !== requestId.current) return;
      const list = Array.isArray(data) ? data : [];
      setItems((prev) => (skip === 0 ? list : [...prev, ...list]));
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      if (id === requestId.current)
        toastRef.current.error("Failed to load announcements");
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPage(query.trim(), 0), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [query, fetchPage]);

  useEffect(() => {
    getSubscriberCount()
      .then((d) =>
        setSubscribers(typeof d?.count === "number" ? d.count : null),
      )
      .catch(() => setSubscribers(null));
  }, []);

  useEffect(() => {
    if (!image) return setImagePreview("");
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setImage(await prepareImage(file));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const loadMore = () => {
    setLoadingMore(true);
    fetchPage(query.trim(), items.length);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim())
      return toast.error("Title and message are required");

    const ok = await confirm(
      sendPush
        ? "Send this announcement to all subscribers now?"
        : "Publish this announcement to the website bell menu?",
      sendPush ? "Send" : "Publish",
    );
    if (!ok) return;

    setSending(true);
    try {
      const { push } = await createAnnouncement({ ...form, image, sendPush });
      if (!sendPush) toast.success("Announcement published");
      else if (push?.sent)
        toast.success("Announcement published and push sent");
      else
        toast.info(
          `Published, but push not sent: ${push?.reason || "unknown error"}`,
          6000,
        );
      setForm(EMPTY_FORM);
      setImage(null);
      if (query) setQuery("");
      else fetchPage("", 0);
    } catch (err) {
      toast.error(err.message || "Failed to send announcement");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    const ok = await confirm(
      "Remove this from the website? Pushes already delivered can't be recalled.",
    );
    if (!ok) return;
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement removed");
      setItems((prev) => prev.filter((n) => n._id !== id));
      fetchPage(query.trim(), 0);
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const pushBadge = (status) => {
    if (status === "sent")
      return (
        <span className="status-badge status-badge--active">Push sent</span>
      );
    if (status === "failed")
      return (
        <span className="status-badge status-badge--inactive">Push failed</span>
      );
    return <span className="status-badge notif-badge-muted">Bell only</span>;
  };

  return (
    <div className="admin-page">
      <h3 className="table-title">Send Announcement</h3>

      <div className="notif-layout">
        <div className="notif-card">
          <form className="admin-form notif-form" onSubmit={submit}>
            <div className="admin-form-group">
              <label className="admin-label">Title</label>
              <input
                className="admin-input"
                value={form.title}
                onChange={setField("title")}
                maxLength={TITLE_MAX}
                placeholder="e.g. Diwali offers are live"
              />
              <small className="notif-counter">
                {form.title.length}/{TITLE_MAX}
              </small>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Message</label>
              <textarea
                className="admin-textarea"
                rows={4}
                value={form.message}
                onChange={setField("message")}
                maxLength={MESSAGE_MAX}
                placeholder="Short message shown in the notification"
              />
              <small className="notif-counter">
                {form.message.length}/{MESSAGE_MAX}
              </small>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Link (optional)</label>
              <input
                className="admin-input"
                value={form.url}
                onChange={setField("url")}
                placeholder="/articles or https://..."
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Image (optional)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={pickImage}
                hidden
              />
              {imagePreview ? (
                <div className="notif-upload-preview">
                  <img src={imagePreview} alt="Selected" />
                  <button
                    type="button"
                    className="notif-upload-remove"
                    onClick={() => setImage(null)}
                    aria-label="Remove image"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="notif-upload"
                  onClick={() => fileRef.current?.click()}
                >
                  <FiImage size={20} />
                  <span>Click to add an image</span>
                  <small>
                    Best at 2:1, like 1024x512.
                  </small>
                </button>
              )}
            </div>

            <label className="notif-check">
              <input
                type="checkbox"
                checked={sendPush}
                onChange={(e) => setSendPush(e.target.checked)}
              />
              Also send as push notification
            </label>

            {sendPush && subscribers !== null && (
              <div
                className={`notif-reach ${subscribers === 0 ? "notif-reach--empty" : ""}`}
              >
                <FiUsers size={15} />
                {subscribers === 0
                  ? "No devices are subscribed yet"
                  : `Reaches about ${subscribers.toLocaleString("en-IN")} ${subscribers === 1 ? "device" : "devices"}`}
              </div>
            )}

            <button
              type="submit"
              className="admin-btn notif-send"
              disabled={sending}
            >
              <FiSend size={15} />
              {sending ? "Sending..." : "Send Announcement"}
            </button>
          </form>
        </div>

        <aside className="notif-preview">
          <span className="notif-preview-label">Push preview</span>
          <div className="notif-mock">
            <div className="notif-mock-top">
              <span className="notif-mock-icon">
                <FiBell size={12} />
              </span>
              <span>OneMind Market</span>
              <span className="notif-mock-now">now</span>
            </div>
            <strong>{form.title || "Your title appears here"}</strong>
            <p>{form.message || "Your message appears here"}</p>
            {imagePreview && (
              <img className="notif-mock-image" src={imagePreview} alt="" />
            )}
            {form.url && (
              <span className="notif-mock-link">
                <FiLink size={11} />
                {form.url}
              </span>
            )}
          </div>

          <span className="notif-preview-label">Bell menu preview</span>
          <div className="notif-mock notif-mock--row">
            <div className="notif-mock-text">
              <strong>{form.title || "Your title appears here"}</strong>
              <p>{form.message || "Your message appears here"}</p>
              <small>Just now</small>
            </div>
            {imagePreview && (
              <img className="notif-mock-thumb" src={imagePreview} alt="" />
            )}
          </div>
        </aside>
      </div>

      <div className="notif-history-head">
        <h3 className="table-title notif-history-title">Sent Announcements</h3>
        <div className="notif-search">
          <FiSearch size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loader label="Loading announcements..." />
      ) : items.length === 0 ? (
        <div className="notif-empty-state">
          {query
            ? "No announcements match your search"
            : "No announcements yet"}
        </div>
      ) : (
        <div className="notif-history">
          {items.map((n) => (
            <div className="notif-row" key={n._id}>
              {n.image ? (
                <img
                  className="notif-row-thumb"
                  src={`${UPLOADS_URL}/${n.image}`}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <span className="notif-row-thumb notif-row-thumb--empty">
                  <FiBell size={18} />
                </span>
              )}
              <div className="notif-row-body">
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <div className="notif-row-meta">
                  {pushBadge(n.pushStatus)}
                  <span>{formatDate(n.createdAt)}</span>
                  {n.url && (
                    <span className="notif-row-link">
                      <FiLink size={11} />
                      {n.url}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="notif-row-delete"
                onClick={() => remove(n._id)}
                aria-label="Delete announcement"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
          {hasMore && (
            <button
              type="button"
              className="notif-load-more"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
