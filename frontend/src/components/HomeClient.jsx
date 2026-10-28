"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FiMapPin,
  FiGrid,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
} from "react-icons/fi";
import { BASE_URL, UPLOADS_URL } from "@/lib/api";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { FAQS, HOME_FAQ_LIMIT, searchFaqs } from "@/lib/faqs";
import "@/styles/Home.css";
import "@/styles/Faq.css";

// TODO: replace with the final client copy
const HERO_COPY = {
  eyebrow: "Built for native entrepreneurs",
  title: "Find Trusted Local Bbusinesses, ",
  highlight: "Grow Together",
  desc: "Search verified local members of the One Mind Market network.",
};

// Trimmed from the About page "What is One Mind Market?" section
const ABOUT_POINTS = [
  {
    title: "Trusted Referrals",
    text: "Members support each other with genuine business referrals, creating consistent opportunities built on trust and credibility.",
  },
  {
    title: "Knowledge Sharing",
    text: "Dedicated sessions where members learn practical strategies and real business experiences from fellow entrepreneurs.",
  },
  {
    title: "Local Visibility",
    text: "The One Mind Market Search Engine helps people discover verified local businesses and services within the network.",
  },
];

const HomeClient = ({
  initialCategories = [],
  initialPopularCategories = [],
  initialLocations = [],
}) => {
  const [faqQuery, setFaqQuery] = useState("");
  const faqTerm = faqQuery.trim();
  const faqResults = faqTerm ? searchFaqs(faqTerm) : null;
  const [categories, setCategories] = useState(initialCategories);
  const [popularCategories, setPopularCategories] = useState(
    initialPopularCategories,
  );
  const popularSliderRef = useRef(null);
  const categorySliderRef = useRef(null);
  const categoryFieldRef = useRef(null);
  const locationFieldRef = useRef(null);
  const categoryInputRef = useRef(null);
  const [categoriesByLocation, setCategoriesByLocation] = useState([]);
  const [locations, setLocations] = useState(initialLocations);

  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  /* Load Categories & Locations */
  useEffect(() => {
    if (categories.length === 0) {
      fetch(`${BASE_URL}/categories`)
        .then((r) => r.json())
        .then(setCategories)
        .catch(console.error);
    }

    if (popularCategories.length === 0) {
      fetch(`${BASE_URL}/categories/popular`)
        .then((r) => r.json())
        .then((list) => setPopularCategories(Array.isArray(list) ? list : []))
        .catch(console.error);
    }

    if (locations.length === 0) {
      fetch(`${BASE_URL}/locations`)
        .then((r) => r.json())
        .then(setLocations)
        .catch(console.error);
    }

    const savedLocation = localStorage.getItem("omm_selectedLocation");
    if (savedLocation) setSelectedLocation(savedLocation);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        categoryFieldRef.current &&
        !categoryFieldRef.current.contains(e.target)
      ) {
        setShowCategorySuggestions(false);
      }
      if (
        locationFieldRef.current &&
        !locationFieldRef.current.contains(e.target)
      ) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  /* Remember the chosen location across visits */
  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem("omm_selectedLocation", selectedLocation);
    } else {
      localStorage.removeItem("omm_selectedLocation");
    }
  }, [selectedLocation]);

  /* Load categories based on selected location */
  useEffect(() => {
    if (!selectedLocation) {
      setCategoriesByLocation([]);
      return;
    }

    const fetchUrl = `${BASE_URL}/locations/${selectedLocation}/categories`;

    fetch(fetchUrl)
      .then((r) => r.json())
      .then((list) => {
        setCategoriesByLocation(list || []);
        if (selectedCategory) {
          const exists = list?.some((c) => c._id === selectedCategory);
          if (!exists) {
            setSelectedCategory("");
            setCategoryInput("");
          }
        }
      })
      .catch(() => setCategoriesByLocation([]));
  }, [selectedLocation]);

  const resolveCategoryIdFromInput = () => {
    if (selectedCategory) return selectedCategory;
    const input = categoryInput.trim().toLowerCase();
    const matched = categories.find((c) => c.name.toLowerCase() === input);
    return matched ? matched._id : "";
  };

  const doSearch = (overrideCategoryId) => {
    const params = new URLSearchParams();

    if (q) params.append("q", q);
    const catId = overrideCategoryId ?? resolveCategoryIdFromInput();
    if (catId) params.append("category", catId);
    if (selectedLocation) params.append("location", selectedLocation);

    startTransition(() => {
      router.push(`/business-listing?${params}`);
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch();
  };

  const popularSlides = popularCategories.filter((c) => c.count > 0);

  const scrollSlider = (ref, dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const toggleCategoryDropdown = () => {
    if (showCategorySuggestions) {
      setShowCategorySuggestions(false);
    } else {
      setShowLocationDropdown(false);
      setShowCategorySuggestions(true);
    }
    categoryInputRef.current?.blur();
  };

  const categoryFilterText = selectedCategory ? "" : categoryInput;

  const filteredCategories = (
    selectedLocation ? categoriesByLocation : categories
  ).filter((c) =>
    c.name.toLowerCase().includes(categoryFilterText.toLowerCase()),
  );

  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <section className="hero-section fade-in-up">
        <div className="hero-content">
          <span className="eyebrow hero-eyebrow">{HERO_COPY.eyebrow}</span>
          <h1 className="hero-title">
            {HERO_COPY.title}
            <em>{HERO_COPY.highlight}</em>
          </h1>
          <p className="hero-desc">{HERO_COPY.desc}</p>
        </div>
      </section>

      {/* SEARCH SECTION */}
      <section className="search-section fade-in-up fade-in-up--delay-1">
        <div className="search-card">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-inputs">
              {/* Location */}
              <div
                className="search-field search-field--location"
                ref={locationFieldRef}
              >
                <FiMapPin className="search-field-icon" size={18} />
                <button
                  type="button"
                  className="search-select search-select-btn"
                  onClick={() => {
                    setShowCategorySuggestions(false);
                    setShowLocationDropdown((v) => !v);
                  }}
                >
                  <span
                    className={
                      selectedLocation ? "" : "search-select-placeholder"
                    }
                  >
                    {locations.find((l) => l._id === selectedLocation)?.name ||
                      "Select Location"}
                  </span>
                  <FiChevronDown
                    className={`search-select-chevron ${showLocationDropdown ? "search-select-chevron--open" : ""}`}
                    size={16}
                  />
                </button>

                {showLocationDropdown && (
                  <ul className="search-suggestions">
                    <li
                      onMouseDown={() => {
                        setSelectedLocation("");
                        setShowLocationDropdown(false);
                      }}
                    >
                      All Locations
                    </li>
                    {locations.map((l) => (
                      <li
                        key={l._id}
                        onMouseDown={() => {
                          setSelectedLocation(l._id);
                          setShowLocationDropdown(false);
                        }}
                      >
                        {l.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Category */}
              <div
                className="search-field search-field--category"
                ref={categoryFieldRef}
              >
                <FiGrid className="search-field-icon" size={18} />
                <input
                  ref={categoryInputRef}
                  className="search-input"
                  placeholder="Category (e.g. Tech, Food)"
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value);
                    setSelectedCategory("");
                    setShowCategorySuggestions(true);
                  }}
                  onFocus={() => setShowLocationDropdown(false)}
                />
                <button
                  type="button"
                  className="search-category-toggle"
                  aria-label="Toggle category list"
                  aria-expanded={showCategorySuggestions}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggleCategoryDropdown}
                >
                  <FiChevronDown
                    className={`search-select-chevron ${showCategorySuggestions ? "search-select-chevron--open" : ""}`}
                    size={16}
                  />
                </button>

                {showCategorySuggestions && filteredCategories.length > 0 && (
                  <ul className="search-suggestions">
                    {filteredCategories.map((c) => {
                      const Icon = getCategoryIcon(c);
                      return (
                        <li
                          key={c._id}
                          onMouseDown={() => {
                            setSelectedCategory(c._id);
                            setCategoryInput(c.name);
                            setShowCategorySuggestions(false);
                          }}
                        >
                          <Icon size={14} className="search-suggestion-icon" />
                          {c.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Search Button */}
              <button type="submit" className="search-btn" disabled={isPending}>
                {isPending ? (
                  <span className="btn-spinner" />
                ) : (
                  <FiSearch size={18} />
                )}
                <span>{isPending ? "Searching..." : "Search"}</span>
              </button>
            </div>
          </form>
        </div>
        <p className="search-hint">
          Search by location, category, or business name to find trusted local
          members.
        </p>
      </section>

      {popularSlides.length > 0 && (
        <section className="popular-section fade-in-up fade-in-up--delay-2">
          <div className="popular-header">
            <h2>Popular Categories</h2>
          </div>
          <div className="popular-slider-wrap">
            <button
              type="button"
              className="popular-arrow popular-arrow--prev"
              onClick={() => scrollSlider(popularSliderRef, -1)}
              aria-label="Previous categories"
            >
              <FiChevronLeft size={20} />
            </button>
            <div className="popular-slider" ref={popularSliderRef}>
              {popularSlides.map((c) => {
                const Icon = getCategoryIcon(c);
                return (
                  <Link
                    key={c._id}
                    href={`/business-listing?category=${c.slug}`}
                    className="popular-card"
                  >
                    <span className="popular-card-media">
                      {c.image ? (
                        <Image
                          src={`${UPLOADS_URL}/${c.image}`}
                          alt={c.name}
                          width={260}
                          height={260}
                          sizes="(max-width: 600px) 34vw, 180px"
                          className="popular-card-img"
                        />
                      ) : (
                        <span className="popular-card-fallback">
                          <Icon size={34} />
                        </span>
                      )}
                    </span>
                    <span className="popular-card-name">{c.name}</span>
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              className="popular-arrow popular-arrow--next"
              onClick={() => scrollSlider(popularSliderRef, 1)}
              aria-label="Next categories"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section
        id="about"
        className="home-about-section fade-in-up fade-in-up--delay-2"
      >
        <div className="home-about">
          <div className="home-about-text">
            <span className="eyebrow">Who We Are</span>
            <h2>About One Mind Market</h2>
            <p>
              <strong>One Mind Market</strong> is a business networking,
              learning, and discovery platform created exclusively for native
              entrepreneurs who run and grow their own independent businesses.
              The purpose of the platform is to bring local business owners into
              one trusted ecosystem where they can connect, collaborate, and
              grow together.
            </p>
            <p>
              Unlike platforms that include large corporate companies or
              franchise chains, One Mind Market is designed only for native
              entrepreneurs who are building their own ventures.
            </p>
            <Link href="/about" className="home-about-link">
              Read our story <FiArrowRight size={16} />
            </Link>
          </div>
          <ul className="home-about-points">
            {ABOUT_POINTS.map((pt) => (
              <li key={pt.title}>
                <h3>{pt.title}</h3>
                <p>{pt.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* BROWSE BY CATEGORY - same UI as Popular Categories */}
      {categories.length > 0 && (
        <section className="popular-section fade-in-up fade-in-up--delay-2">
          <div className="popular-header">
            <h2>Browse by Category</h2>
          </div>
          <div className="popular-slider-wrap">
            <button
              type="button"
              className="popular-arrow popular-arrow--prev"
              onClick={() => scrollSlider(categorySliderRef, -1)}
              aria-label="Previous categories"
            >
              <FiChevronLeft size={20} />
            </button>
            <div className="popular-slider" ref={categorySliderRef}>
              {categories.map((c) => {
                const Icon = getCategoryIcon(c);
                return (
                  <Link
                    key={c._id}
                    href={`/business-listing?category=${c.slug}`}
                    className="popular-card"
                  >
                    <span className="popular-card-media">
                      {c.image ? (
                        <Image
                          src={`${UPLOADS_URL}/${c.image}`}
                          alt={c.name}
                          width={260}
                          height={260}
                          sizes="(max-width: 600px) 34vw, 180px"
                          className="popular-card-img"
                        />
                      ) : (
                        <span className="popular-card-fallback">
                          <Icon size={34} />
                        </span>
                      )}
                    </span>
                    <span className="popular-card-name">{c.name}</span>
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              className="popular-arrow popular-arrow--next"
              onClick={() => scrollSlider(categorySliderRef, 1)}
              aria-label="Next categories"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </section>
      )}

      {/* BROWSE BY CITY - plain crawlable anchors for SEO discovery */}
      {locations.length > 0 && (
        <section className="popular-section browse-city-section fade-in-up fade-in-up--delay-2">
          <div className="popular-header">
            <h2>Browse by City</h2>
          </div>
          <div className="browse-links">
            {locations.map((l) => (
              <Link key={l._id} href={`/${l.slug}`}>
                {l.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA SECTION */}
      <section className="cta-section cta-section--text-only fade-in-up fade-in-up--delay-2">
        <div className="cta-card">
          <div className="cta-bg-pattern" />
          <h2 className="cta-title">
            Ready to scale your <br /> local brand?
          </h2>
          <p className="cta-desc">
            Join our community of native entrepreneurs who are transforming
            local businesses in global successes.
          </p>
        </div>
      </section>

      <section className="faq-section fade-in-up fade-in-up--delay-2">
        <div className="faq-section-head">
          <span className="eyebrow">FAQ</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className="faq-search">
          <FiSearch size={18} className="faq-search-icon" />
          <input
            type="text"
            value={faqQuery}
            onChange={(e) => setFaqQuery(e.target.value)}
            placeholder="Search questions..."
            aria-label="Search questions"
          />
        </div>
        <div className="faq-list">
          {faqResults && faqResults.length === 0 && (
            <p className="faq-empty">No matching questions found.</p>
          )}
          {(faqResults || FAQS.slice(0, HOME_FAQ_LIMIT)).map((f) =>
            FAQS.indexOf(f) < HOME_FAQ_LIMIT ? (
              <div key={f.id} className="faq-item">
                <p className="faq-q">
                  <span className="faq-label">Q:</span> {f.question}
                </p>
                <p className="faq-a">
                  <span className="faq-label">A:</span> {f.answer}
                </p>
              </div>
            ) : (
              <Link
                key={f.id}
                href={`/faq?q=${encodeURIComponent(f.question)}`}
                className="faq-item faq-item--link"
              >
                <p className="faq-q">
                  <span className="faq-label">Q:</span> {f.question}
                </p>
                <span className="faq-link-hint">
                  View answer on FAQ page <FiArrowRight size={14} />
                </span>
              </Link>
            ),
          )}
        </div>
        <div className="faq-more">
          <Link
            href={faqTerm ? `/faq?q=${encodeURIComponent(faqTerm)}` : "/faq"}
            className="faq-more-link"
          >
            Read more <FiArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomeClient;
