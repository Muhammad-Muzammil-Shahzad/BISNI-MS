const StockHistory = require('../models/stockHistory.model');

// Read stock history with comprehensive filters
const readStockHistory = async (req, res) => {
    try {
        const {
            actionType,
            productName,
            productCategory,
            productColor,
            date,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        let filter = {};

        // Action type filter
        if (actionType && ['CREATE', 'UPDATE', 'DELETE'].includes(actionType.toUpperCase())) {
            filter.actionType = actionType.toUpperCase();
        }

        // Product filters
        if (productName) {
            filter.productName = new RegExp(productName, 'i');
        }
        if (productCategory) {
            filter.productCategory = new RegExp(productCategory, 'i');
        }
        if (productColor) {
            filter.productColor = new RegExp(productColor, 'i');
        }

        // Date filters
        if (date) {
            const queryDate = new Date(date);
            filter.createdAt = {
                $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
                $lt: new Date(queryDate.setHours(23, 59, 59, 999))
            };
        } else if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        } else if (startDate) {
            filter.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            filter.createdAt = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalRecords = await StockHistory.countDocuments(filter);

        const history = await StockHistory.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get statistics
        const stats = {
            total: totalRecords,
            creates: await StockHistory.countDocuments({ ...filter, actionType: 'CREATE' }),
            updates: await StockHistory.countDocuments({ ...filter, actionType: 'UPDATE' }),
            deletes: await StockHistory.countDocuments({ ...filter, actionType: 'DELETE' })
        };

        res.status(200).json({
            message: 'Stock history retrieved successfully',
            count: history.length,
            statistics: stats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRecords / parseInt(limit)),
                totalRecords,
                limit: parseInt(limit)
            },
            data: history
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error reading stock history',
            error: error.message
        });
    }
};

// Read single history entry
const readStockHistoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await StockHistory.findById(id);

        if (!history) {
            return res.status(404).json({
                message: 'History entry not found'
            });
        }

        res.status(200).json({
            message: 'History entry retrieved successfully',
            data: history
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error reading history entry',
            error: error.message
        });
    }
};

// Get unique filter options
const getHistoryFilterOptions = async (req, res) => {
    try {
        const productNames = await StockHistory.distinct('productName');
        const productCategories = await StockHistory.distinct('productCategory');
        const productColors = await StockHistory.distinct('productColor');

        res.status(200).json({
            message: 'Filter options retrieved successfully',
            data: {
                productNames: productNames.sort(),
                productCategories: productCategories.sort(),
                productColors: productColors.sort(),
                actionTypes: ['CREATE', 'UPDATE', 'DELETE']
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error getting filter options',
            error: error.message
        });
    }
};

// Delete old history (cleanup)
const deleteStockHistory = async (req, res) => {
    try {
        const { beforeDate, actionType } = req.query;

        let filter = {};

        if (beforeDate) {
            filter.createdAt = { $lt: new Date(beforeDate) };
        }

        if (actionType && ['CREATE', 'UPDATE', 'DELETE'].includes(actionType.toUpperCase())) {
            filter.actionType = actionType.toUpperCase();
        }

        if (Object.keys(filter).length === 0) {
            return res.status(400).json({
                message: 'Please provide at least one filter (beforeDate or actionType)'
            });
        }

        const result = await StockHistory.deleteMany(filter);

        res.status(200).json({
            message: 'Stock history deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting stock history',
            error: error.message
        });
    }
};

module.exports = {
    readStockHistory,
    readStockHistoryById,
    getHistoryFilterOptions,
    deleteStockHistory
};
