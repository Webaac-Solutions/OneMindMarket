const mongoose = require("mongoose");

const visitLogSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    visitor: { type: String, index: true },
    device: { type: String, default: "desktop" },
    browser: { type: String, default: "Other" },
    referrer: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("VisitLog", visitLogSchema);