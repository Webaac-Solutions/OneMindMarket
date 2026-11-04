"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919000000000";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^\d{10}$/.test(value);
const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);

const AboutContactForm = () => {
  const [form, setForm] = useState({
    name: "",
    brandName: "",
    businessCategory: "",
    contactNumber: "",
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "contactNumber" ? sanitizePhone(value) : value,
    });
  };

  const handleWhatsAppRedirect = (e) => {
    e.preventDefault();

    if (!isValidEmail(form.email.trim())) {
      alert("Please enter a valid email address");
      return;
    }

    if (!isValidPhone(form.contactNumber.trim())) {
      alert("Please enter a valid contact number");
      return;
    }

    const message = encodeURIComponent(
      `*New Enquiry from OneMind Market Website*\n\n` +
        `*Name:* ${form.name}\n` +
        `*Brand Name:* ${form.brandName}\n` +
        `*Business Category:* ${form.businessCategory}\n` +
        `*Contact Number:* ${form.contactNumber}\n` +
        `*Email:* ${form.email}`,
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <form className="contact-form" onSubmit={handleWhatsAppRedirect}>
      <div className="contact-field">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="contact-field">
        <label htmlFor="brandName">Brand Name</label>
        <input
          type="text"
          id="brandName"
          name="brandName"
          value={form.brandName}
          onChange={handleChange}
          placeholder="Your brand or business name"
          required
        />
      </div>

      <div className="contact-field">
        <label htmlFor="businessCategory">Business Category</label>
        <input
          type="text"
          id="businessCategory"
          name="businessCategory"
          value={form.businessCategory}
          onChange={handleChange}
          placeholder="e.g., Restaurant, Salon, Builder"
          required
        />
      </div>

      <div className="contact-field">
        <label htmlFor="contactNumber">Contact Number</label>
        <input
          type="tel"
          id="contactNumber"
          name="contactNumber"
          value={form.contactNumber}
          onChange={handleChange}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          maxLength={10}
          required
        />
      </div>

      <div className="contact-field">
        <label htmlFor="email">Email ID</label>
        <input
          type="email"
          id="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="your@email.com"
          required
        />
      </div>

      <button type="submit" className="whatsapp-btn">
        <FaWhatsapp className="whatsapp-icon" />
        Send via WhatsApp
      </button>
    </form>
  );
};

export default AboutContactForm;
