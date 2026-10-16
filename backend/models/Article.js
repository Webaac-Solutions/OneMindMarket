const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: "" },
    featuredImage: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    tags: [String],
    author: { type: String, default: "Admin" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", ArticleSchema);
