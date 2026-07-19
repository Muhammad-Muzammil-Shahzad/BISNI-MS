const mongoose = require('mongoose');

// Session Schema - Tracks sales sessions with comprehensive statistics
const sessionSchema = new mongoose.Schema({
    sessionIdentifier: {
        type: String,
        unique: true,
        trim: true
    },
    sessionStartDateTime: {
        type: Date,
        required: true
    },
    sessionEndDateTime: {
        type: Date,
        default: null
    },
    sessionStatus: {
        type: String,
        default: 'Active'
    },
    totalSales: {
        type: Number,
        default: 0
    },
    totalItemsSold: {
        type: Number,
        default: 0
    },
    totalCommission: {
        type: Number,
        default: 0
    },
    salesDetails: [{
        employeeCategory: String,
        employeeName: String,
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        itemsSold: Number,
        itemsSalesAmount: Number,
        itemsSalesTotal: Number,
        grandTotalAmount: Number,
        commissionEarned: Number,
        productsSold: [{
            productName: String,
            productCategory: String,
            productColor: String,
            quantity: Number,
            salePrice: Number,
            totalAmount: Number
        }]
    }]
}, { timestamps: true });

// Auto-generate session identifier before saving
sessionSchema.pre('save', async function(next) {
    if (this.isNew && !this.sessionIdentifier) {
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
                       (date.getMonth() + 1).toString().padStart(2, '0') +
                       date.getDate().toString().padStart(2, '0');
        
        const count = await mongoose.model('Session').countDocuments({
            sessionIdentifier: new RegExp('^SES-' + dateStr)
        });
        
        this.sessionIdentifier = 'SES-' + dateStr + '-' + (count + 1).toString().padStart(4, '0');
    }
    // next();
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;