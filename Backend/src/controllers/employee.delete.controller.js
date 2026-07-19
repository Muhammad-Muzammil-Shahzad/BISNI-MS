const Employee = require('../models/employee.model');

// Delete specific employee
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        
        const employee = await Employee.findByIdAndDelete(id);
        
        if (!employee) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }
        
        res.status(200).json({
            message: 'Employee deleted successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting employee',
            error: error.message
        });
    }
};

module.exports = deleteEmployee;