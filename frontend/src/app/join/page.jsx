"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BASE_URL } from "@/lib/api";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/Toast";
import PageHeading from "@/components/PageHeading";
import Loader from "@/components/Loader";
import "@/styles/JoinRequest.css";

const RESPONSE_TIME = "24 hours";

const JoinRequestPage = () => {
  const toast = useToast();
  const isValidPhone = (value) => /^\d{10}$/.test(value);
  const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryFieldRef = useRef(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const locationFieldRef = useRef(null);
  const [locActive, setLocActive] = useState(-1);
  const [catActive, setCatActive] = useState(-1);
  const locListRef = useRef(null);
  const catListRef = useRef(null);

  useEffect(() => {
    let id2;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, []);

  useEffect(() => {
    const load = (path, set) =>
      fetch(`${BASE_URL}/${path}`)
        .then((res) => res.json())
        .then((data) => set(Array.isArray(data) ? data : []))
        .catch(() => set([]));

    Promise.all([
      load("categories", setCategories),
      load("locations", setLocations),
    ]).then(() => setDataReady(true));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        categoryFieldRef.current &&
        !categoryFieldRef.current.contains(e.target)
      ) {
        setCategoryOpen(false);
      }
      if (
        locationFieldRef.current &&
        !locationFieldRef.current.contains(e.target)
      ) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(category.toLowerCase()),
  );

  const values = { name, mobile, location, category };

  useEffect(() => {
    locListRef.current?.children[locActive]?.scrollIntoView({
      block: "nearest",
    });
  }, [locActive]);

  useEffect(() => {
    catListRef.current?.children[catActive]?.scrollIntoView({
      block: "nearest",
    });
  }, [catActive]);

  const moveActive = (e, list, active, setActive, open, setOpen) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((active + step + list.length) % list.length);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const validateField = (field, value) => {
    const trimmed = value.trim();
    if (field === "name") return trimmed ? "" : "Please enter your name";
    if (field === "mobile") {
      if (!trimmed) return "Please enter your mobile number";
      return isValidPhone(trimmed)
        ? ""
        : "Please enter a valid 10-digit mobile number";
    }
    if (field === "location")
      return trimmed ? "" : "Please select your location";
    if (field === "category")
      return trimmed ? "" : "Please enter or select your business category";
    return "";
  };

  const handleBlur = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, values[field]),
    }));
  };

  const handleFieldChange = (field, setter, nextValue) => {
    setter(nextValue);
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, nextValue),
      }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const nextErrors = {};
    Object.keys(values).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/join-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          location,
          category,
        }),
      });

      if (res.ok) {
        setSent(true);
        toast.success("Join request sent");
        setName("");
        setMobile("");
        setLocation("");
        setCategory("");
        setErrors({});
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Submission failed");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !dataReady) {
    return <Loader fullScreen />;
  }

  if (sent) {
    return (
      <div className="joinreq-page">
        <div className="joinreq-card joinreq-success">
          <div className="joinreq-success-icon">&#10003;</div>
          <h2>Request Received</h2>
          <p>Thank you for your interest in joining One Mind Market.</p>
          <ul className="joinreq-next-steps">
            <li>Our team will review your details</li>
            <li>
              We&apos;ll contact you within {RESPONSE_TIME} on the mobile number
              you provided
            </li>
          </ul>
          <Link href="/business-listing" className="joinreq-btn">
            Browse Businesses
          </Link>
          <Link href="/" className="joinreq-secondary-link">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="joinreq-page">
      <PageHeading
        eyebrow="Join Us"
        title="Join One Mind Market"
        subtitle="Become part of a trusted local business ecosystem"
      />

      <div className="joinreq-back">
        <BackButton fallback="/" />
      </div>

      <div className="joinreq-card">
        <form className="joinreq-form" onSubmit={submit} noValidate>
          <div
            className={`joinreq-field${errors.name ? " joinreq-field--error" : ""}`}
          >
            <label htmlFor="join-name">Name</label>
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) =>
                handleFieldChange("name", setName, e.target.value)
              }
              onBlur={() => handleBlur("name")}
              placeholder="Your full name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "join-name-error" : undefined}
            />
            {errors.name && (
              <span id="join-name-error" className="joinreq-error">
                {errors.name}
              </span>
            )}
          </div>

          <div
            className={`joinreq-field${errors.mobile ? " joinreq-field--error" : ""}`}
          >
            <label htmlFor="join-mobile">Mobile Number</label>
            <input
              id="join-mobile"
              type="tel"
              value={mobile}
              onChange={(e) =>
                handleFieldChange(
                  "mobile",
                  setMobile,
                  sanitizePhone(e.target.value),
                )
              }
              onBlur={() => handleBlur("mobile")}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              aria-invalid={!!errors.mobile}
              aria-describedby={errors.mobile ? "join-mobile-error" : undefined}
            />
            {errors.mobile && (
              <span id="join-mobile-error" className="joinreq-error">
                {errors.mobile}
              </span>
            )}
          </div>

          <div
            className={`joinreq-field joinreq-field--dropdown${errors.location ? " joinreq-field--error" : ""}`}
            ref={locationFieldRef}
          >
            <label htmlFor="join-location">Location</label>
            <div className="joinreq-combo">
              <button
                id="join-location"
                type="button"
                className={`joinreq-select joinreq-select-btn${location ? "" : " joinreq-select-btn--empty"}`}
                onClick={() => {
                  setLocationOpen((o) => !o);
                  setLocActive(-1);
                }}
                onKeyDown={(e) => {
                  moveActive(
                    e,
                    locations,
                    locActive,
                    setLocActive,
                    locationOpen,
                    setLocationOpen,
                  );
                  if (
                    (e.key === "Enter" || e.key === " ") &&
                    locationOpen &&
                    locActive >= 0
                  ) {
                    e.preventDefault();
                    handleFieldChange(
                      "location",
                      setLocation,
                      locations[locActive].name,
                    );
                    setLocationOpen(false);
                    setLocActive(-1);
                  }
                }}
                onBlur={() => handleBlur("location")}
                aria-haspopup="listbox"
                aria-expanded={locationOpen}
                aria-invalid={!!errors.location}
                aria-describedby={
                  errors.location ? "join-location-error" : undefined
                }
              >
                {location || "Select your location"}
              </button>
              {locationOpen && locations.length > 0 && (
                <ul
                  className="joinreq-dropdown"
                  role="listbox"
                  ref={locListRef}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {locations.map((l, i) => (
                    <li
                      key={l._id}
                      role="option"
                      aria-selected={location === l.name}
                      className={`joinreq-dropdown-item${i === locActive ? " joinreq-dropdown-item--active" : ""}`}
                      onClick={() => {
                        handleFieldChange("location", setLocation, l.name);
                        setLocationOpen(false);
                      }}
                    >
                      {l.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.location && (
              <span id="join-location-error" className="joinreq-error">
                {errors.location}
              </span>
            )}
          </div>

          <div
            className={`joinreq-field joinreq-field--dropdown${errors.category ? " joinreq-field--error" : ""}`}
            ref={categoryFieldRef}
          >
            <label htmlFor="join-category">Category</label>
            <div className="joinreq-combo">
              <input
                id="join-category"
                type="text"
                value={category}
                onChange={(e) => {
                  handleFieldChange("category", setCategory, e.target.value);
                  setCategoryOpen(true);
                  setCatActive(-1);
                }}
                onFocus={() => setCategoryOpen(true)}
                onKeyDown={(e) => {
                  moveActive(
                    e,
                    filteredCategories,
                    catActive,
                    setCatActive,
                    categoryOpen && filteredCategories.length > 0,
                    setCategoryOpen,
                  );
                  if (e.key === "Enter" && categoryOpen && catActive >= 0) {
                    e.preventDefault();
                    handleFieldChange(
                      "category",
                      setCategory,
                      filteredCategories[catActive].name,
                    );
                    setCategoryOpen(false);
                    setCatActive(-1);
                  }
                }}
                onBlur={() => handleBlur("category")}
                placeholder="Type or select your business category"
                className="joinreq-select"
                autoComplete="off"
                aria-invalid={!!errors.category}
                aria-describedby={
                  errors.category ? "join-category-error" : undefined
                }
              />
              {categoryOpen && filteredCategories.length > 0 && (
                <ul
                  className="joinreq-dropdown"
                  ref={catListRef}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {filteredCategories.map((c, i) => (
                    <li
                      key={c._id}
                      className={`joinreq-dropdown-item${i === catActive ? " joinreq-dropdown-item--active" : ""}`}
                      onClick={() => {
                        handleFieldChange("category", setCategory, c.name);
                        setCategoryOpen(false);
                      }}
                    >
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.category && (
              <span id="join-category-error" className="joinreq-error">
                {errors.category}
              </span>
            )}
          </div>

          <button className="joinreq-btn" disabled={loading}>
            {loading ? "Submitting..." : "Send Join Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRequestPage;
