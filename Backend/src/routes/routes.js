const express = require('express');
const router = express.Router();
const attachActiveSession = require('../middleware/activeSession');

// Import controllers
const createStock = require('../controllers/stock.create.controller');
const readStocks = require('../controllers/stock.read.controller');
const updateStock = require('../controllers/stock.update.controller');
const deleteStock = require('../controllers/stock.delete.controller');

const createEmployee = require('../controllers/employee.create.controller');
const readEmployees = require('../controllers/employee.read.controller');
const updateEmployee = require('../controllers/employee.update.controller');
const deleteEmployee = require('../controllers/employee.delete.controller');

const createInvoice = require('../controllers/invoice.create.controller');
const readInvoices = require('../controllers/invoice.read.controller');
const updateInvoice = require('../controllers/invoice.update.controller');
const deleteInvoices = require('../controllers/invoice.delete.controller');

const { startSession, endSession, readSession, deleteSession, readAllSessions, readSessionDetails } = require('../controllers/session.controller');
const getStats = require('../controllers/stats.read.controller');

// Stock Routes
router.post('/stock', createStock);           // Create stock (single/bulk)
router.get('/stock', readStocks);             // Read all stocks
router.put('/stock/:id', updateStock);        // Update specific stock
router.delete('/stock/:id', deleteStock);     // Delete specific stock

// Employee Routes
router.post('/employee', createEmployee);     // Create employee
router.get('/employee', readEmployees);       // Read employees with sales data
router.put('/employee/:id', updateEmployee);  // Update employee
router.delete('/employee/:id', deleteEmployee); // Delete employee

// Invoice Routes
router.post('/invoice', attachActiveSession, createInvoice);  // Create invoice (requires active session)
router.get('/invoice', readInvoices);         // Read invoices with filters
router.put('/invoice', updateInvoice);        // Update invoice
router.delete('/invoice', deleteInvoices);    // Delete invoices with filters

// Session Routes
router.post('/session/start', startSession);                    // Start new session
router.post('/session/end', endSession);                        // End active session
router.get('/sessions', readAllSessions);                       // Read all sessions with filters
router.get('/session/details/:sessionId', readSessionDetails);  // Read specific session with complete details
router.get('/session/:sessionId', readSession);                 // Read specific session by ID
router.get('/session', readSession);                            // Read active session (without ID)
router.delete('/session/:sessionId', deleteSession);            // Delete session

// Statistics Route
router.get('/stats', getStats);               // Get dashboard statistics

module.exports = router;