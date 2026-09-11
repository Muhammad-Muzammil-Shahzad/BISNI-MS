const mongoose = require('mongoose');

// Stock History Schema - Tracks all stock operations (Create, Update, Delete)
const stockHistorySchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE'],
        index: true
    },
    // Stock item details at time of action
    productName: {
        type: String,
        required: true,
        trim: true
    },
    productCategory: {
        type: String,
        required: true,
        trim: true
    },
    productColor: {
        type: String,
        required: true,
        trim: true
    },
    productPurchasePrice: {
        type: Number,
        required: true,
        min: 0
    },
    productQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    productStatus: {
        type: String,
        default: 'In Stock'
    },
    // Reference to original stock item
    stockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: false // Not required for deleted items
    },
    // For UPDATE actions - store previous values
    previousValues: {
        productName: String,
        productCategory: String,
        productColor: String,
        productPurchasePrice: Number,
        productQuantity: Number,
        productStatus: String
    },
    // Changes summary for quick reference
    changesSummary: {
        type: String,
        trim: true
    },
    // Additional metadata
    performedBy: {
        type: String,
        default: 'System',
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Index for efficient date-based queries
stockHistorySchema.index({ createdAt: -1 });
stockHistorySchema.index({ actionType: 1, createdAt: -1 });
stockHistorySchema.index({ productName: 1, createdAt: -1 });

const StockHistory = mongoose.model('StockHistory', stockHistorySchema);
module.exports = StockHistory;
