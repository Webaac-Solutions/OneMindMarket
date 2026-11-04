const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Announcement = require("../models/Announcement");
const auth = require("../middleware/auth");
const { sendPush, getSubscriberCount } = require("../utils/onesignal");
const { backupFile, deleteBackup } = require("../utils/cloudinaryBackup");
const { imageOnlyFilter } = require("../utils/uploadSafety");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `announcement-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

const uploadImage = (req, res, next) =>
  upload.single("image")(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Image must be under 8MB" : err.message;
    res.status(400).json({ message });
  });

const removeFile = (filename) => {
  if (!filename) return;
  fs.unlink(path.join(__dirname, "..", "uploads", filename), () => {});
};

const publicBase = (req) =>
  process.env.BACKEND_PUBLIC_URL ||
  `${(req.get("x-forwarded-proto") || req.protocol).split(",")[0]}://${req.get("host")}`;

const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const clients = new Set();
const broadcast = (event, data) => {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((client) => client.write(msg));
};

router.get("/stream", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write(": connected\n\n");
  clients.add(res);
  const beat = setInterval(() => res.write(": ping\n\n"), 25000);
  req.on("close", () => {
    clearInterval(beat);
    clients.delete(res);
  });
});

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
// Link must be a site path (/articles) or a full http(s) URL
const validLink = (u) =>
  !u || /^\/(?!\/)\S*$/.test(u) || /^https?:\/\/\S+$/i.test(u);

// Public: announcements for the bell menu and admin list (paged with skip/limit, optional q search)
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 50);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const q = clean(req.query.q, 80);
    const filter = q
      ? {
          $or: [
            { title: new RegExp(escapeRegex(q), "i") },
            { message: new RegExp(escapeRegex(q), "i") },
          ],
        }
      : {};
    const items = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title message url image pushStatus createdAt")
      .lean();
    res.json(items);
  } catch (err) {
    console.error("Failed to load announcements:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: approximate number of subscribed devices
router.get("/subscribers", auth, async (req, res) => {
  const count = await getSubscriberCount();
  res.json({ count });
});

// Admin: save the announcement, then push it to subscribers if requested
router.post("/", auth, uploadImage, async (req, res) => {
  const image = req.file ? req.file.filename : "";
  try {
    const title = clean(req.body?.title, 65);
    const message = clean(req.body?.message, 240);
    const url = clean(req.body?.url, 300);

    if (!title || !message) {
      removeFile(image);
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }
    if (!validLink(url)) {
      removeFile(image);
      return res
        .status(400)
        .json({ message: "Link must start with / or http(s)://" });
    }

    const announcement = await Announcement.create({
      title,
      message,
      url,
      image,
    });
    backupFile(image);

    const wantsPush =
      req.body?.sendPush !== false && req.body?.sendPush !== "false";
    let push = { sent: false, reason: "Push not requested" };
    if (wantsPush) {
      try {
        push = await sendPush({
          title,
          message,
          url,
          image: image ? `${publicBase(req)}/uploads/push/${image}` : "",
        });
      } catch (pushError) {
        // Announcement stays saved (and visible in the bell) if OneSignal is down
        console.error("OneSignal push failed:", pushError.message);
        push = { sent: false, reason: "Push notification could not be sent" };
      }
      announcement.pushStatus = push.sent ? "sent" : "failed";
      announcement.pushId = push.id || "";
      await announcement.save();
    }

    const { pushId, __v, ...publicItem } = announcement.toObject();
    broadcast("announcement", publicItem);

    res.status(201).json({ announcement, push });
  } catch (err) {
    removeFile(image);
    console.error("Failed to create announcement:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: remove from the bell list (already-delivered pushes can't be recalled)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid id" });
    const removed = await Announcement.findByIdAndDelete(req.params.id);
    if (removed?.image) {
      removeFile(removed.image);
      deleteBackup(removed.image);
    }
    broadcast("removed", { id: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Failed to delete announcement:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
