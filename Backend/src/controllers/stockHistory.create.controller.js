const StockHistory = require('../models/stockHistory.model');

// Log stock history entry
const createStockHistory = async (historyData) => {
    try {
        const history = new StockHistory(historyData);
        await history.save();
        return history;
    } catch (error) {
        console.error('Error creating stock history:', error);
        throw error;
    }
};

// Helper function to generate changes summary
const generateChangesSummary = (actionType, currentData, previousData = null) => {
    if (actionType === 'CREATE') {
        return `New stock added: ${currentData.productName} (${currentData.productCategory}, ${currentData.productColor}) - Qty: ${currentData.productQuantity}`;
    }
    
    if (actionType === 'DELETE') {
        return `Stock deleted: ${currentData.productName} (${currentData.productCategory}, ${currentData.productColor}) - Qty was: ${currentData.productQuantity}`;
    }
    
    if (actionType === 'UPDATE' && previousData) {
        const changes = [];
        
        if (previousData.productName !== currentData.productName) {
            changes.push(`Name: "${previousData.productName}" → "${currentData.productName}"`);
        }
        if (previousData.productCategory !== currentData.productCategory) {
            changes.push(`Category: "${previousData.productCategory}" → "${currentData.productCategory}"`);
        }
        if (previousData.productColor !== currentData.productColor) {
            changes.push(`Color: "${previousData.productColor}" → "${currentData.productColor}"`);
        }
        if (previousData.productPurchasePrice !== currentData.productPurchasePrice) {
            changes.push(`Price: Rs.${previousData.productPurchasePrice} → Rs.${currentData.productPurchasePrice}`);
        }
        if (previousData.productQuantity !== currentData.productQuantity) {
            const diff = currentData.productQuantity - previousData.productQuantity;
            const diffText = diff > 0 ? `+${diff}` : `${diff}`;
            changes.push(`Quantity: ${previousData.productQuantity} → ${currentData.productQuantity} (${diffText})`);
        }
        
        return changes.length > 0 ? changes.join('; ') : 'No significant changes';
    }
    
    return 'Action performed';
};

// Controller to log history (internal use)
const logStockHistory = async (actionType, stockData, previousData = null) => {
    try {
        const historyData = {
            actionType,
            productName: stockData.productName,
            productCategory: stockData.productCategory,
            productColor: stockData.productColor,
            productPurchasePrice: stockData.productPurchasePrice,
            productQuantity: stockData.productQuantity,
            productStatus: stockData.productStatus || 'In Stock',
            stockId: stockData._id || stockData.stockId,
            changesSummary: generateChangesSummary(actionType, stockData, previousData)
        };
        
        if (actionType === 'UPDATE' && previousData) {
            historyData.previousValues = {
                productName: previousData.productName,
                productCategory: previousData.productCategory,
                productColor: previousData.productColor,
                productPurchasePrice: previousData.productPurchasePrice,
                productQuantity: previousData.productQuantity,
                productStatus: previousData.productStatus
            };
        }
        
        return await createStockHistory(historyData);
    } catch (error) {
        console.error('Error logging stock history:', error);
        // Don't throw - we don't want history logging failure to break main operation
        return null;
    }
};

module.exports = { createStockHistory, logStockHistory, generateChangesSummary };
