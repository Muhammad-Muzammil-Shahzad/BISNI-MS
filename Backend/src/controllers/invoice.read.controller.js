const Invoice = require('../models/invoice.model');

// Read invoices with multiple filter options
const readInvoices = async (req, res) => {
    try {
        const {
            employeeCategory,
            customerName,
            customerMobileNumber,
            invoiceId,
            date,
            startDate,
            endDate,
            employeeName
        } = req.query;
        
        let filter = {};
        
        // Build dynamic filter based on query parameters
        if (employeeCategory) filter.employeeCategory = employeeCategory;
        if (customerName) filter.customerName = new RegExp(customerName, 'i');
        if (customerMobileNumber) filter.customerMobileNumber1 = customerMobileNumber;
        if (invoiceId) filter.invoiceId = invoiceId;
        if (employeeName) filter.employeeName = employeeName;
        
        // Date filters
        if (date) {
            const queryDate = new Date(date);
            filter.createdAt = {
                $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
                $lt: new Date(queryDate.setHours(23, 59, 59, 999))
            };
        } else if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            };
        }
        
        const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
        
        res.status(200).json({
            message: 'Invoices retrieved successfully',
            count: invoices.length,
            data: invoices
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error reading invoices',
            error: error.message
        });
    }
};

module.exports = readInvoices;