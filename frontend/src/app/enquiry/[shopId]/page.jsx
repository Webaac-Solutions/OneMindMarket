"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BASE_URL } from "@/lib/api";
import BackButton from "@/components/BackButton";
import "@/styles/SendEnquiry.css";

const RESPONSE_TIME = "24 hours";

const SendEnquiryPage = () => {
  const { shopId } = useParams();
  const router = useRouter();

  const isValidPhone = (value) => /^\d{10}$/.test(value);
  const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    enquiry: "",
    referredBy: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const validateField = (field, value) => {
    const trimmed = value.trim();
    if (field === "name") return trimmed ? "" : "Please enter your name";
    if (field === "phone")
      return isValidPhone(trimmed)
        ? ""
        : "Please enter a valid 10-digit phone number";
    if (field === "enquiry")
      return trimmed ? "" : "Please tell us what you need";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "phone" ? sanitizePhone(value) : value;
    setFormData({ ...formData, [name]: nextValue });
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, nextValue),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const nextErrors = {};
    ["name", "phone", "enquiry"].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${BASE_URL}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, shopId }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.message || "Failed to send enquiry");
      }
    } catch {
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="enquiry-page-wrapper">
        <div className="enquiry-card enquiry-success">
          <div className="enquiry-success-icon">&#10003;</div>
          <h2>Enquiry Sent</h2>
          <p>Thank you! The business has been notified.</p>
          <ul className="enquiry-next-steps">
            <li>The business will review your enquiry</li>
            <li>
              You&apos;ll hear back within {RESPONSE_TIME} on the number you
              provided
            </li>
          </ul>
          <button
            type="button"
            className="enquiry-submit-btn"
            onClick={() => router.back()}
          >
            Back to Business
          </button>
          <Link href="/business-listing" className="enquiry-secondary-link">
            Browse more businesses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="enquiry-page-wrapper">
      <div className="enquiry-card">
        <BackButton fallback="/" />
        <h2>Send Enquiry</h2>

        <form onSubmit={handleSubmit} className="enquiry-form" noValidate>
          <div
            className={`enquiry-field${errors.name ? " enquiry-field--error" : ""}`}
          >
            <label htmlFor="enquiry-name">Your Name</label>
            <input
              id="enquiry-name"
              name="name"
              required
              autoComplete="name"
              maxLength={100}
              aria-invalid={!!errors.name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.name && (
              <span className="enquiry-error">{errors.name}</span>
            )}
          </div>

          <div
            className={`enquiry-field${errors.phone ? " enquiry-field--error" : ""}`}
          >
            <label htmlFor="enquiry-phone">Phone Number</label>
            <input
              id="enquiry-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              required
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              aria-invalid={!!errors.phone}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.phone && (
              <span className="enquiry-error">{errors.phone}</span>
            )}
          </div>

          <div
            className={`enquiry-field${errors.enquiry ? " enquiry-field--error" : ""}`}
          >
            <label htmlFor="enquiry-details">Enquiry Details</label>
            <textarea
              id="enquiry-details"
              name="enquiry"
              rows="4"
              required
              maxLength={1000}
              aria-invalid={!!errors.enquiry}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.enquiry && (
              <span className="enquiry-error">{errors.enquiry}</span>
            )}
          </div>

          <div className="enquiry-field">
            <label htmlFor="enquiry-referred-by">Referred By</label>
            <textarea
              id="enquiry-referred-by"
              name="referredBy"
              rows="2"
              onChange={handleChange}
            />
          </div>

          <button className="enquiry-submit-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Enquiry"}
          </button>

          {message && (
            <p className="enquiry-message enquiry-message--error" role="alert">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default SendEnquiryPage;
