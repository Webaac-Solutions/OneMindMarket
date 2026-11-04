"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiBell,
  FiExternalLink,
  FiLink,
  FiSearch,
  FiX,
} from "react-icons/fi";

const DAY = 24 * 60 * 60 * 1000;
const TZ = "Asia/Kolkata";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: TZ,
  });

const monthLabel = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    timeZone: TZ,
  });

const isExternal = (url) => /^https?:\/\//i.test(url || "");

function SmartLink({ url, className, children, onClick }) {
  if (isExternal(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={url} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export default function AnnouncementsClient({ items = [], uploadsUrl }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(null);
  const [now, setNow] = useState(null);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const open = useCallback((item) => {
    setActive(item);
    try {
      window.history.replaceState(null, "", `#a-${item._id}`);
    } catch {}
  }, []);

  const close = useCallback(() => {
    setActive(null);
    setCopied(false);
    try {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    } catch {}
  }, []);

  useEffect(() => {
    const m = window.location.hash.match(/^#a-(.+)$/);
    if (!m) return;
    const found = items.find((n) => n._id === m[1]);
    if (found) setActive(found);
  }, [items]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active, close]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/announcements#a-${active._id}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((n) => {
      if (now && filter !== "all") {
        const age = now - new Date(n.createdAt).getTime();
        if (filter === "week" && age > 7 * DAY) return false;
        if (filter === "month" && age > 30 * DAY) return false;
      }
      if (!q) return true;
      return (
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter, now]);

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((n) => {
      const key = monthLabel(n.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    });
    return [...map.entries()];
  }, [filtered]);

  const isNew = (n) =>
    now !== null && now - new Date(n.createdAt).getTime() < 7 * DAY;

  const onCardKey = (e, n) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open(n);
    }
  };

  if (items.length === 0) {
    return (
      <div className="an-empty">
        <span className="an-empty-icon">
          <FiBell size={28} />
        </span>
        <h2>Nothing here yet</h2>
        <p>
          New announcements from OneMind Market will show up here. Check back
          soon.
        </p>
      </div>
    );
  }

  return (
    <div className="an-wrap">
      <div className="an-toolbar">
        <div className="an-search">
          <FiSearch size={17} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements"
            aria-label="Search announcements"
          />
          {query && (
            <button
              type="button"
              className="an-search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
        <div className="an-filters" role="group" aria-label="Filter by date">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              className={`an-chip ${filter === f.id ? "an-chip--active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="an-count" aria-live="polite">
        {filtered.length}{" "}
        {filtered.length === 1 ? "announcement" : "announcements"}
      </p>

      {groups.map(([month, list]) => (
        <section key={month} className="an-group">
          <h2 className="an-group-title">{month}</h2>
          <div className="an-list">
            {list.map((n) => (
              <article
                key={n._id}
                className={`an-item${n.image ? " an-item--media" : ""}`}
                onClick={() => open(n)}
                role="button"
                tabIndex={0}
                aria-label={`Read announcement: ${n.title}`}
                onKeyDown={(e) => onCardKey(e, n)}
              >
                {n.image && (
                  <div className="an-thumb">
                    <img
                      src={`${uploadsUrl}/${n.image}`}
                      alt={n.title}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="an-body">
                  <div className="an-meta">
                    {isNew(n) && <span className="an-badge">New</span>}
                    <time dateTime={new Date(n.createdAt).toISOString()}>
                      {fmtDate(n.createdAt)}
                    </time>
                  </div>
                  <h3>{n.title}</h3>
                  <p>{n.message}</p>
                  <span className="an-readmore">
                    Read full announcement <FiArrowRight size={14} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="an-empty an-empty--small">
          <h2>No matching announcements</h2>
          <p>Try a different search or date filter.</p>
          <button
            type="button"
            className="an-clear-btn"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {active && (
        <div className="an-modal" onClick={close}>
          <div
            className="an-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              className="an-modal-close"
              onClick={close}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
            {active.image && (
              <div className="an-modal-media">
                <img src={`${uploadsUrl}/${active.image}`} alt={active.title} />
              </div>
            )}
            <div className="an-modal-body">
              <div className="an-meta">
                {isNew(active) && <span className="an-badge">New</span>}
                <time dateTime={new Date(active.createdAt).toISOString()}>
                  {fmtDate(active.createdAt)}
                </time>
              </div>
              <h2>{active.title}</h2>
              <p>{active.message}</p>
              <div className="an-modal-actions">
                {active.url && (
                  <SmartLink url={active.url} className="an-btn-primary">
                    {isExternal(active.url)
                      ? "Visit website"
                      : "Open announcement page"}
                    {isExternal(active.url) ? (
                      <FiExternalLink size={15} />
                    ) : (
                      <FiArrowRight size={15} />
                    )}
                  </SmartLink>
                )}
                <button
                  type="button"
                  className="an-btn-ghost"
                  onClick={copyLink}
                >
                  <FiLink size={14} />
                  {copied ? "Link copied" : "Copy link"}
                </button>
                <button type="button" className="an-btn-ghost" onClick={close}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
