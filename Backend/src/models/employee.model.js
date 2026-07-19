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
        }
    }]
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;