const mongoose = require('mongoose');

// Invoice Schema - Stores sales invoices with multiple products per invoice
const invoiceSchema = new mongoose.Schema({
    invoiceId: {
        type: String,
        unique: true,
        required: true
    },
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
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerMobileNumber1: {
        type: String,
        required: true,
        trim: true
    },
    customerMobileNumber2: {
        type: String,
        trim: true
    },
    customerAddress: {
        type: String,
        required: true,
        trim: true
    },
    products: [{
        productName: {
            type: String,
            required: true
        },
        productCategory: {
            type: String,
            required: true
        },
        productColor: {
            type: String,
            required: true
        },
        productSalePrice: {
            type: Number,
            required: true,
            min: 0
        },
        productQuantity: {
            type: Number,
            required: true,
            min: 1
        },
        productTotalAmount: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    deliveryCharges: {
        type: Number,
        default: 0,
        min: 0
    },
    grandTotalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    sessionIdentifier: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Auto-generate unique invoice ID based on date before saving
invoiceSchema.pre('save', async function(next) {
    if (!this.invoiceId) {
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
                       (date.getMonth() + 1).toString().padStart(2, '0') +
                       date.getDate().toString().padStart(2, '0');
        
        const count = await mongoose.model('Invoice').countDocuments({
            invoiceId: new RegExp('^INV-' + dateStr)
        });
        
        this.invoiceId = 'INV-' + dateStr + '-' + (count + 1).toString().padStart(4, '0');
    }

});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;