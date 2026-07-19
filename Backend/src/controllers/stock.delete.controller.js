const Stock = require('../models/stock.model');

// Delete specific stock product
const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;
        
        const stock = await Stock.findByIdAndDelete(id);
        
        if (!stock) {
            return res.status(404).json({
                message: 'Stock not found'
            });
        }
        
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