// controllers/stock.create.controller.js (Updated)
const Stock = require('../models/stock.model');
const InventoryHistory = require('../models/inventory.history.model');

// Create single or bulk stock entries with history
const createStock = async (req, res) => {
    try {
        const stockData = req.body;
        const userInfo = {
            performedBy: req.user?.name || 'System',
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'Unknown'
        };
        
        // Handle bulk creation if array is provided
        if (Array.isArray(stockData)) {
            const stocks = await Stock.insertMany(stockData);
            
            // Create history entries for each stock
            const historyEntries = stocks.map(stock => ({
                operationType: 'CREATE',
                stockId: stock._id,
                productName: stock.productName,
                productCategory: stock.productCategory,
                productColor: stock.productColor,
                newData: {
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
            }));
            
            await InventoryHistory.insertMany(historyEntries);
            
            return res.status(201).json({
                message: `Stocks created successfully (${stocks.length} items)`,
                data: stocks
            });
        }
        
        // Handle single stock creation
        const stock = new Stock(stockData);
        await stock.save();
        
        // Create history entry
        await InventoryHistory.create({
            operationType: 'CREATE',
            stockId: stock._id,
            productName: stock.productName,
            productCategory: stock.productCategory,
            productColor: stock.productColor,
            newData: {
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
        
        res.status(201).json({
            message: 'Stock created successfully',
            data: stock
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating stock',
            error: error.message
        });
    }
};

module.exports = createStock;
