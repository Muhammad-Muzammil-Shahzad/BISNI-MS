// Updated readInvoices controller with pagination support
const Invoice = require('../models/invoice.model');

// Read invoices with multiple filter options and pagination
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
            employeeName,
            page = 1,
            limit = 7 // Default 7, minimum 5, maximum 7
        } = req.query;
        
        // Ensure limit is between 5 and 7
        const paginationLimit = Math.min(Math.max(parseInt(limit) || 7, 5), 7);
        const currentPage = parseInt(page) || 1;
        const skip = (currentPage - 1) * paginationLimit;
        
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
        
        // Get total count for pagination
        const totalCount = await Invoice.countDocuments(filter);
        
        // Get paginated invoices
        const invoices = await Invoice.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(paginationLimit);
        
        res.status(200).json({
            message: 'Invoices retrieved successfully',
            count: totalCount,
            currentPage: currentPage,
            totalPages: Math.ceil(totalCount / paginationLimit),
            hasMore: skip + invoices.length < totalCount,
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