const mongoose = require('mongoose');

const stockMoveSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: ['receipt', 'delivery', 'transfer', 'adjustment'],
    },
    status: {
      type: String,
      enum: ['draft', 'waiting', 'ready', 'done', 'cancelled'],
      default: 'draft',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    fromLocation: { type: String },
    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    toLocation: { type: String },
    quantity: {
      type: Number,
      required: true,
      min: [0.001, 'Quantity must be positive'],
    },
    countedQuantity: { type: Number },
    variance: { type: Number },
    note: { type: String, trim: true },
    vendor: { type: String, trim: true },
    customer: { type: String, trim: true },
    validatedAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Auto-generate reference number BEFORE validation
stockMoveSchema.pre('validate', async function (next) {
  if (!this.isNew || this.reference) return next();
  const prefixMap = {
    receipt: 'REC',
    delivery: 'DEL',
    transfer: 'TRF',
    adjustment: 'ADJ',
  };
  const prefix = prefixMap[this.type] || 'MOV';
  const count = await mongoose.model('StockMove').countDocuments({ type: this.type });
  this.reference = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  next();
});

stockMoveSchema.index({ type: 1, status: 1 });
stockMoveSchema.index({ product: 1 });
stockMoveSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StockMove', stockMoveSchema);