// controllers/stock.update.controller.js (Updated)
const Stock = require('../models/stock.model');
const InventoryHistory = require('../models/inventory.history.model');

// Update specific stock details with history
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userInfo = {
            performedBy: req.user?.name || 'System',
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'Unknown'
        };
        
        // Get current stock data before update
        const currentStock = await Stock.findById(id);
        if (!currentStock) {
            return res.status(404).json({
                message: 'Stock not found'
            });
        }
        
        const stock = await Stock.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        // Create history entry with changes
        const changes = [];
        const fields = ['productName', 'productCategory', 'productColor', 'productPurchasePrice', 'productQuantity'];
        fields.forEach(field => {
            if (currentStock[field] !== stock[field]) {
                changes.push({
                    field: field,
                    oldValue: currentStock[field],
                    newValue: stock[field]
                });
            }
        });
        
        if (changes.length > 0 || currentStock.productStatus !== stock.productStatus) {
            await InventoryHistory.create({
                operationType: 'UPDATE',
                stockId: stock._id,
                productName: stock.productName,
                productCategory: stock.productCategory,
                productColor: stock.productColor,
                previousData: {
                    productName: currentStock.productName,
                    productCategory: currentStock.productCategory,
                    productColor: currentStock.productColor,
                    productPurchasePrice: currentStock.productPurchasePrice,
                    productQuantity: currentStock.productQuantity,
                    productStatus: currentStock.productStatus
                },
                newData: {
                    productName: stock.productName,
                    productCategory: stock.productCategory,
                    productColor: stock.productColor,
                    productPurchasePrice: stock.productPurchasePrice,
                    productQuantity: stock.productQuantity,
                    productStatus: stock.productStatus
                },
                changes: changes,
                performedBy: userInfo.performedBy,
                ipAddress: userInfo.ipAddress,
                userAgent: userInfo.userAgent
            });
        }
        
        res.status(200).json({
            message: 'Stock updated successfully',
            data: stock
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating stock',
            error: error.message
        });
    }
};

module.exports = updateStock;
