// routes/inventoryHistory.routes.js
const express = require('express');
const router = express.Router();
const {
    getInventoryHistory,
    getStockHistory,
    getHistorySummary
} = require('../controllers/inventoryHistory.controller');

// Get inventory history with filters
router.get('/', getInventoryHistory);

// Get summary statistics
router.get('/summary', getHistorySummary);

// Get history for specific stock item
router.get('/stock/:stockId', getStockHistory);

module.exports = router;