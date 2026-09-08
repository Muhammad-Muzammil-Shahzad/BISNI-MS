// controllers/stock.delete.controller.js (Updated)
const Stock = require('../models/stock.model');
const InventoryHistory = require('../models/inventory.history.model');

// Delete specific stock product with history
const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;
        const userInfo = {
            performedBy: req.user?.name || 'System',
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'Unknown'
        };
        
        // Get stock data before deletion
        const stock = await Stock.findById(id);
        if (!stock) {
            return res.status(404).json({
                message: 'Stock not found'
            });
        }
        
        // Create history entry before deletion
        await InventoryHistory.create({
            operationType: 'DELETE',
            stockId: stock._id,
            productName: stock.productName,
            productCategory: stock.productCategory,
            productColor: stock.productColor,
            previousData: {
                productName: stock.productName,
                productCategory: stock.productCategory,
                productColor: stock.productColor,
                productPurchasePrice: stock.productPurchasePrice,
                productQuantity: stock.productQuantity,
                productStatus: stock.productStatus
            },
            performedBy: userInfo.performedBy,
            ipAddress: userInfo.ipAddress,
            userAgent: userInfo.userAgent
        });
        
        await Stock.findByIdAndDelete(id);
        
        res.status(200).json({
            message: 'Stock deleted successfully',
            data: stock
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting stock',
            error: error.message
        });
    }
};

module.exports = deleteStock;
