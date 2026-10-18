const Invoice = require('../models/invoice.model');
const Stock = require('../models/stock.model');
const Employee = require('../models/employee.model');
const Session = require('../models/session.model');

// Create invoice with stock validation, deduction, and auto-generated Invoice ID
// ✅ UPDATED: Auto-fills sale price from employee's per-category price (matched via productName + productCategory)
const createInvoice = async (req, res) => {
    try {
        const invoiceData = req.body;

        const employee = await Employee.findOne({
            employeeName: invoiceData.employeeName,
            employeeMobileNumber: invoiceData.employeeMobileNumber
        });

        if (!employee) {
            return res.status(400).json({
                message: 'Employee not found. Please register employee first.'
            });
        }

        // Validate and check stock for each product
        for (let product of invoiceData.products) {
            const stockItem = await Stock.findOne({
                productName: product.productName,
                productCategory: product.productCategory,
                productColor: product.productColor
            });

            if (!stockItem) {
                return res.status(400).json({
                    message: `Product ${product.productName} (${product.productCategory}, ${product.productColor}) not found in stock`
                });
            }

            if (stockItem.productQuantity < product.productQuantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.productName}. Available: ${stockItem.productQuantity}, Requested: ${product.productQuantity}`
                });
            }

            if (stockItem.productStatus === 'Out of Stock') {
                return res.status(400).json({
                    message: `${product.productName} is out of stock`
                });
            }
        }

        // ✅ NEW: Auto-fill sale price from per-category pricing, delivery method & delivery charges
        let autoFilledDeliveryCharges = 0;
        let autoFilledDeliveryMethod = invoiceData.deliveredThrough || '';

        for (let product of invoiceData.products) {
            const empCommission = employee.employeeCommission.find(
                comm => comm.productName === product.productName
            );

            if (empCommission) {
                // ✅ Auto-fill sale price if user didn't provide (matched by CATEGORY)
                if (!product.productSalePrice || parseFloat(product.productSalePrice) <= 0) {
                    const catPrice = (empCommission.categoryPrices || []).find(
                        cp => cp.productCategory === product.productCategory
                    );
                    if (catPrice && catPrice.productSalePrice > 0) {
                        product.productSalePrice = catPrice.productSalePrice;
                    }
                }

                if (!autoFilledDeliveryMethod && empCommission.deliveryMethod) {
                    autoFilledDeliveryMethod = empCommission.deliveryMethod;
                }

                if (empCommission.deliveryCharges && empCommission.deliveryCharges.length > 0) {
                    const qty = parseInt(product.productQuantity) || 0;
                    const tier = empCommission.deliveryCharges.find(
                        t => qty >= t.minQuantity && qty <= t.maxQuantity
                    );
                    if (tier) {
                        autoFilledDeliveryCharges += tier.charges;
                    } else {
                        const highestTier = empCommission.deliveryCharges[empCommission.deliveryCharges.length - 1];
                        if (highestTier) autoFilledDeliveryCharges += highestTier.charges;
                    }
                }
            }
        }

        if (!invoiceData.deliveryCharges || parseFloat(invoiceData.deliveryCharges) === 0) {
            invoiceData.deliveryCharges = autoFilledDeliveryCharges;
        }

        invoiceData.deliveredThrough = invoiceData.deliveredThrough || autoFilledDeliveryMethod || '';

        // Auto-generate Invoice ID
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const datePrefix = `${year}${month}${day}`;

        const lastInvoice = await Invoice.findOne({
            invoiceId: new RegExp(`^INV-${datePrefix}`)
        }).sort({ createdAt: -1 });

        let sequentialNumber = 1;
        if (lastInvoice) {
            const lastSequentialNumber = parseInt(lastInvoice.invoiceId.split('-')[2]);
            sequentialNumber = lastSequentialNumber + 1;
        }

        const formattedSequential = String(sequentialNumber).padStart(4, '0');
        const invoiceId = `INV-${datePrefix}-${formattedSequential}`;

        // Deduct stock
        for (let product of invoiceData.products) {
            await Stock.findOneAndUpdate(
                {
                    productName: product.productName,
                    productCategory: product.productCategory,
                    productColor: product.productColor
                },
                { $inc: { productQuantity: -product.productQuantity } }
            );
        }

        // Calculate totals
        invoiceData.products = invoiceData.products.map(product => ({
            ...product,
            productTotalAmount: product.productSalePrice * product.productQuantity
        }));

        const productsTotal = invoiceData.products.reduce(
            (sum, product) => sum + product.productTotalAmount, 0
        );
        invoiceData.grandTotalAmount = productsTotal + (invoiceData.deliveryCharges || 0);

        invoiceData.invoiceId = invoiceId;
        invoiceData.sessionId = req.activeSession._id;
        invoiceData.sessionIdentifier = req.activeSession.sessionIdentifier;
        invoiceData.deliveredThrough = invoiceData.deliveredThrough || '';

        const invoice = new Invoice(invoiceData);
        await invoice.save();

        // Update session
        const session = await Session.findById(req.activeSession._id);

        let totalCommission = 0;
        const commissionDetails = [];
        for (let product of invoiceData.products) {
            const commissionRecord = employee.employeeCommission.find(
                comm => comm.productName === product.productName
            );
            if (commissionRecord) {
                const commissionAmount = commissionRecord.commissionAmount * product.productQuantity;
                totalCommission += commissionAmount;
                commissionDetails.push({
                    productName: product.productName,
                    quantity: product.productQuantity,
                    commissionPerUnit: commissionRecord.commissionAmount,
                    totalCommission: commissionAmount
                });
            }
        }

        const employeeSalesIndex = session.salesDetails.findIndex(
            sale => sale.employeeName === invoiceData.employeeName
        );

        const newProductsSold = invoiceData.products.map(p => ({
            productName: p.productName,
            productCategory: p.productCategory,
            productColor: p.productColor,
            quantity: p.productQuantity,
            salePrice: p.productSalePrice,
            totalAmount: p.productTotalAmount
        }));

        if (employeeSalesIndex > -1) {
            session.salesDetails[employeeSalesIndex].itemsSold += invoiceData.products.reduce((sum, p) => sum + p.productQuantity, 0);
            session.salesDetails[employeeSalesIndex].itemsSalesAmount += productsTotal;
            session.salesDetails[employeeSalesIndex].itemsSalesTotal += productsTotal;
            session.salesDetails[employeeSalesIndex].grandTotalAmount += invoiceData.grandTotalAmount;
            session.salesDetails[employeeSalesIndex].commissionEarned += totalCommission;
            session.salesDetails[employeeSalesIndex].productsSold.push(...newProductsSold);
        } else {
            session.salesDetails.push({
                employeeCategory: invoiceData.employeeCategory,
                employeeName: invoiceData.employeeName,
                employeeId: employee._id,
                itemsSold: invoiceData.products.reduce((sum, p) => sum + p.productQuantity, 0),
                itemsSalesAmount: productsTotal,
                itemsSalesTotal: productsTotal,
                grandTotalAmount: invoiceData.grandTotalAmount,
                commissionEarned: totalCommission,
                productsSold: newProductsSold
            });
        }

        session.totalSales += invoiceData.grandTotalAmount;
        session.totalItemsSold += invoiceData.products.reduce((sum, p) => sum + p.productQuantity, 0);
        session.totalCommission += totalCommission;

        await session.save();

        res.status(201).json({
            message: 'Invoice created successfully',
            data: {
                ...invoice.toObject(),
                commissionDetails: commissionDetails.length > 0 ? commissionDetails : 'No commission applicable',
                sessionInfo: {
                    sessionId: req.activeSession._id,
                    sessionIdentifier: req.activeSession.sessionIdentifier
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating invoice',
            error: error.message
        });
    }
};

module.exports = createInvoice;
