const Invoice = require('../models/invoice.model');
const Stock = require('../models/stock.model');
const Session = require('../models/session.model');

// ✅ UPDATED: Delete invoices with stock restoration and session/employee record correction
const recoveryDeleteInvoices = async (req, res) => {
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
        
        // ✅ STEP 1: Find all invoices that will be deleted (to restore stock)
        const invoicesToDelete = await Invoice.find(filter);
        
        if (invoicesToDelete.length === 0) {
            return res.status(200).json({
                message: 'No invoices found matching the criteria',
                deletedCount: 0,
                stockRestored: 0,
                sessionsUpdated: 0
            });
        }

        // ✅ STEP 2: Restore stock for all products in all invoices
        let stockRestoredCount = 0;
        for (const invoice of invoicesToDelete) {
            for (const product of invoice.products) {
                // Find the stock item and restore quantity
                const stockItem = await Stock.findOne({
                    productName: product.productName,
                    productCategory: product.productCategory,
                    productColor: product.productColor
                });

                if (stockItem) {
                    await Stock.findByIdAndUpdate(stockItem._id, {
                        $inc: { productQuantity: product.productQuantity }
                    });
                    stockRestoredCount++;
                }
            }
        }

        // ✅ STEP 3: Update sessions - reverse the sales/commission records
        let sessionsUpdatedCount = 0;
        const sessionIds = [...new Set(invoicesToDelete.map(inv => inv.sessionId?.toString()).filter(Boolean))];

        for (const sessionId of sessionIds) {
            const session = await Session.findById(sessionId);
            if (!session) continue;

            // Get all invoices for this session that are being deleted
            const sessionInvoicesToDelete = invoicesToDelete.filter(
                inv => inv.sessionId?.toString() === sessionId
            );

            // Group by employee to update session salesDetails
            const employeeGroups = {};
            for (const invoice of sessionInvoicesToDelete) {
                if (!employeeGroups[invoice.employeeName]) {
                    employeeGroups[invoice.employeeName] = {
                        invoices: [],
                        totalAmount: 0,
                        totalItems: 0
                    };
                }
                employeeGroups[invoice.employeeName].invoices.push(invoice);
                employeeGroups[invoice.employeeName].totalAmount += invoice.grandTotalAmount || 0;
                employeeGroups[invoice.employeeName].totalItems += (invoice.products || []).reduce(
                    (sum, p) => sum + (p.productQuantity || 0), 0
                );
            }

            // Update each employee's record in session
            for (const [empName, empData] of Object.entries(employeeGroups)) {
                const empIndex = session.salesDetails.findIndex(s => s.employeeName === empName);
                if (empIndex === -1) continue;

                const empRecord = session.salesDetails[empIndex];

                // Calculate commission to reverse for this employee
                let commissionToReverse = 0;
                for (const invoice of empData.invoices) {
                    // Find the employee to get commission rates
                    // We need to recalculate commission based on invoice products
                    for (const product of invoice.products) {
                        // Commission is stored in the session record, but we need to reverse it
                        // Since we don't have direct commission per invoice stored, 
                        // we'll calculate based on the proportion of this invoice in the employee's total
                        // But better: we stored commissionEarned in session, so we can reverse proportionally
                        // Actually, let's use the productsSold array to find matching products
                        const soldProduct = empRecord.productsSold?.find(
                            p => p.productName === product.productName &&
                                 p.productCategory === product.productCategory &&
                                 p.productColor === product.productColor &&
                                 p.quantity === product.productQuantity &&
                                 p.totalAmount === product.productTotalAmount
                        );
                        // If we can't find exact match, we'll estimate
                        // In practice, we should store commission per invoice
                    }
                }

                // Simpler approach: Calculate commission based on employee's commission rates
                // We need to fetch employee... but we don't have employee reference in delete controller
                // Best approach: Store commission info in invoice or recalculate from session data
                
                // Since session.salesDetails[empIndex].commissionEarned has total commission for employee
                // And we're deleting some invoices, we need to subtract the commission for those invoices
                
                // Get employee commission rates by finding the employee
                const Employee = require('../models/employee.model');
                const employee = await Employee.findOne({ employeeName: empName });
                
                let commissionToSubtract = 0;
                if (employee && employee.employeeCommission) {
                    for (const invoice of empData.invoices) {
                        for (const product of invoice.products) {
                            const commRecord = employee.employeeCommission.find(
                                c => c.productName === product.productName
                            );
                            if (commRecord) {
                                commissionToSubtract += commRecord.commissionAmount * (product.productQuantity || 0);
                            }
                        }
                    }
                }

                // Update session employee record
                empRecord.itemsSold = Math.max(0, (empRecord.itemsSold || 0) - empData.totalItems);
                empRecord.itemsSalesAmount = Math.max(0, (empRecord.itemsSalesAmount || 0) - empData.totalAmount);
                empRecord.itemsSalesTotal = Math.max(0, (empRecord.itemsSalesTotal || 0) - empData.totalAmount);
                empRecord.grandTotalAmount = Math.max(0, (empRecord.grandTotalAmount || 0) - empData.totalAmount);
                empRecord.commissionEarned = Math.max(0, (empRecord.commissionEarned || 0) - commissionToSubtract);
                
                // Remove productsSold entries for deleted invoices
                if (empRecord.productsSold) {
                    // Remove sold products that belong to deleted invoices
                    // Since we can't easily match exact products, we'll remove based on product details
                    for (const invoice of empData.invoices) {
                        for (const product of invoice.products) {
                            const idx = empRecord.productsSold.findIndex(
                                p => p.productName === product.productName &&
                                     p.productCategory === product.productCategory &&
                                     p.productColor === product.productColor &&
                                     p.quantity === product.productQuantity
                            );
                            if (idx > -1) {
                                empRecord.productsSold.splice(idx, 1);
                            }
                        }
                    }
                }

                // If employee has no more sales, remove their record
                if (empRecord.itemsSold <= 0 && empRecord.grandTotalAmount <= 0) {
                    session.salesDetails.splice(empIndex, 1);
                }
            }

            // Update session totals
            const totalAmountDeleted = sessionInvoicesToDelete.reduce((sum, inv) => sum + (inv.grandTotalAmount || 0), 0);
            const totalItemsDeleted = sessionInvoicesToDelete.reduce(
                (sum, inv) => sum + (inv.products || []).reduce((s, p) => s + (p.productQuantity || 0), 0), 0
            );

            // Calculate total commission to reverse
            let totalCommissionDeleted = 0;
            for (const invoice of sessionInvoicesToDelete) {
                const Employee = require('../models/employee.model');
                const employee = await Employee.findOne({ employeeName: invoice.employeeName });
                if (employee && employee.employeeCommission) {
                    for (const product of invoice.products) {
                        const commRecord = employee.employeeCommission.find(
                            c => c.productName === product.productName
                        );
                        if (commRecord) {
                            totalCommissionDeleted += commRecord.commissionAmount * (product.productQuantity || 0);
                        }
                    }
                }
            }

            session.totalSales = Math.max(0, (session.totalSales || 0) - totalAmountDeleted);
            session.totalItemsSold = Math.max(0, (session.totalItemsSold || 0) - totalItemsDeleted);
            session.totalCommission = Math.max(0, (session.totalCommission || 0) - totalCommissionDeleted);

            await session.save();
            sessionsUpdatedCount++;
        }

        // ✅ STEP 4: Delete the invoices
        const result = await Invoice.deleteMany(filter);
        
        res.status(200).json({
            message: 'Invoices deleted successfully with stock restoration',
            deletedCount: result.deletedCount,
            stockRestored: stockRestoredCount,
            sessionsUpdated: sessionsUpdatedCount,
            details: {
                invoicesDeleted: invoicesToDelete.map(inv => inv.invoiceId),
                productsRestored: stockRestoredCount
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting invoices',
            error: error.message
        });
    }
};

module.exports = recoveryDeleteInvoices;