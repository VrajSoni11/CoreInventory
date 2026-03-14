const StockMove = require('../models/StockMove');
const Stock = require('../models/Stock');
const Product = require('../models/Product');

// Helper: get total stock for a product across all locations
const getTotalStock = async (productId) => {
  const stocks = await Stock.find({ product: productId });
  return stocks.reduce((sum, s) => sum + s.quantity, 0);
};

// Helper: update stock quantity (no sessions - M0 free tier doesnt support transactions)
const updateStock = async (productId, warehouseId, locationName, delta) => {
  const loc = locationName || 'Main';
  const existing = await Stock.findOne({ product: productId, warehouse: warehouseId, locationName: loc });
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta);
    await existing.save();
    return existing;
  } else {
    return await Stock.create({ product: productId, warehouse: warehouseId, locationName: loc, quantity: Math.max(0, delta) });
  }
};

// @desc  Create a stock move
// @route POST /api/operations
exports.createMove = async (req, res, next) => {
  try {
    const { type, product, toWarehouse, toLocation, fromWarehouse, fromLocation, quantity, vendor, customer, note, countedQuantity } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'Operation type is required.' });
    if (!product) return res.status(400).json({ success: false, message: 'Product is required.' });
    if (!quantity || quantity <= 0) return res.status(400).json({ success: false, message: 'Valid quantity is required.' });

    const move = await StockMove.create({
      type, product,
      toWarehouse: toWarehouse || undefined,
      toLocation: toLocation || 'Main',
      fromWarehouse: fromWarehouse || undefined,
      fromLocation: fromLocation || 'Main',
      quantity: Number(quantity),
      vendor, customer, note,
      countedQuantity: countedQuantity ? Number(countedQuantity) : undefined,
      createdBy: req.user._id,
      status: 'draft',
    });

    const populated = await StockMove.findById(move._id)
      .populate('product', 'name sku unit')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc  Validate a stock move
// @route PUT /api/operations/:id/validate
exports.validateMove = async (req, res, next) => {
  try {
    const move = await StockMove.findById(req.params.id);
    if (!move) return res.status(404).json({ success: false, message: 'Operation not found.' });
    if (move.status === 'done') return res.status(400).json({ success: false, message: 'Operation already validated.' });
    if (move.status === 'cancelled') return res.status(400).json({ success: false, message: 'Cannot validate a cancelled operation.' });

    switch (move.type) {

      case 'receipt': {
        if (!move.toWarehouse) return res.status(400).json({ success: false, message: 'Destination warehouse is required for receipt.' });
        await updateStock(move.product, move.toWarehouse, move.toLocation, move.quantity);
        break;
      }

      case 'delivery': {
        if (!move.fromWarehouse) return res.status(400).json({ success: false, message: 'Source warehouse is required for delivery.' });
        const srcStock = await Stock.findOne({ product: move.product, warehouse: move.fromWarehouse, locationName: move.fromLocation || 'Main' });
        const available = srcStock ? srcStock.quantity : 0;
        if (available < move.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${available}, Required: ${move.quantity}` });
        }
        await updateStock(move.product, move.fromWarehouse, move.fromLocation, -move.quantity);
        break;
      }

      case 'transfer': {
        if (!move.fromWarehouse) return res.status(400).json({ success: false, message: 'Source warehouse required.' });
        if (!move.toWarehouse) return res.status(400).json({ success: false, message: 'Destination warehouse required.' });
        const src = await Stock.findOne({ product: move.product, warehouse: move.fromWarehouse, locationName: move.fromLocation || 'Main' });
        const available = src ? src.quantity : 0;
        if (available < move.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${available}, Required: ${move.quantity}` });
        }
        await updateStock(move.product, move.fromWarehouse, move.fromLocation, -move.quantity);
        await updateStock(move.product, move.toWarehouse, move.toLocation, move.quantity);
        break;
      }

      case 'adjustment': {
        if (!move.toWarehouse) return res.status(400).json({ success: false, message: 'Warehouse is required for adjustment.' });
        if (move.countedQuantity === undefined || move.countedQuantity === null) {
          return res.status(400).json({ success: false, message: 'Counted quantity is required for adjustment.' });
        }
        const current = await Stock.findOne({ product: move.product, warehouse: move.toWarehouse, locationName: move.toLocation || 'Main' });
        move.variance = move.countedQuantity - (current ? current.quantity : 0);
        await Stock.findOneAndUpdate(
          { product: move.product, warehouse: move.toWarehouse, locationName: move.toLocation || 'Main' },
          { quantity: move.countedQuantity },
          { upsert: true, new: true }
        );
        break;
      }

      default:
        return res.status(400).json({ success: false, message: 'Invalid operation type.' });
    }

    move.status = 'done';
    move.validatedAt = new Date();
    move.validatedBy = req.user._id;
    await move.save();

    const totalStock = await getTotalStock(move.product);
    const populated = await StockMove.findById(move._id)
      .populate('product', 'name sku unit')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('validatedBy', 'name');

    res.status(200).json({ success: true, message: 'Operation validated successfully.', data: populated, totalStock });
  } catch (error) {
    next(error);
  }
};

// @desc  Cancel a stock move
// @route PUT /api/operations/:id/cancel
exports.cancelMove = async (req, res, next) => {
  try {
    const move = await StockMove.findById(req.params.id);
    if (!move) return res.status(404).json({ success: false, message: 'Operation not found.' });
    if (move.status === 'done') return res.status(400).json({ success: false, message: 'Cannot cancel a validated operation.' });
    move.status = 'cancelled';
    await move.save();
    res.status(200).json({ success: true, data: move });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all operations
// @route GET /api/operations
exports.getMoves = async (req, res, next) => {
  try {
    const { type, status, product, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (product) filter.product = product;
    const skip = (page - 1) * limit;
    const [moves, total] = await Promise.all([
      StockMove.find(filter)
        .populate('product', 'name sku unit')
        .populate('fromWarehouse', 'name code')
        .populate('toWarehouse', 'name code')
        .populate('createdBy', 'name')
        .populate('validatedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StockMove.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), data: moves });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single operation
// @route GET /api/operations/:id
exports.getMove = async (req, res, next) => {
  try {
    const move = await StockMove.findById(req.params.id)
      .populate('product', 'name sku unit category')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');
    if (!move) return res.status(404).json({ success: false, message: 'Operation not found.' });
    res.status(200).json({ success: true, data: move });
  } catch (error) {
    next(error);
  }
};

// @desc  Dashboard KPIs
// @route GET /api/operations/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalProducts, allProducts, allStocks, pendingReceipts, pendingDeliveries, pendingTransfers, recentMoves] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.find({ isActive: true }).select('_id reorderThreshold'),
      Stock.find({}),
      StockMove.countDocuments({ type: 'receipt', status: { $in: ['draft', 'waiting', 'ready'] } }),
      StockMove.countDocuments({ type: 'delivery', status: { $in: ['draft', 'waiting', 'ready'] } }),
      StockMove.countDocuments({ type: 'transfer', status: { $in: ['draft', 'waiting', 'ready'] } }),
      StockMove.find({ status: 'done' })
        .populate('product', 'name sku unit')
        .populate('toWarehouse', 'name')
        .populate('fromWarehouse', 'name')
        .sort({ validatedAt: -1 })
        .limit(10),
    ]);

    // Build stockMap: productId -> total qty across all warehouses/locations
    const stockMap = {};
    const productsWithStock = new Set();
    allStocks.forEach((s) => {
      const pid = s.product.toString();
      stockMap[pid] = (stockMap[pid] || 0) + s.quantity;
      productsWithStock.add(pid);
    });

    let lowStock = 0;
    let outOfStock = 0;
    allProducts.forEach((p) => {
      const pid = p._id.toString();
      const qty = stockMap[pid] || 0;
      const hasBeenReceived = productsWithStock.has(pid);
      if (hasBeenReceived && qty === 0) outOfStock++;
      if (hasBeenReceived && p.reorderThreshold > 0 && qty > 0 && qty <= p.reorderThreshold) lowStock++;
    });

    res.status(200).json({
      success: true,
      data: { totalProducts, lowStock, outOfStock, pendingReceipts, pendingDeliveries, pendingTransfers, recentMoves },
    });
  } catch (error) {
    next(error);
  }
};