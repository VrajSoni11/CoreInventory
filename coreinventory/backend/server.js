require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const { productRouter, opsRouter, whRouter, stockRouter } = require('./routes/index');

// Connect to MongoDB
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRouter);
app.use('/api/operations', opsRouter);
app.use('/api/warehouses', whRouter);
app.use('/api/stock', stockRouter);

// Chat proxy - forwards to Gemini API (free, no CORS issues)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const SYSTEM_PROMPT = `You are InventBot, a friendly assistant built into CoreInventory — an inventory management system.

CoreInventory features:
- PRODUCTS: Add/edit products with SKU, category, unit, reorder threshold. Stock shows In Stock / Low Stock / Out of Stock.
- WAREHOUSES: Create in Settings with name, code, address.
- RECEIPTS: Log goods coming IN to a warehouse. Must VALIDATE to update stock.
- DELIVERIES: Log goods going OUT. Must VALIDATE. Checks if sufficient stock exists.
- TRANSFERS: Move stock between warehouses. Total stock stays same.
- ADJUSTMENTS: Physical count correction. Enter counted quantity, variance auto-calculated.
- MOVE HISTORY: Full ledger of all operations.
- ANALYSIS: Charts showing monthly trends, stock levels, operation types, daily activity.
- PDF RECEIPTS: Click gold PDF button on any done/cancelled operation.
- OTP PASSWORD RESET: Enter email, get 6-digit OTP, verify, reset password.

Key rules:
- Stock ONLY changes when you VALIDATE an operation (green checkmark button)
- Draft operations do NOT affect stock at all
- Deliveries and Transfers fail if insufficient stock at source location
- Location names must match exactly - form auto-fills when you pick a warehouse
- Reorder threshold is an alert level only, does NOT add stock

Be helpful, concise, and friendly. Use emojis occasionally. Keep answers to 2-4 sentences unless detail is asked for.`;

    // Build Gemini conversation format
    const geminiMessages = [];

    // Add system prompt as first user message if there are messages
    const conversationMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: conversationMessages,
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, no response generated.';
    res.json({ content: reply });
  } catch (err) {
    console.error('Chat proxy error:', err.message);
    res.status(500).json({ error: 'Failed to connect to AI service' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;