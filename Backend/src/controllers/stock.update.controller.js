const Stock = require('../models/stock.model');
const { logStockHistory } = require('./stockHistory.create.controller');

// Update specific stock details
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Get the original stock data BEFORE update
        const originalStock = await Stock.findById(id);
        
        if (!originalStock) {
            return res.status(404).json({
                message: 'Stock not found'
            });
        }
        
        // Save original values for history
        const previousValues = originalStock.toObject();
        
        // Perform the update
        const stock = await Stock.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        // Log history with previous values
        await logStockHistory('UPDATE', stock.toObject(), previousValues);
        
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
