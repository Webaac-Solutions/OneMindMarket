const path = require("path");

const IMAGE_TYPES = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
  ".gif": ["image/gif"],
};

const VIDEO_TYPES = {
  ".mp4": ["video/mp4"],
  ".webm": ["video/webm"],
  ".mov": ["video/quicktime"],
};

const matches = (table, file) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  return Boolean(table[ext] && table[ext].includes(file.mimetype));
};

const isSafeImage = (file) => matches(IMAGE_TYPES, file);
const isSafeVideo = (file) => matches(VIDEO_TYPES, file);

const imageOnlyFilter = (req, file, cb) => {
  if (isSafeImage(file)) return cb(null, true);
  cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed"), false);
};

module.exports = { isSafeImage, isSafeVideo, imageOnlyFilter };
