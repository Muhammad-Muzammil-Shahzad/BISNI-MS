const Stock = require('../models/stock.model');

// Read all stock details
const readStocks = async (req, res) => {
    try {
        const stocks = await Stock.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            message: 'Stocks retrieved successfully',
            count: stocks.length,
            data: stocks
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error reading stocks',
            error: error.message
        });
    }
};

module.exports = readStocks;