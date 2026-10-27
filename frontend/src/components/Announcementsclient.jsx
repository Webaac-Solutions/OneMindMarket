"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiBell,
  FiCalendar,
  FiExternalLink,
  FiSearch,
  FiX,
} from "react-icons/fi";

const DAY = 24 * 60 * 60 * 1000;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const monthLabel = (d) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long" });

const isExternal = (url) => /^https?:\/\//i.test(url || "");

// Internal links use next/link, external ones open in a new tab
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

function Cover({ item, uploadsUrl, className }) {
  if (item.image) {
    return (
      <div className={`an-cover ${className || ""}`}>
        <img src={`${uploadsUrl}/${item.image}`} alt="" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`an-cover an-cover--art ${className || ""}`} aria-hidden>
      <FiBell size={34} />
    </div>
  );
}

export default function AnnouncementsClient({ items = [], uploadsUrl }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(null);
  const closeRef = useRef(null);

  const open = useCallback((item) => {
    setActive(item);
    try {
      window.history.replaceState(null, "", `#a-${item._id}`);
    } catch {}
  }, []);

  const close = useCallback(() => {
    setActive(null);
    try {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    } catch {}
  }, []);

  // Open a shared link like /announcements#a-<id>
  useEffect(() => {
    const m = window.location.hash.match(/^#a-(.+)$/);
    if (!m) return;
    const found = items.find((n) => n._id === m[1]);
    if (found) setActive(found);
  }, [items]);

  // Esc to close, lock page scroll while the reader is open
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

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return items.filter((n) => {
      const age = now - new Date(n.createdAt).getTime();
      if (filter === "week" && age > 7 * DAY) return false;
      if (filter === "month" && age > 30 * DAY) return false;
      if (!q) return true;
      return (
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  const showFeatured = !query.trim() && filter === "all" && filtered.length > 0;
  const featured = showFeatured ? filtered[0] : null;
  const rest = showFeatured ? filtered.slice(1) : filtered;

  // Group the remaining cards by month
  const groups = useMemo(() => {
    const map = new Map();
    rest.forEach((n) => {
      const key = monthLabel(n.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    });
    return [...map.entries()];
  }, [rest]);

  const isNew = (n) => Date.now() - new Date(n.createdAt).getTime() < 7 * DAY;

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
      {/* Toolbar */}
      <div className="an-toolbar">
        <div className="an-search">
          <FiSearch size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements..."
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
        <div className="an-filters" role="tablist" aria-label="Filter by date">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`an-chip ${filter === f.id ? "an-chip--active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured / latest */}
      {featured && (
        <article
          className="an-featured"
          onClick={() => open(featured)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && open(featured)}
        >
          <Cover
            item={featured}
            uploadsUrl={uploadsUrl}
            className="an-featured-cover"
          />
          <div className="an-featured-body">
            <div className="an-meta">
              <span className="an-badge">Latest</span>
              <span className="an-date">
                <FiCalendar size={13} /> {fmtDate(featured.createdAt)}
              </span>
            </div>
            <h2>{featured.title}</h2>
            <p>{featured.message}</p>
            <span className="an-readmore">
              Read announcement <FiArrowRight size={16} />
            </span>
          </div>
        </article>
      )}

      {/* Grouped grid */}
      {groups.map(([month, list]) => (
        <section key={month} className="an-group">
          <h3 className="an-group-title">
            {month}
            <span>{list.length}</span>
          </h3>
          <div className="an-grid">
            {list.map((n) => (
              <article
                key={n._id}
                className="an-card"
                onClick={() => open(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && open(n)}
              >
                <Cover item={n} uploadsUrl={uploadsUrl} />
                <div className="an-card-body">
                  <div className="an-meta">
                    {isNew(n) && <span className="an-badge">New</span>}
                    <span className="an-date">{fmtDate(n.createdAt)}</span>
                  </div>
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <span className="an-readmore">
                    Read more <FiArrowRight size={14} />
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

      {/* Reader */}
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
                <span className="an-date">
                  <FiCalendar size={13} /> {fmtDate(active.createdAt)}
                </span>
              </div>
              <h2>{active.title}</h2>
              <p>{active.message}</p>
              <div className="an-modal-actions">
                {active.url && (
                  <SmartLink url={active.url} className="an-btn-primary">
                    {isExternal(active.url) ? "Open link" : "Learn more"}
                    {isExternal(active.url) ? (
                      <FiExternalLink size={15} />
                    ) : (
                      <FiArrowRight size={15} />
                    )}
                  </SmartLink>
                )}
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
