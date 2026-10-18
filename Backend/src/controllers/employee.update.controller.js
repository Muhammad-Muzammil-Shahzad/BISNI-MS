const Employee = require('../models/employee.model');
const Stock = require('../models/stock.model');

// Update employee details, per-category prices, commissions & delivery data
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate commission products if being updated
        if (updateData.employeeCommission) {
            for (let commission of updateData.employeeCommission) {
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

        const employee = await Employee.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            message: 'Employee updated successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating employee',
            error: error.message
        });
    }
};

module.exports = updateEmployee;
