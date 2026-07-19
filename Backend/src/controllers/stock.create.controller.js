const Stock = require('../models/stock.model');

// Create single or bulk stock entries
const createStock = async (req, res) => {
    try {
        const stockData = req.body;
        
        // Handle bulk creation if array is provided
        if (Array.isArray(stockData)) {
            const stocks = await Stock.insertMany(stockData);
            return res.status(201).json({
                message: 'Stocks created successfully',
                data: stocks
            });
        }
        
        // Handle single stock creation
        const stock = new Stock(stockData);
        await stock.save();
        
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