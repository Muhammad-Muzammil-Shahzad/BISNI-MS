const Employee = require('../models/employee.model');
const Stock = require('../models/stock.model');

// Create single employee with commission validation
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