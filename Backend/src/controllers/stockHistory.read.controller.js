const StockHistory = require('../models/stockHistory.model');

// Get session stock summary - aggregated by product
const getStockSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let matchFilter = {};
        
        if (startDate || endDate) {
            matchFilter.createdAt = {};
            if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
            if (endDate) matchFilter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }

        // Aggregate stock changes by product
        const summary = await StockHistory.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        productName: '$productName',
                        productCategory: '$productCategory',
                        productColor: '$productColor'
                    },
                    totalAdded: {
                        $sum: {
                            $cond: [{ $eq: ['$actionType', 'CREATE'] }, '$productQuantity', 0]
                        }
                    },
                    totalDeleted: {
                        $sum: {
                            $cond: [{ $eq: ['$actionType', 'DELETE'] }, '$productQuantity', 0]
                        }
                    },
                    totalUpdated: {
                        $sum: {
                            $cond: [{ $eq: ['$actionType', 'UPDATE'] }, 1, 0]
                        }
                    },
                    lastPrice: { $last: '$productPurchasePrice' },
                    firstAction: { $min: '$createdAt' },
                    lastAction: { $max: '$createdAt' },
                    operations: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    productName: '$_id.productName',
                    productCategory: '$_id.productCategory',
                    productColor: '$_id.productColor',
                    totalAdded: 1,
                    totalDeleted: 1,
                    totalUpdated: 1,
                    netQuantity: { $subtract: ['$totalAdded', '$totalDeleted'] },
                    lastPrice: 1,
                    firstAction: 1,
                    lastAction: 1,
                    operations: 1
                }
            },
            { $sort: { totalAdded: -1, productName: 1 } }
        ]);

        // Calculate totals
        const totals = summary.reduce((acc, item) => ({
            totalProducts: acc.totalProducts + 1,
            totalAdded: acc.totalAdded + item.totalAdded,
            totalDeleted: acc.totalDeleted + item.totalDeleted,
            totalUpdates: acc.totalUpdates + item.totalUpdated
        }), { totalProducts: 0, totalAdded: 0, totalDeleted: 0, totalUpdates: 0 });

        res.status(200).json({
            message: 'Stock summary retrieved successfully',
            data: {
                products: summary,
                totals
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error getting stock summary',
            error: error.message
        });
    }
};

// Read stock history with filters (simplified)
const readStockHistory = async (req, res) => {
    try {
        const {
            actionType,
            productName,
            productCategory,
            productColor,
            startDate,
            endDate,
            page = 1,
            limit = 20
        } = req.query;

        let filter = {};

        if (actionType && ['CREATE', 'UPDATE', 'DELETE'].includes(actionType.toUpperCase())) {
            filter.actionType = actionType.toUpperCase();
        }
        if (productName) filter.productName = new RegExp(productName, 'i');
        if (productCategory) filter.productCategory = new RegExp(productCategory, 'i');
        if (productColor) filter.productColor = new RegExp(productColor, 'i');

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalRecords = await StockHistory.countDocuments(filter);

        const history = await StockHistory.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            message: 'Stock history retrieved successfully',
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

// Get filter options
const getHistoryFilterOptions = async (req, res) => {
    try {
        const [productNames, productCategories, productColors] = await Promise.all([
            StockHistory.distinct('productName'),
            StockHistory.distinct('productCategory'),
            StockHistory.distinct('productColor')
        ]);

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
                message: 'Please provide at least one filter'
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
    getStockSummary,
    readStockHistory,
    getHistoryFilterOptions,
    deleteStockHistory
};
