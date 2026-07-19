const Invoice = require('../models/invoice.model');

// Delete invoices with multiple filter options
const deleteInvoices = async (req, res) => {
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
        
        // Build dynamic filter
        if (employeeCategory) filter.employeeCategory = employeeCategory;
        if (customerName) filter.customerName = customerName;
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
        
        const result = await Invoice.deleteMany(filter);
        
        res.status(200).json({
            message: 'Invoices deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting invoices',
            error: error.message
        });
    }
};

module.exports = deleteInvoices;