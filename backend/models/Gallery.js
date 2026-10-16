const mongoose = require("mongoose");

const MediaItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video", "youtube"], required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const GallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    caption: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    embeddable: { type: Boolean },
    images: { type: [String], default: [] },
    media: { type: [MediaItemSchema], default: [] },
    tags: [String],
    visible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Gallery", GallerySchema);
