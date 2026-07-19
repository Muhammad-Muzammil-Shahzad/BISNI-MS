const Employee = require('../models/employee.model');
const Invoice = require('../models/invoice.model');

// Read employee details with sales statistics
const readEmployees = async (req, res) => {
    try {
        const { date, sessionId, month, startDate, endDate } = req.query;
        let dateFilter = {};
        
        // Build date filter based on query parameters
        if (date) {
            const queryDate = new Date(date);
            dateFilter.createdAt = {
                $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
                $lt: new Date(queryDate.setHours(23, 59, 59, 999))
            };
        } else if (month) {
            const [year, monthNum] = month.split('-');
            dateFilter.createdAt = {
                $gte: new Date(year, monthNum - 1, 1),
                $lt: new Date(year, monthNum, 1)
            };
        } else if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            };
        }
        
        if (sessionId) {
            dateFilter.sessionId = sessionId;
        }
        
        const employees = await Employee.find().lean();
        
        // Get sales data for each employee
        const employeesWithSales = await Promise.all(employees.map(async (employee) => {
            const salesQuery = {
                employeeName: employee.employeeName,
                ...dateFilter
            };
            
            const salesInvoices = await Invoice.find(salesQuery);
            
            const salesData = {
                totalSales: salesInvoices.length,
                totalRevenue: salesInvoices.reduce((sum, inv) => sum + inv.grandTotalAmount, 0),
                totalItemsSold: salesInvoices.reduce((sum, inv) => 
                    sum + inv.products.reduce((pSum, p) => pSum + p.productQuantity, 0), 0),
                invoices: salesInvoices
            };
            
            return {
                ...employee,
                salesData
            };
        }));
        
        res.status(200).json({
            message: 'Employees retrieved successfully',
            data: employeesWithSales
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error reading employees',
            error: error.message
        });
    }
};

module.exports = readEmployees;