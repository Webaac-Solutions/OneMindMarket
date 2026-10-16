const express = require("express");
const router = express.Router();
const Enquiry = require("../models/Enquiry");
const Customer = require("../models/Customer");
const { sendEnquiryNotification } = require("../utils/whatsapp");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

router.post("/", async (req, res) => {
  try {
    const {
      shopId,
      name,
      phone,
      enquiry: enquiryDetails,
      referredBy,
    } = req.body || {};
    if (!shopId || !name || !phone || !enquiryDetails) {
      return res.status(400).json({
        message: "Shop, name, phone, and enquiry details are required",
      });
    }

    const clean = (v, max) =>
      typeof v === "string" ? v.trim().slice(0, max) : "";
    const cleanName = clean(name, 100);
    const cleanPhone = clean(phone, 20);
    const cleanEnquiry = clean(enquiryDetails, 1000);
    const cleanReferredBy = clean(referredBy, 100);

    if (typeof shopId !== "string" || !mongoose.isValidObjectId(shopId))
      return res.status(400).json({ message: "Invalid business" });
    if (!cleanName || !cleanEnquiry)
      return res.status(400).json({
        message: "Shop, name, phone, and enquiry details are required",
      });
    const digits = cleanPhone.replace(/\D/g, "");
    if (
      !/^[+\d][\d\s-]*$/.test(cleanPhone) ||
      digits.length < 10 ||
      digits.length > 13
    )
      return res
        .status(400)
        .json({ message: "Please enter a valid phone number" });

    const shop = await Customer.findById(shopId).select(
      "shopName ownerPhone isActive",
    );
    if (!shop || shop.isActive === false)
      return res.status(404).json({ message: "Business not found" });

    const enquiry = await Enquiry.create({
      shop: shopId,
      name: cleanName,
      phone: cleanPhone,
      enquiry: cleanEnquiry,
      referredBy: cleanReferredBy,
    });

    let whatsappNotification = { sent: false };
    try {
      whatsappNotification = await sendEnquiryNotification({ shop, enquiry });
    } catch (whatsAppError) {
      // The enquiry remains saved even if Meta is temporarily unavailable.
      console.error(
        "WhatsApp enquiry notification failed:",
        whatsAppError.message,
      );
      whatsappNotification = {
        sent: false,
        reason: "WhatsApp notification could not be sent",
      };
    }

    res.status(201).json({ enquiry, whatsappNotification });
  } catch (err) {
    console.error("Failed to save enquiry:", err.message);
    res.status(500).json({ message: "Failed to save enquiry" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate("shop")
      .sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/handled", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid enquiry" });
    const handled = req.body?.handled === true || req.body?.handled === "true";
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { handled },
      { new: true },
    );
    if (!enquiry) return res.status(404).json({ message: "Not found" });
    res.json(enquiry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/", auth, async (req, res) => {
  await Enquiry.deleteMany({});
  res.json({ success: true });
});

module.exports = router;
