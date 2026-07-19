const Employee = require('../models/employee.model');
const Stock = require('../models/stock.model');

// Update employee details and commissions
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