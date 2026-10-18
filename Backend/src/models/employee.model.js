const mongoose = require('mongoose');

// Employee Schema - Stores employee details with product-specific commissions
const employeeSchema = new mongoose.Schema({
    employeeCategory: {
        type: String,
        required: true,
        trim: true
    },
    employeeName: {
        type: String,
        required: true,
        trim: true
    },
    employeeAddress: {
        type: String,
        required: true,
        trim: true
    },
    employeeMobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    employeeCommission: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stock',
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        commissionAmount: {
            type: Number,
            required: true,
            min: 0
        },
        // ✅ UPDATED: Replaced single productSalePrice with per-category price array.
        // Example: Bag → [{ productCategory: 'Large', productSalePrice: 2500 },
        //                 { productCategory: 'Small', productSalePrice: 2000 }]
        categoryPrices: [{
            productCategory: {
                type: String,
                required: true,
                trim: true
            },
            productSalePrice: {
                type: Number,
                required: true,
                min: 0
            }
        }],
        // ✅ NEW: Default delivery method for this product
        deliveryMethod: {
            type: String,
            required: false,
            trim: true,
            default: ''
        },
        // ✅ NEW: Custom delivery charges based on quantity tiers
        deliveryCharges: [{
            minQuantity: {
                type: Number,
                required: true,
                min: 1
            },
            maxQuantity: {
                type: Number,
                required: true,
                min: 1
            },
            charges: {
                type: Number,
                required: true,
                min: 0
            }
        }]
    }]
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
