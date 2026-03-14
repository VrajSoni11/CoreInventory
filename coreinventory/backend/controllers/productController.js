const Product = require('../models/Product');
const Stock = require('../models/Stock');

// @desc  Get all products
// @route GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('createdBy', 'name'),
      Product.countDocuments(filter),
    ]);

    // Attach stock info
    const productIds = products.map((p) => p._id);
    const stocks = await Stock.find({ product: { $in: productIds } }).populate('warehouse', 'name code');

    const stockMap = {};
    stocks.forEach((s) => {
      if (!stockMap[s.product.toString()]) stockMap[s.product.toString()] = [];
      stockMap[s.product.toString()].push({ warehouse: s.warehouse, location: s.locationName, quantity: s.quantity });
    });

    const data = products.map((p) => ({
      ...p.toObject(),
      stockLocations: stockMap[p._id.toString()] || [],
      totalStock: (stockMap[p._id.toString()] || []).reduce((sum, s) => sum + s.quantity, 0),
    }));

    res.status(200).json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), data });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single product
// @route GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const stocks = await Stock.find({ product: product._id }).populate('warehouse', 'name code');
    res.status(200).json({ success: true, data: { ...product.toObject(), stocks } });
  } catch (error) {
    next(error);
  }
};

// @desc  Create product
// @route POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc  Update product
// @route PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete (deactivate) product
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.status(200).json({ success: true, message: 'Product deactivated.' });
  } catch (error) {
    next(error);
  }
};
