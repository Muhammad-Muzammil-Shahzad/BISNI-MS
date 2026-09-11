const Stock = require('../models/stock.model');
const { logStockHistory } = require('./stockHistory.create.controller');

// Delete specific stock product
const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the stock data BEFORE deletion
        const stock = await Stock.findById(id);
        
        if (!stock) {
            return res.status(404).json({
                message: 'Stock not found'
            });
        }
        
        // Log history BEFORE deleting
        await logStockHistory('DELETE', stock.toObject());
        
        // Now delete the stock
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
