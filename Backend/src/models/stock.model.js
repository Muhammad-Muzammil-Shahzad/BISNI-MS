const mongoose = require('mongoose');

// Stock Schema - Manages product inventory with stock status tracking
const stockSchema = new mongoose.Schema({
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
    }
}, { timestamps: true });

// Pre-save middleware to automatically update stock status based on quantity
stockSchema.pre('save', function(next) {
    if (this.productQuantity === 0) {
        this.productStatus = 'Out of Stock';
    } else if (this.productQuantity <= 10) {
        this.productStatus = 'Low Stock';
    } else {
        this.productStatus = 'In Stock';
    }
});

const Stock = mongoose.model('Stock', stockSchema);
module.exports = Stock;