const Stock = require('../models/stock.model');

// Update specific stock details
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const stock = await Stock.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!stock) {
            return res.status(404).json({
                message: 'Stock not found'
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