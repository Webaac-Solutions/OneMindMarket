const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const Customer = require("../models/Customer");
const Category = require("../models/Category");
const Location = require("../models/Location");
const Enquiry = require("../models/Enquiry");
const CallLog = require("../models/CallLog");
const VisitLog = require("../models/VisitLog");
const crypto = require("crypto");
const { imageOnlyFilter } = require("../utils/uploadSafety");

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
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per file cap
});

// Resize/compress an uploaded image in place so large photos
async function compressImage(file) {
  if (!file) return;
  const filePath = path.join("uploads", file.filename);
  try {
    const buffer = await sharp(filePath)
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    await fs.promises.writeFile(filePath, buffer);
  } catch (err) {
    console.error("Image compression failed for", file.filename, err.message);
  }
}

async function compressUploadedFiles(files) {
  if (!files) return;
  const all = [
    ...(files.shopPhoto || []),
    ...(files.ownerPhoto || []),
    ...(files.shopPhotos || []),
  ];
  await Promise.all(all.map(compressImage));
}

// helper: slugify and ensure unique slug
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
  let base = slugify(baseText || "shop");
  let slug = base;
  let i = 1;
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Customer.findOne(q).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

// Create customer with file uploads (shopPhoto, ownerPhoto, shopPhotos)
const auth = require("../middleware/auth");
const { backupFiles, deleteBackup } = require("../utils/cloudinaryBackup");

const parseActive = (value) => !(value === false || value === "false");

router.post(
  "/",
  auth,
  upload.fields([
    { name: "shopPhoto", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "shopPhotos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const body = req.body;

      // Validate category & location ids exist
      const category = await Category.findById(body.category);
      const location = await Location.findById(body.location);
      if (!category || !location) {
        return res
          .status(400)
          .json({ message: "Invalid category or location" });
      }

      const customerData = {
        shopName: body.shopName,
        ownerName: body.ownerName,
        ownerPhone: body.ownerPhone,
        shopPhone: body.shopPhone,
        email: body.email,
        website: body.website,
        address: body.address,
        shopDescription: body.shopDescription,
        shopArticle: body.shopArticle,
        category: body.category,
        location: body.location,
        joinedAt: body.joinedAt ? new Date(body.joinedAt) : null,
        isActive: parseActive(body.isActive),
      };

      if (req.files?.shopPhoto?.[0])
        customerData.shopPhoto = req.files.shopPhoto[0].filename;
      if (req.files?.ownerPhoto?.[0])
        customerData.ownerPhoto = req.files.ownerPhoto[0].filename;
      if (req.files?.shopPhotos?.length > 0) {
        customerData.shopPhotos = req.files.shopPhotos.map((f) => f.filename);
      }
      await compressUploadedFiles(req.files);
      backupFiles([
        customerData.shopPhoto,
        customerData.ownerPhoto,
        ...(customerData.shopPhotos || []),
      ]);

      // generate unique slug for shopName
      customerData.slug = await generateUniqueSlug(customerData.shopName);

      const customer = await Customer.create(customerData);

      res.status(201).json(customer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get all customers
router.get("/", async (req, res) => {
  try {
    const { category, location, q, featured, page, limit } = req.query;
    const filter = {};
    if (!auth.isAdminRequest(req)) filter.isActive = { $ne: false };

    if (typeof category === "string" && category) filter.category = category;
    if (typeof location === "string" && location) filter.location = location;
    if (typeof q === "string" && q) {
      const safeQ = q.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.shopName = { $regex: safeQ, $options: "i" };
    }
    if (featured === "true") filter.isOneMindApproved = true;

    // If no page param, return all results as plain array
    if (!page) {
      const customers = await Customer.find(filter)
        .populate("category location")
        .sort({ isOneMindApproved: -1, createdAt: -1 });
      return res.json(customers);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .select(
          "shopName slug shopPhoto shopDescription category location viewCount createdAt isOneMindApproved",
        )
        .populate("category location")
        .sort({ isOneMindApproved: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Customer.countDocuments(filter),
    ]);

    res.json({
      results: customers,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Per-customer enquiry and call totals (admin)
router.get("/admin/stats", auth, async (req, res) => {
  try {
    const [enquiries, calls, visits] = await Promise.all([
      Enquiry.aggregate([{ $group: { _id: "$shop", count: { $sum: 1 } } }]),
      CallLog.aggregate([
        {
          $group: {
            _id: "$shop",
            count: { $sum: 1 },
            lastCallAt: { $max: "$createdAt" },
          },
        },
      ]),
      VisitLog.aggregate([
        {
          $group: {
            _id: "$shop",
            visitCount: { $sum: 1 },
            visitors: { $addToSet: "$visitor" },
            lastVisitAt: { $max: "$createdAt" },
          },
        },
      ]),
    ]);
    const stats = {};
    const entry = (id) => {
      if (!stats[id]) {
        stats[id] = {
          enquiryCount: 0,
          callCount: 0,
          lastCallAt: null,
          visitCount: 0,
          uniqueVisitors: 0,
          lastVisitAt: null,
        };
      }
      return stats[id];
    };
    enquiries.forEach((e) => {
      entry(e._id).enquiryCount = e.count;
    });
    calls.forEach((c) => {
      const s = entry(c._id);
      s.callCount = c.count;
      s.lastCallAt = c.lastCallAt;
    });
    visits.forEach((v) => {
      const s = entry(v._id);
      s.visitCount = v.visitCount;
      s.uniqueVisitors = v.visitors.length;
      s.lastVisitAt = v.lastVisitAt;
    });
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Enquiry and call activity for one customer (admin)
router.get("/:id/activity", auth, async (req, res) => {
  try {
    const shop = req.params.id;
    const shopId = new mongoose.Types.ObjectId(shop);
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [
      enquiryCount,
      callCount,
      lastCalls,
      last30,
      customer,
      visitCount,
      visitors,
      visits30,
      recentVisits,
      deviceStats,
    ] = await Promise.all([
      Enquiry.countDocuments({ shop }),
      CallLog.countDocuments({ shop }),
      CallLog.find({ shop }).sort({ createdAt: -1 }).limit(20).lean(),
      CallLog.aggregate([
        { $match: { shop: shopId, createdAt: { $gte: since } } },
        { $count: "count" },
      ]),
      Customer.findById(shop).select("viewCount").lean(),
      VisitLog.countDocuments({ shop }),
      VisitLog.distinct("visitor", { shop }),
      VisitLog.countDocuments({ shop, createdAt: { $gte: since } }),
      VisitLog.find({ shop }).sort({ createdAt: -1 }).limit(20).lean(),
      VisitLog.aggregate([
        { $match: { shop: shopId } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
      ]),
    ]);
    const devices = {};
    deviceStats.forEach((d) => {
      devices[d._id] = d.count;
    });
    res.json({
      enquiryCount,
      callCount,
      callsLast30Days: last30[0]?.count || 0,
      recentCalls: lastCalls,
      totalViews: customer?.viewCount || 0,
      visitCount,
      uniqueVisitors: visitors.length,
      visitsLast30Days: visits30,
      devices,
      recentVisits: recentVisits.map((v) => ({
        _id: v._id,
        createdAt: v.createdAt,
        device: v.device,
        browser: v.browser,
        referrer: v.referrer,
        visitorId: (v.visitor || "").slice(0, 6),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Record a click on a customer's Call button
const recentCalls = new Map();

router.post("/:id/call", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select("isActive");
    if (!customer || customer.isActive === false)
      return res.status(404).json({ message: "Not found" });

    const ip =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip;
    const key = `${customer._id}:${ip}`;
    const now = Date.now();
    if (now - (recentCalls.get(key) || 0) > 30 * 1000) {
      recentCalls.set(key, now);
      const source = ["profile", "listing"].includes(req.body?.source)
        ? req.body.source
        : "profile";
      await CallLog.create({ shop: customer._id, source });
    }
    if (recentCalls.size > 5000) recentCalls.clear();

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single customer by id
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "category location",
    );
    if (!customer || (customer.isActive === false && !auth.isAdminRequest(req)))
      return res.status(404).json({ message: "Not found" });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single customer by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const customer = await Customer.findOne({ slug: req.params.slug }).populate(
      "category location",
    );
    if (!customer || (customer.isActive === false && !auth.isAdminRequest(req)))
      return res.status(404).json({ message: "Not found" });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const viewedIPs = {};
const recentVisitKeys = new Map();

function parseDevice(ua) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

function parseBrowser(ua) {
  if (/edg/i.test(ua)) return "Edge";
  if (/opr|opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

function parseReferrer(raw) {
  if (!raw || typeof raw !== "string") return "Direct";
  try {
    return new URL(raw).hostname.replace(/^www\./, "") || "Direct";
  } catch {
    return "Direct";
  }
}

// Record a profile view (unique per IP)
router.post("/slug/:slug/view", async (req, res) => {
  try {
    const customer = await Customer.findOne({ slug: req.params.slug });
    if (!customer) return res.status(404).json({ message: "Not found" });

    const ip =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip;
    const customerId = customer._id.toString();

    if (!viewedIPs[customerId]) {
      viewedIPs[customerId] = new Set();
    }

    if (!viewedIPs[customerId].has(ip)) {
      viewedIPs[customerId].add(ip);
      customer.viewCount = (customer.viewCount || 0) + 1;
      await customer.save();
    }

    if (customer.isActive !== false) {
      const ua = req.headers["user-agent"] || "";
      const visitor = crypto
        .createHash("sha256")
        .update(`${ip}|${ua}|${process.env.JWT_SECRET || ""}`)
        .digest("hex")
        .slice(0, 12);
      const key = `${customerId}:${visitor}`;
      const now = Date.now();
      if (now - (recentVisitKeys.get(key) || 0) > 30 * 60 * 1000) {
        recentVisitKeys.set(key, now);
        await VisitLog.create({
          shop: customer._id,
          visitor,
          device: parseDevice(ua),
          browser: parseBrowser(ua),
          referrer: parseReferrer(req.body?.referrer),
        });
      }
      if (recentVisitKeys.size > 5000) recentVisitKeys.clear();
    }

    res.json({ viewCount: customer.viewCount || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get view count without incrementing
router.get("/slug/:slug/views", async (req, res) => {
  try {
    const customer = await Customer.findOne({ slug: req.params.slug }).select(
      "viewCount",
    );
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json({ viewCount: customer.viewCount || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get customer photos
router.get("/:id/photos", async (req, res) => {
  try {
    const groupQ = req.query.group;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Not found" });
    const photos = Array.isArray(customer.shopPhotos)
      ? customer.shopPhotos
      : [];

    if (!groupQ) {
      return res.json(photos);
    }

    const group = parseInt(groupQ, 10);
    if (![1, 2, 3].includes(group)) {
      return res.status(400).json({ message: "group must be 1, 2 or 3" });
    }

    const groupPhotos = photos.filter((_, idx) => idx % 3 === group - 1);
    return res.json(groupPhotos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update customer
router.put(
  "/:id",
  auth,
  upload.fields([
    { name: "shopPhoto", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "shopPhotos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const body = req.body;
      const customerId = req.params.id;

      const existingCustomer = await Customer.findById(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Validate category & location ids exist if provided
      if (body.category) {
        const category = await Category.findById(body.category);
        if (!category)
          return res.status(400).json({ message: "Invalid category" });
      }
      if (body.location) {
        const location = await Location.findById(body.location);
        if (!location)
          return res.status(400).json({ message: "Invalid location" });
      }

      const updateData = {
        shopName: body.shopName,
        ownerName: body.ownerName,
        ownerPhone: body.ownerPhone,
        shopPhone: body.shopPhone,
        email: body.email,
        website: body.website,
        address: body.address,
        shopDescription: body.shopDescription,
        shopArticle: body.shopArticle,
        category: body.category,
        location: body.location,
      };

      if (body.isActive !== undefined)
        updateData.isActive = parseActive(body.isActive);

      if (body.joinedAt !== undefined)
        updateData.joinedAt = body.joinedAt ? new Date(body.joinedAt) : null;

      const filesToDelete = [];

      // Explicit deletion of the shop photo (only applies if no new one is uploaded)
      if (body.removeShopPhoto === "true" && !req.files?.shopPhoto?.[0]) {
        if (existingCustomer.shopPhoto)
          filesToDelete.push(existingCustomer.shopPhoto);
        updateData.shopPhoto = "";
      }

      // Explicit deletion of the owner photo (only applies if no new one is uploaded)
      if (body.removeOwnerPhoto === "true" && !req.files?.ownerPhoto?.[0]) {
        if (existingCustomer.ownerPhoto)
          filesToDelete.push(existingCustomer.ownerPhoto);
        updateData.ownerPhoto = "";
      }

      // Explicit deletion of individual additional shop photos
      const removeShopPhotosList = [].concat(body.removeShopPhotos || []);
      let keptShopPhotos = existingCustomer.shopPhotos || [];
      if (removeShopPhotosList.length > 0) {
        keptShopPhotos = keptShopPhotos.filter(
          (p) => !removeShopPhotosList.includes(p),
        );
        filesToDelete.push(
          ...(existingCustomer.shopPhotos || []).filter((p) =>
            removeShopPhotosList.includes(p),
          ),
        );
      }

      if (req.files?.shopPhoto?.[0])
        updateData.shopPhoto = req.files.shopPhoto[0].filename;
      if (req.files?.ownerPhoto?.[0])
        updateData.ownerPhoto = req.files.ownerPhoto[0].filename;
      if (req.files?.shopPhotos?.length > 0) {
        updateData.shopPhotos = [
          ...keptShopPhotos,
          ...req.files.shopPhotos.map((f) => f.filename),
        ];
      } else if (removeShopPhotosList.length > 0) {
        updateData.shopPhotos = keptShopPhotos;
      }

      await compressUploadedFiles(req.files);
      backupFiles([
        updateData.shopPhoto,
        updateData.ownerPhoto,
        ...(updateData.shopPhotos || []),
      ]);

      if (
        updateData.shopName &&
        updateData.shopName !== existingCustomer.shopName
      ) {
        updateData.slug = await generateUniqueSlug(
          updateData.shopName,
          customerId,
        );
      }

      const customer = await Customer.findByIdAndUpdate(
        customerId,
        updateData,
        { new: true },
      ).populate("category location");
      if (!customer)
        return res.status(404).json({ message: "Customer not found" });

      // Clean up removed files from disk and Cloudinary now that the DB is updated
      if (filesToDelete.length > 0) {
        filesToDelete.forEach((filename) => {
          const filePath = path.join("uploads", filename);
          fs.unlink(filePath, (err) => {
            if (err && err.code !== "ENOENT") {
              console.error(
                "Failed to delete local file",
                filename,
                err.message,
              );
            }
          });
          deleteBackup(filename);
        });
      }

      res.json(customer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Toggle / set One Mind Approved status
router.patch("/:id/one-mind-approved", auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    customer.isOneMindApproved =
      typeof req.body.isOneMindApproved === "boolean"
        ? req.body.isOneMindApproved
        : !customer.isOneMindApproved;

    await customer.save();
    res.json({
      _id: customer._id,
      isOneMindApproved: customer.isOneMindApproved,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle / set active status
router.patch("/:id/active", auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    customer.isActive =
      typeof req.body.isActive === "boolean"
        ? req.body.isActive
        : customer.isActive === false;

    await customer.save();
    res.json({ _id: customer._id, isActive: customer.isActive });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete customer
router.delete("/:id", auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });
    CallLog.deleteMany({ shop: customer._id }).catch(() => {});
    VisitLog.deleteMany({ shop: customer._id }).catch(() => {});
    res.json({ message: "Customer deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
