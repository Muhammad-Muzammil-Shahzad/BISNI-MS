const Invoice = require('../models/invoice.model');

// Update invoice details
const updateInvoice = async (req, res) => {
    try {
        const { invoiceId, customerName, customerMobileNumber } = req.query;
        const updateData = req.body;
        
        let filter = {};
        if (invoiceId) filter.invoiceId = invoiceId;
        else if (customerName) filter.customerName = customerName;
        else if (customerMobileNumber) filter.customerMobileNumber1 = customerMobileNumber;
        
        if (Object.keys(filter).length === 0) {
            return res.status(400).json({
                message: 'Please provide invoice ID, customer name, or customer mobile number'
            });
        }
        
        const invoice = await Invoice.findOneAndUpdate(
            filter,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!invoice) {
            return res.status(404).json({
                message: 'Invoice not found'
            });
        }
        
        res.status(200).json({
            message: 'Invoice updated successfully',
            data: invoice
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating invoice',
            error: error.message
        });
    }
};

module.exports = updateInvoice;