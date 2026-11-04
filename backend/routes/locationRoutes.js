const express = require("express");
const Location = require("../models/Location");
const router = express.Router();
const Customer = require("../models/Customer");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(baseText, excludeId) {
  let base = slugify(baseText || "location");
  let slug = base;
  let i = 1;
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Location.findOne(q).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

// Create location
const auth = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const existing = await Location.findOne({ name: name.trim() });
    if (existing)
      return res.status(409).json({ message: "Location already exists" });

    const slug = await generateUniqueSlug(name);
    const location = await Location.create({ name: name.trim(), slug });
    res.status(201).json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update location
router.put("/:id", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const existing = await Location.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });
    if (existing)
      return res.status(409).json({ message: "Location already exists" });

    const slug = await generateUniqueSlug(name, req.params.id);
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), slug },
      { new: true },
    );
    if (!location)
      return res.status(404).json({ message: "Location not found" });

    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete location
router.delete("/:id", auth, async (req, res) => {
  try {
    const inUse = await Customer.countDocuments({ location: req.params.id });
    if (inUse > 0)
      return res.status(409).json({
        message: `${inUse} customer${inUse > 1 ? "s" : ""} use this location. Reassign or delete them first.`,
      });
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location)
      return res.status(404).json({ message: "Location not found" });
    res.json({ message: "Location deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get location by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const location = await Location.findOne({ slug: req.params.slug });
    if (!location) return res.status(404).json({ message: "Not found" });
    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get categories available in a specific location
router.get("/:id/categories", async (req, res) => {
  try {
    const locId = req.params.id;
    // find customers in this location and populate category
    const customers = await Customer.find({
      location: locId,
      isActive: { $ne: false },
    }).populate("category");
    const map = new Map();
    customers.forEach((c) => {
      const cat = c.category;
      if (!cat || !cat._id) return;
      const key = cat._id.toString();
      if (!map.has(key)) {
        map.set(key, {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          count: 0,
        });
      }
      map.get(key).count += 1;
    });
    const list = Array.from(map.values());
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
