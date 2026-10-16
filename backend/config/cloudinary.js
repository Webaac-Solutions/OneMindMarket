const cloudinary = require("cloudinary").v2;

const USE_CLOUDINARY = process.env.USE_CLOUDINARY === "true";

if (USE_CLOUDINARY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

module.exports = { cloudinary, USE_CLOUDINARY };
