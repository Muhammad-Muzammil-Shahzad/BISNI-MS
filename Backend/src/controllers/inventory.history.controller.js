// controllers/inventoryHistory.controller.js
const InventoryHistory = require('../models/inventory.history.model');
const Stock = require('../models/stock.model');

// Get inventory history with filters
const getInventoryHistory = async (req, res) => {
    try {
        const { 
            operationType, 
            startDate, 
            endDate, 
            productName, 
            productCategory, 
            productColor,
            page = 1,
            limit = 20
        } = req.query;

        let filter = {};

        // Operation type filter
        if (operationType) {
            filter.operationType = operationType;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // Product name search (text search)
        if (productName) {
            filter.$text = { $search: productName };
        }

        // Category filter
        if (productCategory) {
            filter.productCategory = productCategory;
        }

        // Color filter
        if (productColor) {
            filter.productColor = productColor;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [history, total] = await Promise.all([
            InventoryHistory.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            InventoryHistory.countDocuments(filter)
        ]);

        // Get unique categories and colors for filters
        const [categories, colors] = await Promise.all([
            InventoryHistory.distinct('productCategory'),
            InventoryHistory.distinct('productColor')
        ]);

        res.status(200).json({
            message: 'Inventory history retrieved successfully',
            data: {
                history,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                filters: {
                    categories: categories.filter(c => c),
                    colors: colors.filter(c => c),
                    operationTypes: ['CREATE', 'UPDATE', 'DELETE']
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching inventory history',
            error: error.message
        });
    }
};

// Get history for a specific stock item
const getStockHistory = async (req, res) => {
    try {
        const { stockId } = req.params;
        
        const history = await InventoryHistory.find({ stockId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Stock history retrieved successfully',
            data: history
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching stock history',
            error: error.message
        });
    }
};

// Get summary statistics
const getHistorySummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                dateFilter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.createdAt.$lte = new Date(endDate);
            }
        }

        const [operationStats, recentActivity] = await Promise.all([
            InventoryHistory.aggregate([
                { $match: dateFilter },
                { $group: {
                    _id: '$operationType',
                    count: { $sum: 1 }
                }}
            ]),
            InventoryHistory.find(dateFilter)
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        const summary = {
            totalOperations: operationStats.reduce((sum, op) => sum + op.count, 0),
            byOperation: {
                CREATE: operationStats.find(op => op._id === 'CREATE')?.count || 0,
                UPDATE: operationStats.find(op => op._id === 'UPDATE')?.count || 0,
                DELETE: operationStats.find(op => op._id === 'DELETE')?.count || 0
            },
            recentActivity
        };

        res.status(200).json({
            message: 'History summary retrieved successfully',
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching history summary',
            error: error.message
        });
    }
};

module.exports = {
    getInventoryHistory,
    getStockHistory,
    getHistorySummary
};