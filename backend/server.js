const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = require("./config/db");

const categoryRoutes = require("./routes/categoryRoutes");
const locationRoutes = require("./routes/locationRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/authRoutes");
const joinRequestRoutes = require("./routes/joinRequestRoutes");
const articleRoutes = require("./routes/articleRoutes");
const galleryRoutes = require("./routes/galleryRoutes");

const rateLimit = require("./middleware/rateLimit");

const app = express();

app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:3000",
      "http://localhost:3001", // Local admin
      "https://onemindmarket.in",
      "https://www.onemindmarket.in",
      "https://onemind-admin.netlify.app",
    ];

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use("/uploads", express.static(uploadDir));

// Return 404 for missing upload files (prevents SPA catch-all from serving HTML for missing images)
app.use("/uploads", (req, res) => {
  res.status(404).send("File not found");
});

// Serve compressed thumbnails for og:image (WhatsApp/social media have ~300KB limit)
const sharp = require("sharp");
app.get("/uploads/thumb/:filename", async (req, res) => {
  const safeName = path.basename(req.params.filename);
  if (safeName !== req.params.filename)
    return res.status(400).send("Invalid file name");
  const filePath = path.join(uploadDir, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).send("Not found");
  try {
    const thumbnail = await sharp(filePath)
      .resize(1200, 630, { fit: "cover" })
      .jpeg({ quality: 70 })
      .toBuffer();
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(thumbnail);
  } catch (err) {
    console.error("Thumbnail error:", err.message);
    res.status(500).send("Error processing image");
  }
});

app.get("/uploads/push/:filename", async (req, res) => {
  const safeName = path.basename(req.params.filename);
  if (safeName !== req.params.filename)
    return res.status(400).send("Invalid file name");
  const filePath = path.join(uploadDir, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).send("Not found");
  try {
    const image = await sharp(filePath)
      .resize(1024, 512, { fit: "cover" })
      .jpeg({ quality: 75 })
      .toBuffer();
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(image);
  } catch (err) {
    console.error("Push image error:", err.message);
    res.status(500).send("Error processing image");
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

connectDB(MONGO_URI);

// ensure admin user exists if env vars provided
const ensureSlugs = require("./utils/ensureSlugs");
ensureSlugs();

const migrateGalleryMedia = require("./utils/migrateGalleryMedia");
migrateGalleryMedia();

require("./utils/cloudinaryBackup").restoreMissingFiles();

app.post(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts. Try again in 15 minutes.",
  }),
);
app.post(
  "/api/join-requests",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Too many requests. Please try again later.",
  }),
);
app.post(
  "/api/enquiries",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many enquiries. Please try again later.",
  }),
);
app.post(
  "/api/announcements",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: "Too many announcements. Please try again later.",
  }),
);
const trackingLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.post("/api/customers/:id/call", trackingLimiter);
app.post("/api/customers/slug/:slug/view", trackingLimiter);

app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/enquiries", require("./routes/enquiryRoutes"));
app.use("/api/articles", articleRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/announcements", require("./routes/announcementRoutes"));

// SEO routes - at root for /sitemap.xml and /robots.txt (Nginx proxies these to backend)
app.use("/", require("./routes/seoRoutes"));

// Health check (non-blocking - uses /api/health so it doesn't intercept frontend routes)
app.get("/api/health", (req, res) =>
  res.send("MERN Search Backend is running"),
);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (
    err &&
    (err.name === "MulterError" ||
      /image|file type|CORS/i.test(err.message || ""))
  )
    return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
