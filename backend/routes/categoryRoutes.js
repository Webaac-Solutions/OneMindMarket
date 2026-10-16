const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Category = require("../models/Category");
const Customer = require("../models/Customer");
const { backupFiles, deleteBackup } = require("../utils/cloudinaryBackup");
const { imageOnlyFilter } = require("../utils/uploadSafety");
const router = express.Router();

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
  let base = slugify(baseText || "category");
  let slug = base;
  let i = 1;
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Category.findOne(q).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

const auth = require("../middleware/auth");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
      cb(null, `category-${Date.now()}${path.extname(file.originalname)}`),
  }),
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadImage = (req, res, next) =>
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });

function removeUpload(filename) {
  if (!filename) return;
  fs.unlink(path.join(__dirname, "..", "uploads", filename), () => {});
  deleteBackup(filename);
}

// Create category
router.post("/", auth, uploadImage, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      if (req.file) removeUpload(req.file.filename);
      return res.status(409).json({ message: "Category already exists" });
    }

    const slug = await generateUniqueSlug(name);
    const image = req.file ? req.file.filename : "";
    if (image) backupFiles([image]);
    const category = await Category.create({ name: name.trim(), slug, image });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all categories (admin) or categories with customers (user)
router.get("/", async (req, res) => {
  try {
    // Check if request has auth header (admin)
    const isAdmin =
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer");

    if (isAdmin) {
      // Return all categories for admin
      const categories = await Category.find().sort({ name: 1 });
      res.json(categories);
    } else {
      const categories = await Category.aggregate([
        {
          $lookup: {
            from: "customers",
            let: { categoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$category", "$$categoryId"] },
                  isActive: { $ne: false },
                },
              },
              { $project: { _id: 1 } },
            ],
            as: "customers",
          },
        },
        {
          $match: {
            "customers.0": { $exists: true },
          },
        },
        {
          $addFields: { count: { $size: "$customers" } },
        },
        {
          $project: { customers: 0 },
        },
        {
          $sort: { name: 1 },
        },
      ]);
      res.json(categories);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update category
router.put("/:id", auth, uploadImage, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const existing = await Category.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });
    if (existing) {
      if (req.file) removeUpload(req.file.filename);
      return res.status(409).json({ message: "Category already exists" });
    }

    const current = await Category.findById(req.params.id).lean();
    if (!current) {
      if (req.file) removeUpload(req.file.filename);
      return res.status(404).json({ message: "Category not found" });
    }

    const slug = await generateUniqueSlug(name, req.params.id);
    const update = { name: name.trim(), slug };
    if (req.file) {
      update.image = req.file.filename;
      backupFiles([req.file.filename]);
    }
    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (req.file) removeUpload(current.image);

    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete category
router.delete("/:id", auth, async (req, res) => {
  try {
    const inUse = await Customer.countDocuments({ category: req.params.id });
    if (inUse > 0)
      return res.status(409).json({
        message: `${inUse} customer${inUse > 1 ? "s" : ""} use this category. Reassign or delete them first.`,
      });
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    removeUpload(category.image);
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get category by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json({ message: "Not found" });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get admin-picked popular categories for the Business Listing page
router.get("/popular", async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $match: { isPopular: true } },
      {
        $lookup: {
          from: "customers",
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$category", "$$categoryId"] },
                isActive: { $ne: false },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "customers",
        },
      },
      { $addFields: { count: { $size: "$customers" } } },
      { $project: { customers: 0 } },
      { $sort: { name: 1 } },
    ]);
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle / set a category's "popular" flag
router.patch("/:id/popular", auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    if (typeof req.body.isPopular === "boolean") {
      category.isPopular = req.body.isPopular;
    } else {
      category.isPopular = !category.isPopular;
    }

    await category.save();
    res.json({ _id: category._id, isPopular: category.isPopular });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
