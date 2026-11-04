const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Article = require("../models/Article");
const auth = require("../middleware/auth");
const { backupFile, deleteBackup } = require("../utils/cloudinaryBackup");
const { imageOnlyFilter } = require("../utils/uploadSafety");
const sanitizeContent = require("../utils/sanitizeHtml");

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

const upload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

const withCleanContent = (article) => {
  const obj = article.toObject ? article.toObject() : article;
  obj.content = sanitizeContent(obj.content);
  return obj;
};

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
  let base = slugify(baseText || "article");
  let slug = base;
  let i = 1;
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Article.findOne(q).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

// Create article
router.post("/", auth, upload.single("featuredImage"), async (req, res) => {
  try {
    const { title, content, excerpt, status, tags, author } = req.body;
    if (!title || !content)
      return res
        .status(400)
        .json({ message: "Title and content are required" });

    const slug = await generateUniqueSlug(title);
    const articleData = {
      title: title.trim(),
      slug,
      content: sanitizeContent(content),
      excerpt: excerpt || "",
      status: status || "draft",
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      author: author || "Admin",
    };

    if (req.file) articleData.featuredImage = req.file.filename;
    backupFile(articleData.featuredImage);

    const article = await Article.create(articleData);
    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all articles
router.get("/", async (req, res) => {
  try {
    const isAdmin = auth.isAdminRequest(req);

    if (isAdmin) {
      const articles = await Article.find().sort({ createdAt: -1 });
      res.json(articles.map(withCleanContent));
    } else {
      const articles = await Article.find({ status: "published" }).sort({
        createdAt: -1,
      });
      res.json(articles.map(withCleanContent));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get article by id
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Not found" });
    if (article.status !== "published" && !auth.isAdminRequest(req))
      return res.status(404).json({ message: "Not found" });
    res.json(withCleanContent(article));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get article by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      status: "published",
    });
    if (!article) return res.status(404).json({ message: "Not found" });
    res.json(withCleanContent(article));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update article
router.put("/:id", auth, upload.single("featuredImage"), async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      status,
      tags,
      author,
      removeFeaturedImage,
    } = req.body;
    const articleId = req.params.id;

    const existingArticle = await Article.findById(articleId);
    if (!existingArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = sanitizeContent(content);
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (status !== undefined) updateData.status = status;
    if (author !== undefined) updateData.author = author;
    if (tags !== undefined) {
      updateData.tags = tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
    }

    // Track a file to delete from disk/Cloudinary after the DB update succeeds
    let fileToDelete = null;

    if (req.file) {
      updateData.featuredImage = req.file.filename;
      if (existingArticle.featuredImage)
        fileToDelete = existingArticle.featuredImage;
    } else if (removeFeaturedImage === "true") {
      if (existingArticle.featuredImage)
        fileToDelete = existingArticle.featuredImage;
      updateData.featuredImage = "";
    }
    backupFile(updateData.featuredImage);

    // regenerate slug if title changed
    if (updateData.title && updateData.title !== existingArticle.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, articleId);
    }

    const article = await Article.findByIdAndUpdate(articleId, updateData, {
      new: true,
    });
    if (!article) return res.status(404).json({ message: "Article not found" });

    if (fileToDelete) {
      const filePath = path.join("uploads", fileToDelete);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT")
          console.error(
            "Failed to delete local file",
            fileToDelete,
            err.message,
          );
      });
      deleteBackup(fileToDelete);
    }

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete article
router.delete("/:id", auth, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Delete featured image from disk
    if (article.featuredImage) {
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        article.featuredImage,
      );
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT")
          console.error("Failed to delete file:", filePath, err.message);
      });
      deleteBackup(article.featuredImage);
    }

    res.json({ message: "Article deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
