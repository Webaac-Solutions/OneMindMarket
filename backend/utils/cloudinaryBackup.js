const fs = require("fs");
const path = require("path");
const https = require("https");
const { cloudinary, USE_CLOUDINARY } = require("../config/cloudinary");

const uploadDir = path.join(__dirname, "..", "uploads");

function backupFile(filename) {
  if (!USE_CLOUDINARY || !filename) return;
  const filePath = path.join(uploadDir, filename);
  cloudinary.uploader.upload(
    filePath,
    { public_id: filename, resource_type: "raw", overwrite: true },
    (err) => {
      if (err)
        console.error("Cloudinary backup failed for", filename, err.message);
    },
  );
}

function backupFiles(filenames) {
  (filenames || []).filter(Boolean).forEach(backupFile);
}

// Remove the Cloudinary copy when a file is deleted locally.
function deleteBackup(filename) {
  if (!USE_CLOUDINARY || !filename) return;
  cloudinary.uploader.destroy(filename, { resource_type: "raw" }, () => {});
}

async function restoreMissingFiles() {
  if (!USE_CLOUDINARY) return;
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const Customer = require("../models/Customer");
    const Gallery = require("../models/Gallery");
    const Article = require("../models/Article");
    const Category = require("../models/Category");

    const filenames = new Set();

    const customers = await Customer.find()
      .select("shopPhoto ownerPhoto shopPhotos")
      .lean();
    customers.forEach((c) => {
      if (c.shopPhoto) filenames.add(c.shopPhoto);
      if (c.ownerPhoto) filenames.add(c.ownerPhoto);
      (c.shopPhotos || []).forEach((f) => filenames.add(f));
    });

    const galleryItems = await Gallery.find().select("media images").lean();
    galleryItems.forEach((g) => {
      (g.media || []).forEach((m) => {
        if (m.type === "image" || m.type === "video") filenames.add(m.url);
      });
      (g.images || []).forEach((f) => filenames.add(f));
    });

    const categories = await Category.find().select("image").lean();
    categories.forEach((c) => {
      if (c.image) filenames.add(c.image);
    });

    const articles = await Article.find().select("featuredImage").lean();
    articles.forEach((a) => {
      if (a.featuredImage) filenames.add(a.featuredImage);
    });

    const Announcement = require("../models/Announcement");
    const announcements = await Announcement.find().select("image").lean();
    announcements.forEach((a) => {
      if (a.image) filenames.add(a.image);
    });

    const missing = [...filenames].filter(
      (f) => !fs.existsSync(path.join(uploadDir, f)),
    );

    if (missing.length === 0) return;
    console.log(
      `Cloudinary restore: fetching ${missing.length} missing file(s)...`,
    );

    for (const filename of missing) {
      try {
        const url = cloudinary.url(filename, {
          resource_type: "raw",
          secure: true,
        });
        await downloadTo(url, path.join(uploadDir, filename));
      } catch (err) {
        console.error("Cloudinary restore failed for", filename, err.message);
      }
    }
    console.log("Cloudinary restore complete.");
  } catch (err) {
    console.error("Cloudinary restore error:", err.message);
  }
}

function downloadTo(url, destPath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200)
          return reject(new Error(`HTTP ${res.statusCode}`));
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });
}

module.exports = { backupFile, backupFiles, deleteBackup, restoreMissingFiles };
