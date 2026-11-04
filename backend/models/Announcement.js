const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    url: { type: String, default: "" },
    image: { type: String, default: "" },
    pushStatus: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      default: "skipped",
    },
    pushId: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Announcement", AnnouncementSchema);
