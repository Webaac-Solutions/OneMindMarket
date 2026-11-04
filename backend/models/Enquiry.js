const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    name: String,
    phone: String,
    enquiry: String,
    referredBy: String,
    handled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Enquiry", enquirySchema);
