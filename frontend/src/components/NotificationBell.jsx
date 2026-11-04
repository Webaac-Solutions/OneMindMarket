"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import OneSignal from "react-onesignal";
import { FiBell } from "react-icons/fi";
import {
  initOneSignal,
  enablePush,
  disablePush,
  onPushChange,
} from "@/components/PushPrompt";
import { BASE_URL, UPLOADS_URL } from "@/lib/api";
import "@/styles/Notifications.css";

const SEEN_KEY = "omm_notifs_seen";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 8;

const timeAgo = (date) => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

// Site paths use next/link, full URLs open in a new tab
const ItemLink = ({ url, onClick, children }) => {
  if (!url) return <div className="notif-item">{children}</div>;
  if (url.startsWith("/"))
    return (
      <Link href={url} className="notif-item" onClick={onClick}>
        {children}
      </Link>
    );
  return (
    <a
      href={url}
      className="notif-item"
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
    >
      {children}
    </a>
  );
};

const NotificationBell = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  // New visitors only see a badge for announcements from the last 7 days
  const [seen, setSeen] = useState(() => Date.now() - WEEK_MS);
  const [push, setPush] = useState({
    ready: false,
    on: false,
    blocked: false,
    error: false,
    brave: false,
  });
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const ref = useRef(null);
  // Cutoff captured when the menu opens so "New" tags survive the mark-as-read
  const newAfter = useRef(0);

  const load = () =>
    fetch(`${BASE_URL}/announcements?limit=${PAGE_SIZE}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list);
        setHasMore(list.length === PAGE_SIZE);
      })
      .catch(() => {});

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await fetch(
        `${BASE_URL}/announcements?limit=${PAGE_SIZE}&skip=${items.length}`,
      );
      const data = r.ok ? await r.json() : [];
      const list = Array.isArray(data) ? data : [];
      setItems((prev) => [
        ...prev,
        ...list.filter((n) => !prev.some((p) => p._id === n._id)),
      ]);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(SEEN_KEY));
      if (stored) setSeen(stored);
    } catch {}
    load();

    const stream = new EventSource(`${BASE_URL}/announcements/stream`);
    let firstOpen = true;
    stream.onopen = () => {
      if (firstOpen) firstOpen = false;
      else load();
    };
    stream.addEventListener("announcement", (e) => {
      const item = JSON.parse(e.data);
      setItems((prev) => [item, ...prev.filter((n) => n._id !== item._id)]);
    });
    stream.addEventListener("removed", (e) => {
      const { id } = JSON.parse(e.data);
      setItems((prev) => prev.filter((n) => n._id !== id));
    });
    return () => stream.close();
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;
    let active = true;
    try {
      setPush((p) => ({
        ...p,
        ready: true,
        blocked: Notification.permission === "denied",
      }));
    } catch {
      setPush((p) => ({ ...p, ready: true }));
    }
    if (navigator.brave && typeof navigator.brave.isBrave === "function") {
      navigator.brave
        .isBrave()
        .then((yes) => active && setPush((p) => ({ ...p, brave: !!yes })))
        .catch(() => {});
    }
    const sync = () => {
      if (!active) return;
      try {
        setPush((p) => ({
          ...p,
          ready: true,
          on: OneSignal.User.PushSubscription.optedIn === true,
          blocked: Notification.permission === "denied",
        }));
      } catch {}
    };

    initOneSignal()
      .then(() => {
        if (!active || !OneSignal.Notifications.isPushSupported()) return;
        sync();
        OneSignal.User.PushSubscription.addEventListener("change", sync);
      })
      .catch(() => {});

    const off = onPushChange(sync);

    return () => {
      active = false;
      off();
      try {
        OneSignal.User.PushSubscription.removeEventListener("change", sync);
      } catch {}
    };
  }, []);

  const togglePush = async () => {
    setPush((p) => ({ ...p, error: false }));
    try {
      if (push.on) await disablePush();
      else await enablePush();
    } catch (err) {
      console.error("Push toggle failed:", err);
      setPush((p) => ({ ...p, error: true }));
    }
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter(
    (n) => new Date(n.createdAt).getTime() > seen,
  ).length;

  const toggle = () => {
    if (!open) newAfter.current = seen;
    setOpen((v) => !v);
    // Opening the menu marks everything as read
    if (items.length) {
      const latest = new Date(items[0].createdAt).getTime();
      setSeen(latest);
      try {
        localStorage.setItem(SEEN_KEY, String(latest));
      } catch {}
    }
  };

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="notif-btn"
        onClick={toggle}
        aria-label={unread ? `Announcements, ${unread} new` : "Announcements"}
        aria-expanded={open}
      >
        <FiBell size={18} />
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Announcements">
          <div className="notif-head">
            <span>Announcements</span>
            {push.ready && (
              <label
                className="notif-toggle"
                title={
                  push.blocked
                    ? "Notifications are blocked in your browser settings"
                    : "Get push notifications"
                }
              >
                <span>Push</span>
                <input
                  type="checkbox"
                  checked={push.on}
                  disabled={push.blocked}
                  onChange={togglePush}
                />
                <i />
              </label>
            )}
          </div>
          {items.length === 0 ? (
            <p className="notif-empty">No announcements yet</p>
          ) : (
            <div className="notif-list">
              {items.map((n) => (
                <ItemLink
                  key={n._id}
                  url={n.url}
                  onClick={() => setOpen(false)}
                >
                  <div className="notif-body">
                    <strong>
                      {new Date(n.createdAt).getTime() > newAfter.current && (
                        <i className="notif-dot" aria-label="New" />
                      )}
                      {n.title}
                    </strong>
                    <span>{n.message}</span>
                    <time>{timeAgo(n.createdAt)}</time>
                  </div>
                  {n.image && (
                    <img
                      className="notif-thumb"
                      src={`${UPLOADS_URL}/${n.image}`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                </ItemLink>
              ))}
              {hasMore && (
                <button
                  type="button"
                  className="notif-more"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Show earlier"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
