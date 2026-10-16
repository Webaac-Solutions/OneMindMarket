"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FiMapPin,
  FiChevronDown,
  FiStar,
  FiSearch,
  FiX,
  FiGrid,
  FiClock,
} from "react-icons/fi";
import { FaWhatsapp, FaPhoneAlt, FaHeart } from "react-icons/fa";
import { BASE_URL, UPLOADS_URL } from "@/lib/api";
import { getCategoryIcon } from "@/lib/categoryIcons";
import CallLink from "@/components/CallLink";
import Loader from "@/components/Loader";
import PageHeading from "@/components/PageHeading";
import BackToTop from "@/components/BackToTop";
import SaveButton from "@/components/SaveButton";
import { SAVED_EVENT, getSavedIds } from "@/lib/savedShops";

const toWhatsAppNumber = (phone) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `91${digits}` : digits;
};
import "@/styles/SearchResults.css";
import "@/styles/BusinessListing.css";

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(v);

const RECENT_KEY = "omm_recentSearches";
const MAX_RECENT = 5;

const SORT_OPTIONS = [
  { value: "", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
  { value: "nearest", label: "Nearest" },
];

const BusinessListingClient = ({ initialData }) => {
  const params = useSearchParams();
  const router = useRouter();

  const [locations, setLocations] = useState(initialData?.locations || []);
  const [allCategories, setAllCategories] = useState(
    initialData?.categories || [],
  );
  const [categoriesInLocation, setCategoriesInLocation] = useState(
    initialData?.categoriesInLocation || [],
  );
  const [popularCategories, setPopularCategories] = useState(
    initialData?.popularCategories || [],
  );
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [results, setResults] = useState(initialData?.initialResults || []);
  const [total, setTotal] = useState(initialData?.initialTotal || 0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    initialData?.initialTotalPages || 1,
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [qInput, setQInput] = useState(initialData?.q || "");
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [savedShops, setSavedShops] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const skippedFirstFetch = useRef(false);
  const resultsRef = useRef(null);
  const scrollToResults = useRef(false);
  const lastPushedQ = useRef(initialData?.q || "");

  const locationParam = params.get("location") || "";
  const categoryParam = params.get("category") || "";
  const qParam = params.get("q") || "";
  const sortParam = params.get("sort") || "";

  const locationObj = locationParam
    ? locations.find((l) =>
        isObjectId(locationParam)
          ? l._id === locationParam
          : l.slug === locationParam,
      )
    : null;

  const categoryObj = categoryParam
    ? allCategories.find((c) =>
        isObjectId(categoryParam)
          ? c._id === categoryParam
          : c.slug === categoryParam,
      )
    : null;

  const categoryChips = locationObj ? categoriesInLocation : allCategories;

  /* Base data: every location + every category (kept fresh after the SSR seed) */
  useEffect(() => {
    fetch(`${BASE_URL}/locations`)
      .then((r) => r.json())
      .then(setLocations)
      .catch(() => {});

    fetch(`${BASE_URL}/categories`)
      .then((r) => r.json())
      .then(setAllCategories)
      .catch(() => {});

    fetch(`${BASE_URL}/categories/popular`)
      .then((r) => r.json())
      .then(setPopularCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (e.target.closest?.(".bl-location-field, .bl-sort-field")) return;
      setShowLocationDropdown(false);
      setShowCategoryDropdown(false);
      setShowSortDropdown(false);
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  /* Narrow category chips to the selected location */
  useEffect(() => {
    if (!locationObj?._id) {
      setCategoriesInLocation([]);
      return;
    }
    fetch(`${BASE_URL}/locations/${locationObj._id}/categories`)
      .then((r) => r.json())
      .then((list) => setCategoriesInLocation(list || []))
      .catch(() => setCategoriesInLocation([]));
  }, [locationObj?._id]);

  /* Keep the search box in sync if the URL's q param changes elsewhere (e.g. back button) */
  useEffect(() => {
    if (qParam === lastPushedQ.current) return;
    lastPushedQ.current = qParam;
    setQInput(qParam);
  }, [qParam]);

  const scrollResultsIntoView = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!scrollToResults.current) return;
    scrollToResults.current = false;
    const timer = setTimeout(scrollResultsIntoView, 80);
    return () => clearTimeout(timer);
  }, [qParam]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(saved)) setRecentSearches(saved.slice(0, MAX_RECENT));
    } catch (err) {}
  }, []);

  useEffect(() => {
    const sync = () => setSavedIds(getSavedIds());
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SAVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!showSaved) return;
    let cancelled = false;
    setSavedLoading(true);
    Promise.all(
      getSavedIds().map((id) =>
        fetch(`${BASE_URL}/customers/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((list) => {
      if (cancelled) return;
      setSavedShops(list.filter(Boolean));
      setSavedLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [showSaved]);

  const updateFilters = ({ location, category, q, sort, replace }) => {
    const next = new URLSearchParams();
    const loc = location !== undefined ? location : locationParam;
    const cat = category !== undefined ? category : categoryParam;
    const query = q !== undefined ? q : qParam;
    const sortVal = sort !== undefined ? sort : sortParam;
    if (loc) next.set("location", loc);
    if (cat) next.set("category", cat);
    if (query) next.set("q", query);
    if (sortVal) next.set("sort", sortVal);
    if (q !== undefined) lastPushedQ.current = query;
    const target = `/business-listing${next.toString() ? `?${next}` : ""}`;
    replace ? router.replace(target) : router.push(target);
  };

  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed === qParam) return;
    const timer = setTimeout(() => {
      updateFilters({ q: trimmed, replace: true });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const selectCategory = (c) => {
    setShowCategoryDropdown(false);
    if (locationObj) {
      router.push(
        c ? `/${locationObj.slug}/${c.slug}` : `/${locationObj.slug}`,
      );
    } else {
      updateFilters({ category: c ? c.slug || c._id : "" });
    }
  };

  const currentSort =
    SORT_OPTIONS.find((opt) => opt.value === sortParam) || SORT_OPTIONS[0];

  const saveRecent = (term) => {
    if (!term) return;
    const next = [
      term,
      ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase()),
    ].slice(0, MAX_RECENT);
    setRecentSearches(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch (err) {}
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch (err) {}
  };

  const runSearch = (term) => {
    document.activeElement?.blur();
    setShowRecent(false);
    saveRecent(term);
    if (term === qParam) {
      setTimeout(scrollResultsIntoView, 80);
    } else {
      scrollToResults.current = true;
    }
    updateFilters({ q: term });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    runSearch(qInput.trim());
  };

  const pickRecent = (term) => {
    setQInput(term);
    runSearch(term);
  };

  /* Fetch one page of businesses; page 1 replaces the list, later pages append (Load More) */
  const fetchBusinesses = async (pageNum, { append } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      let categoryId = categoryParam;
      if (categoryParam && !isObjectId(categoryParam)) {
        const res = await fetch(
          `${BASE_URL}/categories/slug/${encodeURIComponent(categoryParam)}`,
        );
        categoryId = res.ok ? (await res.json())._id : "";
      }

      let locationId = locationParam;
      if (locationParam && !isObjectId(locationParam)) {
        const res = await fetch(
          `${BASE_URL}/locations/slug/${encodeURIComponent(locationParam)}`,
        );
        locationId = res.ok ? (await res.json())._id : "";
      }

      const url = new URL(`${BASE_URL}/customers`);
      if (categoryId) url.searchParams.append("category", categoryId);
      if (locationId) url.searchParams.append("location", locationId);
      if (qParam) url.searchParams.append("q", qParam);
      if (sortParam) url.searchParams.append("sort", sortParam);
      url.searchParams.append("page", pageNum);
      url.searchParams.append("limit", 12);

      const res = await fetch(url);
      const data = await res.json();
      setResults((prev) =>
        append ? [...prev, ...(data.results || [])] : data.results || [],
      );
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
      if (!append) setResults([]);
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  /* Re-fetch from page 1 whenever a filter changes */
  useEffect(() => {
    if (!skippedFirstFetch.current) {
      skippedFirstFetch.current = true;
      return;
    }
    fetchBusinesses(1, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam, locationParam, qParam, sortParam]);

  const handleLoadMore = () => {
    if (page >= totalPages || loadingMore) return;
    fetchBusinesses(page + 1, { append: true });
  };

  const resultsMeta =
    total > 0 && !loading && !showSaved ? (
      <div className="bl-results-meta">
        <span className="bl-total-count">
          {total} {total === 1 ? "business" : "businesses"} found
        </span>
        <div className="bl-sort-field">
          <span className="bl-sort-label">Sort by</span>
          <div className="bl-sort-menu">
            <button
              type="button"
              className="bl-sort-btn"
              onClick={() => {
                setShowSortDropdown((v) => !v);
                setShowLocationDropdown(false);
                setShowCategoryDropdown(false);
              }}
              onBlur={() => setTimeout(() => setShowSortDropdown(false), 150)}
            >
              <span>{currentSort.label}</span>
              <FiChevronDown
                className={`bl-location-chevron ${showSortDropdown ? "bl-location-chevron--open" : ""}`}
                size={14}
              />
            </button>

            {showSortDropdown && (
              <ul className="bl-location-dropdown bl-sort-dropdown">
                {SORT_OPTIONS.map((opt) => (
                  <li
                    key={opt.value}
                    className={
                      opt.value === currentSort.value
                        ? "bl-dropdown-item--active"
                        : ""
                    }
                    onMouseDown={() => {
                      setShowSortDropdown(false);
                      updateFilters({ sort: opt.value });
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    ) : null;

  const renderCard = (r, index) => {
    const locSlug = r.location?.slug || "unknown";
    const catSlug = r.category?.slug || "uncategorized";
    return (
      <Link
        key={r._id}
        href={`/${locSlug}/${catSlug}/${r.slug}`}
        className="sr-card"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className="sr-card-image">
          <SaveButton
            shopId={r._id}
            variant="card"
            approved={!!r.isOneMindApproved}
          />
          {r.shopPhoto ? (
            <Image
              src={`${UPLOADS_URL}/${r.shopPhoto}`}
              alt={`${r.shopName} business photo`}
              width={400}
              height={280}
              priority={index < 2}
              sizes="(max-width: 768px) 100vw, 160px"
            />
          ) : (
            <div className="sr-card-no-image">No Image</div>
          )}
        </div>
        {r.isOneMindApproved && (
          <span className="sr-featured-tag">
            <FiStar size={10} />
            Trusted Partner
          </span>
        )}
        <div className="sr-card-info">
          {r.category?.name && (
            <span className="sr-badge">{r.category.name}</span>
          )}
          <h3 className="sr-card-name">{r.shopName}</h3>
          {r.shopDescription && (
            <p className="sr-card-desc">
              {r.shopDescription.length > 120
                ? r.shopDescription.slice(0, 120) + "..."
                : r.shopDescription}
            </p>
          )}
        </div>

        {r.shopPhone && (
          <div className="sr-card-contact" onClick={(e) => e.stopPropagation()}>
            <CallLink
              shopId={r._id}
              phone={r.shopPhone}
              source="listing"
              className="sr-call-btn"
            >
              <FaPhoneAlt />
            </CallLink>
            {toWhatsAppNumber(r.shopPhone) && (
              <a
                href={`https://wa.me/${toWhatsAppNumber(r.shopPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sr-whatsapp-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <FaWhatsapp />
              </a>
            )}
          </div>
        )}

        <div className="sr-card-action">
          <span className="sr-view-btn">View Details</span>
        </div>
      </Link>
    );
  };

  const typedLower = qInput.trim().toLowerCase();
  const visibleRecent = recentSearches.filter(
    (s) =>
      s.toLowerCase() !== typedLower && s.toLowerCase().includes(typedLower),
  );

  const hasActiveFilters =
    !showSaved && Boolean(qParam || locationObj || categoryObj);

  const visibleSavedShops = savedShops.filter((s) => savedIds.includes(s._id));

  const toggleSavedView = () => {
    setShowSaved((v) => !v);
    setTimeout(scrollResultsIntoView, 80);
  };

  const clearAllFilters = () => {
    setQInput("");
    setLoading(true);
    updateFilters({ location: "", category: "", q: "" });
  };

  const applySuggestion = (next) => {
    setQInput("");
    setLoading(true);
    updateFilters({ location: "", category: "", q: "", ...next });
  };

  const suggestedCategories = (
    popularCategories.length > 0 ? popularCategories : allCategories
  )
    .filter((c) => c._id !== categoryObj?._id)
    .slice(0, 6);

  const suggestedLocations = locations
    .filter((l) => l._id !== locationObj?._id)
    .slice(0, 6);

  return (
    <div className="sr-page bl-page">
      <PageHeading
        eyebrow="Directory"
        title="Business Listing"
        subtitle="Browse every business on OneMind Market, or narrow down by location and category."
      />

      {/* Free-text search within the listing */}
      <div className="bl-search-wrap">
        <form className="bl-search-bar" onSubmit={handleSearchSubmit}>
          <FiSearch className="bl-search-icon" size={18} />
          <input
            type="text"
            className="bl-search-input"
            placeholder="Search businesses by name..."
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 150)}
          />
          {qInput && (
            <button
              type="button"
              className="bl-search-clear"
              aria-label="Clear search"
              onClick={() => {
                setQInput("");
                updateFilters({ q: "" });
              }}
            >
              <FiX size={16} />
            </button>
          )}
          <button type="submit" className="bl-search-btn">
            Search
          </button>
        </form>

        {showRecent && visibleRecent.length > 0 && (
          <div className="bl-recent-dropdown">
            <div className="bl-recent-head">
              <span>Recent searches</span>
              <button
                type="button"
                className="bl-recent-clear"
                onMouseDown={clearRecent}
              >
                Clear
              </button>
            </div>
            <ul className="bl-recent-list">
              {visibleRecent.map((s) => (
                <li key={s} onMouseDown={() => pickRecent(s)}>
                  <FiClock size={14} className="bl-recent-icon" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Filters sit right under search so results start higher */}
      <div className="bl-filters">
        <div className="bl-filter-selects">
          {/* Category chips - grouping/filtering by category */}
          <div className="bl-location-field bl-category-field">
            <button
              type="button"
              className="bl-location-btn"
              onClick={() => {
                setShowCategoryDropdown((v) => !v);
                setShowLocationDropdown(false);
                setShowSortDropdown(false);
              }}
              onBlur={() =>
                setTimeout(() => setShowCategoryDropdown(false), 150)
              }
            >
              <FiGrid className="bl-location-icon" size={16} />
              <span
                className={`bl-location-label ${categoryObj ? "" : "bl-location-label--placeholder"}`}
              >
                {categoryObj?.name || "All Categories"}
              </span>
              <FiChevronDown
                className={`bl-location-chevron ${showCategoryDropdown ? "bl-location-chevron--open" : ""}`}
                size={16}
              />
            </button>

            {showCategoryDropdown && (
              <ul className="bl-location-dropdown">
                <li
                  className={!categoryObj ? "bl-dropdown-item--active" : ""}
                  onMouseDown={() => selectCategory(null)}
                >
                  <FiGrid size={14} className="bl-dropdown-icon" />
                  All Categories
                </li>
                {categoryChips.map((c) => {
                  const ChipIcon = getCategoryIcon(c);
                  return (
                    <li
                      key={c._id}
                      className={
                        categoryObj?._id === c._id
                          ? "bl-dropdown-item--active"
                          : ""
                      }
                      onMouseDown={() => selectCategory(c)}
                    >
                      <ChipIcon size={14} className="bl-dropdown-icon" />
                      {c.name}
                      {typeof c.count === "number" ? ` (${c.count})` : ""}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bl-location-field">
            <button
              type="button"
              className="bl-location-btn"
              onClick={() => {
                setShowLocationDropdown((v) => !v);
                setShowCategoryDropdown(false);
                setShowSortDropdown(false);
              }}
              onBlur={() =>
                setTimeout(() => setShowLocationDropdown(false), 150)
              }
            >
              <FiMapPin className="bl-location-icon" size={16} />
              <span
                className={`bl-location-label ${locationObj ? "" : "bl-location-label--placeholder"}`}
              >
                {locationObj?.name || "All Locations"}
              </span>
              <FiChevronDown
                className={`bl-location-chevron ${showLocationDropdown ? "bl-location-chevron--open" : ""}`}
                size={16}
              />
            </button>

            {showLocationDropdown && (
              <ul className="bl-location-dropdown">
                <li
                  onMouseDown={() => {
                    setShowLocationDropdown(false);
                    updateFilters({ location: "" });
                  }}
                >
                  All Locations
                </li>
                {locations.map((l) => (
                  <li
                    key={l._id}
                    onMouseDown={() => {
                      setShowLocationDropdown(false);
                      updateFilters({ location: l.slug || l._id });
                    }}
                  >
                    {l.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {resultsMeta && <div className="bl-meta-desktop">{resultsMeta}</div>}
      </div>

      <div ref={resultsRef} style={{ scrollMarginTop: 90 }} />

      {hasActiveFilters && (
        <div className="bl-active-filters">
          <span className="bl-active-label">Active filters:</span>
          {qParam && (
            <span className="bl-active-chip">
              <span className="bl-active-chip-text">{`Search: "${qParam}"`}</span>
              <button
                type="button"
                aria-label="Remove search filter"
                onClick={() => {
                  setQInput("");
                  updateFilters({ q: "" });
                }}
              >
                <FiX size={12} />
              </button>
            </span>
          )}
          {categoryObj && (
            <span className="bl-active-chip">
              <span className="bl-active-chip-text">{categoryObj.name}</span>
              <button
                type="button"
                aria-label="Remove category filter"
                onClick={() => updateFilters({ category: "" })}
              >
                <FiX size={12} />
              </button>
            </span>
          )}
          {locationObj && (
            <span className="bl-active-chip">
              <span className="bl-active-chip-text">{locationObj.name}</span>
              <button
                type="button"
                aria-label="Remove location filter"
                onClick={() => updateFilters({ location: "" })}
              >
                <FiX size={12} />
              </button>
            </span>
          )}
          <button
            type="button"
            className="bl-clear-all"
            onClick={clearAllFilters}
          >
            Clear all
          </button>
        </div>
      )}

      {(savedIds.length > 0 || showSaved) && (
        <div className="bl-saved-row">
          <button
            type="button"
            className={`bl-saved-toggle ${showSaved ? "bl-saved-toggle--active" : ""}`}
            aria-pressed={showSaved}
            onClick={toggleSavedView}
          >
            <FaHeart size={13} />
            {`Saved (${savedIds.length})`}
          </button>
        </div>
      )}

      {resultsMeta && <div className="bl-meta-sticky">{resultsMeta}</div>}

      {showSaved ? (
        savedLoading ? (
          <Loader />
        ) : visibleSavedShops.length === 0 ? (
          <div className="sr-empty">
            <h2>No saved businesses yet</h2>
            <p>Tap the heart on any business to save it here for later.</p>
            <button className="sr-back-btn" onClick={() => setShowSaved(false)}>
              Browse Businesses
            </button>
          </div>
        ) : (
          <div className="sr-results">{visibleSavedShops.map(renderCard)}</div>
        )
      ) : loading ? (
        <Loader />
      ) : results.length === 0 ? (
        <div className="sr-empty">
          <h2>No businesses found</h2>
          <p>
            {qParam
              ? `Nothing matched "${qParam}". Check the spelling, try a shorter name, or clear your filters.`
              : "Try a different location, category, or search term."}
          </p>
          <button
            className="sr-back-btn"
            onClick={() => {
              if (qParam || locationParam || categoryParam || sortParam) {
                setLoading(true);
              }
              router.push("/business-listing");
            }}
          >
            Reset Filters
          </button>
          <Link href="/join" className="sr-empty-link">
            Own a business? Get listed
          </Link>
          {(suggestedCategories.length > 0 ||
            suggestedLocations.length > 0) && (
            <div className="bl-suggest">
              {suggestedCategories.length > 0 && (
                <div className="bl-suggest-group">
                  <span className="bl-suggest-title">Popular categories</span>
                  <div className="bl-suggest-list">
                    {suggestedCategories.map((c) => {
                      const SuggestIcon = getCategoryIcon(c);
                      return (
                        <button
                          key={c._id}
                          type="button"
                          className="bl-chip"
                          onClick={() =>
                            applySuggestion({ category: c.slug || c._id })
                          }
                        >
                          <SuggestIcon size={14} className="bl-chip-icon" />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {suggestedLocations.length > 0 && (
                <div className="bl-suggest-group">
                  <span className="bl-suggest-title">
                    Browse other locations
                  </span>
                  <div className="bl-suggest-list">
                    {suggestedLocations.map((l) => (
                      <button
                        key={l._id}
                        type="button"
                        className="bl-chip"
                        onClick={() =>
                          applySuggestion({ location: l.slug || l._id })
                        }
                      >
                        <FiMapPin size={14} className="bl-chip-icon" />
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="sr-results">{results.map(renderCard)}</div>

          {/* Load More instead of numbered pages - friendlier on mobile */}
          {page < totalPages && (
            <>
              <p className="bl-load-more-count" aria-live="polite">
                Showing {results.length} of {total}
              </p>
              <div className="bl-load-more-wrap">
                <button
                  className="sr-back-btn bl-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            </>
          )}
        </>
      )}
      {/* Popular Categories - moved below results on purpose, keep it down here */}
      {popularCategories.length > 0 && (
        <div className="bl-popular-section">
          <h2 className="bl-popular-title">Popular Categories</h2>
          <div className="bl-popular-grid">
            {popularCategories.map((c, idx) => {
              const Icon = getCategoryIcon(c);
              const isActive = categoryObj?._id === c._id;
              const cardInner = (
                <>
                  <Icon size={20} className="bl-popular-icon" />
                  <span>{c.name}</span>
                  {typeof c.count === "number" && (
                    <span className="bl-popular-count">{c.count}</span>
                  )}
                </>
              );
              return locationObj ? (
                <Link
                  key={c._id}
                  href={`/${locationObj.slug}/${c.slug}`}
                  className={`bl-popular-card ${isActive ? "bl-popular-card--active" : ""}`}
                >
                  {cardInner}
                </Link>
              ) : (
                <button
                  key={c._id}
                  className={`bl-popular-card ${isActive ? "bl-popular-card--active" : ""}`}
                  onClick={() => updateFilters({ category: c.slug || c._id })}
                >
                  {cardInner}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <BackToTop />
    </div>
  );
};

export default BusinessListingClient;
