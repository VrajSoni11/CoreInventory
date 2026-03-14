const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    locationName: {
      type: String,
      default: 'Main',
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

stockSchema.index({ product: 1, warehouse: 1, locationName: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);
