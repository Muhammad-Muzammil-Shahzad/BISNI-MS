const Employee = require('../models/employee.model');
const Stock = require('../models/stock.model');

// Create single employee with per-category prices, commission, delivery method & quantity-based delivery charges
const createEmployee = async (req, res) => {
    try {
        const employeeData = req.body;

        // Validate that commission products exist in stock
        if (employeeData.employeeCommission && employeeData.employeeCommission.length > 0) {
            for (let commission of employeeData.employeeCommission) {
                const stockExists = await Stock.findById(commission.productId);
                if (!stockExists) {
                    return res.status(400).json({
                        message: `Product with ID ${commission.productId} not found in stock`
                    });
                }
                commission.productName = stockExists.productName;

                // ✅ NEW: Validate per-category prices
                if (commission.categoryPrices && commission.categoryPrices.length > 0) {
                    for (let cp of commission.categoryPrices) {
                        if (!cp.productCategory || cp.productSalePrice === undefined || cp.productSalePrice === null || cp.productSalePrice < 0) {
                            return res.status(400).json({
                                message: `Invalid category price for "${commission.productName}"`
                            });
                        }
                    }
                }

                // Validate quantity-based delivery charges tiers
                if (commission.deliveryCharges && commission.deliveryCharges.length > 0) {
                    for (let tier of commission.deliveryCharges) {
                        if (tier.minQuantity > tier.maxQuantity) {
                            return res.status(400).json({
                                message: `Invalid delivery tier for "${commission.productName}": minQuantity (${tier.minQuantity}) cannot be greater than maxQuantity (${tier.maxQuantity})`
                            });
                        }
                    }
                    commission.deliveryCharges.sort((a, b) => a.minQuantity - b.minQuantity);
                }
            }
        }

        const employee = new Employee(employeeData);
        await employee.save();

        res.status(201).json({
            message: 'Employee created successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating employee',
            error: error.message
        });
    }
};

module.exports = createEmployee;
