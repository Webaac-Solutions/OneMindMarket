const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    source: { type: String, default: "profile" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CallLog", callLogSchema);
