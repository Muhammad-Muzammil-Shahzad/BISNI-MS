// models/inventoryHistory.model.js
const mongoose = require('mongoose');

// Inventory History Schema - Tracks all stock operations
const inventoryHistorySchema = new mongoose.Schema({
    operationType: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'DELETE'],
        required: true
    },
    stockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
    },
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
    previousData: {
        productName: String,
        productCategory: String,
        productColor: String,
        productPurchasePrice: Number,
        productQuantity: Number,
        productStatus: String
    },
    newData: {
        productName: String,
        productCategory: String,
        productColor: String,
        productPurchasePrice: Number,
        productQuantity: Number,
        productStatus: String
    },
    changes: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
    }],
    performedBy: {
        type: String,
        default: 'System'
    },
    ipAddress: {
        type: String,
        default: '127.0.0.1'
    },
    userAgent: {
        type: String,
        default: 'Unknown'
    }
}, { timestamps: true });

// Index for faster queries
inventoryHistorySchema.index({ createdAt: -1 });
inventoryHistorySchema.index({ operationType: 1 });
inventoryHistorySchema.index({ productName: 'text' });
inventoryHistorySchema.index({ productCategory: 1 });

// Pre-save middleware to ensure changes array is populated for updates
inventoryHistorySchema.pre('save', function(next) {
    if (this.operationType === 'UPDATE' && this.changes.length === 0) {
        // If changes array is empty, generate from previousData and newData
        const fields = ['productName', 'productCategory', 'productColor', 'productPurchasePrice', 'productQuantity', 'productStatus'];
        fields.forEach(field => {
            if (this.previousData[field] !== undefined && this.newData[field] !== undefined) {
                if (this.previousData[field] !== this.newData[field]) {
                    this.changes.push({
                        field: field,
                        oldValue: this.previousData[field],
                        newValue: this.newData[field]
                    });
                }
            }
        });
    }
    next();
});

const InventoryHistory = mongoose.model('InventoryHistory', inventoryHistorySchema);
module.exports = InventoryHistory;