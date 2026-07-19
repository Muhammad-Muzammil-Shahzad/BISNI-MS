const Invoice = require('../models/invoice.model');
const Stock = require('../models/stock.model');
const Employee = require('../models/employee.model');
const Session = require('../models/session.model');

// Dashboard statistics with comprehensive analytics
const getStats = async (req, res) => {
    try {
        const { date, startDate, endDate, employeeCategory, employeeName } = req.query;
        
        let dateFilter = {};
        if (date) {
            const queryDate = new Date(date);
            dateFilter.createdAt = {
                $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
                $lt: new Date(queryDate.setHours(23, 59, 59, 999))
            };
        } else if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            };
        }
        
        let invoiceFilter = { ...dateFilter };
        if (employeeCategory) invoiceFilter.employeeCategory = employeeCategory;
        if (employeeName) invoiceFilter.employeeName = employeeName;
        
        // Get all invoices based on filter
        const invoices = await Invoice.find(invoiceFilter);
        
        // Calculate totals
        const totalOrders = invoices.length;
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotalAmount, 0);
        const totalItemsSold = invoices.reduce((sum, inv) => 
            sum + inv.products.reduce((pSum, p) => pSum + p.productQuantity, 0), 0);
        
        // Get commission by employee category
        const employees = await Employee.find();
        const commissionByCategory = {};
        
        for (let employee of employees) {
            if (!commissionByCategory[employee.employeeCategory]) {
                commissionByCategory[employee.employeeCategory] = {
                    totalCommission: 0,
                    totalSales: 0,
                    employeeCount: 0,
                    employees: []
                };
            }
            
            const employeeInvoices = invoices.filter(
                inv => inv.employeeName === employee.employeeName
            );
            
            const employeeSales = employeeInvoices.reduce(
                (sum, inv) => sum + inv.grandTotalAmount, 0
            );
            
            const employeeItemsSold = employeeInvoices.reduce(
                (sum, inv) => sum + inv.products.reduce((pSum, p) => pSum + p.productQuantity, 0), 0
            );
            
            // Calculate commission based on employee's commission rates
            let employeeCommission = 0;
            for (let invoice of employeeInvoices) {
                for (let product of invoice.products) {
                    const commissionRecord = employee.employeeCommission.find(
                        comm => comm.productName === product.productName
                    );
                    if (commissionRecord) {
                        employeeCommission += commissionRecord.commissionAmount * product.productQuantity;
                    }
                }
            }
            
            commissionByCategory[employee.employeeCategory].totalCommission += employeeCommission;
            commissionByCategory[employee.employeeCategory].totalSales += employeeSales;
            commissionByCategory[employee.employeeCategory].employeeCount += 1;
            commissionByCategory[employee.employeeCategory].employees.push({
                employeeName: employee.employeeName,
                sales: employeeSales,
                itemsSold: employeeItemsSold,
                commission: employeeCommission
            });
        }
        
        // Get stock status
        const outOfStock = await Stock.countDocuments({ productStatus: 'Out of Stock' });
        const lowStock = await Stock.countDocuments({ productStatus: 'Low Stock' });
        const inStock = await Stock.countDocuments({ productStatus: 'In Stock' });
        
        // Get active session info
        const activeSession = await Session.findOne({ sessionStatus: 'Active' });
        
        // Top selling products
        const productSales = {};
        invoices.forEach(invoice => {
            invoice.products.forEach(product => {
                if (!productSales[product.productName]) {
                    productSales[product.productName] = {
                        productName: product.productName,
                        productCategory: product.productCategory,
                        totalQuantitySold: 0,
                        totalRevenue: 0
                    };
                }
                productSales[product.productName].totalQuantitySold += product.productQuantity;
                productSales[product.productName].totalRevenue += product.productTotalAmount;
            });
        });
        
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
            .slice(0, 10);
        
        res.status(200).json({
            message: 'Statistics retrieved successfully',
            data: {
                overview: {
                    totalOrders,
                    totalRevenue,
                    totalItemsSold,
                    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
                },
                stockStatus: {
                    outOfStock,
                    lowStock,
                    inStock,
                    totalProducts: outOfStock + lowStock + inStock
                },
                commissionByCategory,
                topSellingProducts: topProducts,
                activeSession: activeSession ? {
                    sessionId: activeSession._id,
                    startTime: activeSession.sessionStartDateTime,
                    totalSales: activeSession.totalSales,
                    totalItemsSold: activeSession.totalItemsSold
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

module.exports = getStats;