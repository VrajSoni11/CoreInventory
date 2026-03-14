const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');

const productRouter = express.Router();
productRouter.use(protect);
productRouter.route('/').get(getProducts).post(createProduct);
productRouter.route('/:id').get(getProduct).put(updateProduct).delete(authorize('admin', 'manager'), deleteProduct);

// --- Operations ---
const {
  createMove, validateMove, cancelMove, getMoves, getMove, getDashboard,
} = require('../controllers/operationsController');

const opsRouter = express.Router();
opsRouter.use(protect);
opsRouter.get('/dashboard', getDashboard);
opsRouter.route('/').get(getMoves).post(createMove);
opsRouter.route('/:id').get(getMove);
opsRouter.put('/:id/validate', validateMove);
opsRouter.put('/:id/cancel', cancelMove);

// --- Warehouses ---
const Warehouse = require('../models/Warehouse');

const whRouter = express.Router();
whRouter.use(protect);
whRouter.get('/', async (req, res) => {
  const warehouses = await Warehouse.find({ isActive: true });
  res.json({ success: true, data: warehouses });
});
whRouter.post('/', async (req, res, next) => {
  try {
    const wh = await Warehouse.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: wh });
  } catch (e) { next(e); }
});
whRouter.put('/:id', async (req, res, next) => {
  try {
    const wh = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: wh });
  } catch (e) { next(e); }
});

// --- Stock Debug (public for debugging) ---
const Stock = require('../models/Stock');
const stockRouter = express.Router();
stockRouter.get('/', async (req, res) => {
  const stocks = await Stock.find({})
    .populate('product', 'name sku')
    .populate('warehouse', 'name code');
  res.json({ success: true, count: stocks.length, data: stocks });
});

module.exports = { productRouter, opsRouter, whRouter, stockRouter };

// already exported above - this is just a patch