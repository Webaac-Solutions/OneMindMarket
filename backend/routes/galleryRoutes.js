const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Gallery = require("../models/Gallery");
const auth = require("../middleware/auth");
const { extractYoutubeId } = require("../utils/youtube");
const { isEmbeddable } = require("../utils/checkEmbeddable");
const { backupFiles, deleteBackup } = require("../utils/cloudinaryBackup");
const { isSafeImage, isSafeVideo } = require("../utils/uploadSafety");

const router = express.Router();

// multer storage (store in backend/uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = file.fieldname + "-" + Date.now();
    cb(null, base + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "images" && isSafeImage(file)) {
    cb(null, true);
  } else if (file.fieldname === "videos" && isSafeVideo(file)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype} for field ${file.fieldname}`,
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const uploadFields = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 5 },
]);

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
  let base = slugify(baseText || "gallery");
  let slug = base;
  let i = 1;
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Gallery.findOne(q).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

function normalizeWebsite(raw) {
  if (!raw || typeof raw !== "string") return "";
  let value = raw.trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    return url.hostname.includes(".") ? url.toString() : "";
  } catch {
    return "";
  }
}

async function ensureEmbeddable(items) {
  await Promise.all(
    items
      .filter((i) => i.website && typeof i.embeddable !== "boolean")
      .map(async (i) => {
        i.embeddable = await isEmbeddable(i.website);
        await Gallery.updateOne({ _id: i._id }, { embeddable: i.embeddable });
      }),
  );
}

function parseYoutubeLinks(raw) {
  if (!raw) return [];
  let links;
  try {
    links = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(links)) return [];
  const valid = [];
  for (const url of links) {
    if (typeof url === "string" && extractYoutubeId(url.trim())) {
      valid.push(url.trim());
    }
  }
  return valid;
}

function buildMediaArray(req) {
  const media = [];

  // Uploaded images
  if (req.files && req.files["images"]) {
    for (const f of req.files["images"]) {
      media.push({ type: "image", url: f.filename });
    }
  }

  // Uploaded videos
  if (req.files && req.files["videos"]) {
    for (const f of req.files["videos"]) {
      media.push({ type: "video", url: f.filename });
    }
  }

  // YouTube links
  const youtubeLinks = parseYoutubeLinks(req.body.youtubeLinks);
  for (const url of youtubeLinks) {
    media.push({ type: "youtube", url });
  }

  return media;
}

// Create gallery item
router.post("/", auth, uploadFields, async (req, res) => {
  try {
    const { title, caption, tags, visible, website } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    if (website && !normalizeWebsite(website)) {
      return res.status(400).json({ message: "Invalid website URL" });
    }

    const newMedia = buildMediaArray(req);
    if (newMedia.length === 0) {
      return res.status(400).json({
        message:
          "At least one media item (image, video, or YouTube link) is required",
      });
    }
    backupFiles(newMedia.filter((m) => m.type !== "youtube").map((m) => m.url));

    const slug = await generateUniqueSlug(title);

    // Auto-assign sortOrder to end of list
    const maxItem = await Gallery.findOne().sort({ sortOrder: -1 }).lean();
    const sortOrder = maxItem ? maxItem.sortOrder + 1 : 0;

    const normalizedSite = normalizeWebsite(website);
    const itemData = {
      title: title.trim(),
      slug,
      caption: caption || "",
      website: normalizedSite,
      embeddable: normalizedSite ? await isEmbeddable(normalizedSite) : false,
      media: newMedia,
      images: newMedia.filter((m) => m.type === "image").map((m) => m.url),
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      visible: visible === "false" ? false : true,
      sortOrder,
    };

    const item = await Gallery.create(itemData);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all gallery items - public: visible only sorted by sortOrder; admin: all
router.get("/", async (req, res) => {
  try {
    const isAdmin =
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer");

    if (isAdmin) {
      const items = await Gallery.find().sort({ sortOrder: 1 });
      await ensureEmbeddable(items);
      res.json(items);
    } else {
      const items = await Gallery.find({ visible: true }).sort({
        sortOrder: 1,
      });
      await ensureEmbeddable(items);
      res.json(items);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Bulk reorder gallery items
router.patch("/reorder", auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Items array is required" });
    }

    await Promise.all(
      items.map((item) =>
        Gallery.findByIdAndUpdate(item.id, { sortOrder: item.sortOrder }),
      ),
    );

    res.json({ message: "Order updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get gallery item by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Gallery.findOne({
      slug: req.params.slug,
      visible: true,
    });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get gallery item by id
router.get("/:id", async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update gallery item
router.put("/:id", auth, uploadFields, async (req, res) => {
  try {
    const { title, caption, tags, visible, website } = req.body;
    const itemId = req.params.id;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (caption !== undefined) updateData.caption = caption;
    if (website !== undefined) {
      if (website && !normalizeWebsite(website)) {
        return res.status(400).json({ message: "Invalid website URL" });
      }
      updateData.website = normalizeWebsite(website);
      updateData.embeddable = updateData.website
        ? await isEmbeddable(updateData.website)
        : false;
    }
    if (tags !== undefined) {
      updateData.tags = tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
    }
    if (visible !== undefined) {
      updateData.visible = visible === "true" || visible === true;
    }

    // Handle media merging: keep existing + add new uploads/links
    let existingMedia;
    try {
      existingMedia = req.body.existingMedia
        ? JSON.parse(req.body.existingMedia)
        : undefined;
    } catch (e) {
      existingMedia = undefined;
    }

    const newMedia = buildMediaArray(req);
    backupFiles(newMedia.filter((m) => m.type !== "youtube").map((m) => m.url));

    if (existingMedia !== undefined || newMedia.length > 0) {
      let base = [];
      if (existingMedia !== undefined) {
        base = existingMedia;
      } else {
        const currentItem = await Gallery.findById(itemId).lean();
        base = currentItem?.media || [];
      }
      updateData.media = [...base, ...newMedia];
      updateData.images = updateData.media
        .filter((m) => m.type === "image")
        .map((m) => m.url);
    }

    // regenerate slug if title changed
    if (updateData.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, itemId);
    }

    const item = await Gallery.findByIdAndUpdate(itemId, updateData, {
      new: true,
    });
    if (!item)
      return res.status(404).json({ message: "Gallery item not found" });

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete gallery item
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item)
      return res.status(404).json({ message: "Gallery item not found" });

    // Delete uploaded files from disk
    const filesToDelete = (item.media || [])
      .filter((m) => m.type === "image" || m.type === "video")
      .map((m) => m.url);
    // Also check legacy images field
    if (item.images && item.images.length > 0) {
      for (const img of item.images) {
        if (!filesToDelete.includes(img)) filesToDelete.push(img);
      }
    }
    for (const filename of filesToDelete) {
      const filePath = path.join(__dirname, "..", "uploads", filename);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT")
          console.error("Failed to delete file:", filePath, err.message);
      });
      deleteBackup(filename);
    }

    res.json({ message: "Gallery item deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
