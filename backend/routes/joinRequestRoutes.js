const express = require("express");
const router = express.Router();
const JoinRequest = require("../models/JoinRequest");
const auth = require("../middleware/auth");

// Get all join requests
router.get("/", auth, async (req, res) => {
  try {
    const requests = await JoinRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create join request
router.post("/", async (req, res) => {
  try {
    const clean = (v, max) =>
      typeof v === "string" ? v.trim().slice(0, max) : "";
    const name = clean(req.body?.name, 100);
    const mobile = clean(req.body?.mobile, 20);
    const location = clean(req.body?.location, 100);
    const category = clean(req.body?.category, 100);

    if (!name || !mobile || !location || !category)
      return res.status(400).json({ message: "Please fill all fields" });

    const digits = mobile.replace(/\D/g, "");
    if (
      !/^[+\d][\d\s-]*$/.test(mobile) ||
      digits.length < 10 ||
      digits.length > 13
    )
      return res
        .status(400)
        .json({ message: "Please enter a valid mobile number" });

    const joinRequest = await JoinRequest.create({
      name,
      mobile,
      location,
      category,
    });
    res.status(201).json(joinRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete join request
router.delete("/:id", auth, async (req, res) => {
  try {
    const request = await JoinRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Request deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
