const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    image: { type: String, default: "" },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Category", CategorySchema);
