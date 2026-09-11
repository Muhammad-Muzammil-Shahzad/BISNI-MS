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
const { readStockHistory, readStockHistoryById, getHistoryFilterOptions, deleteStockHistory } = require('../controllers/stockHistory.read.controller');

// Stock Routes
router.post('/stock', createStock);
router.get('/stock', readStocks);
router.put('/stock/:id', updateStock);
router.delete('/stock/:id', deleteStock);

// Stock History Routes
router.get('/stock-history', readStockHistory);
router.get('/stock-history/filters', getHistoryFilterOptions);
router.get('/stock-history/:id', readStockHistoryById);
router.delete('/stock-history', deleteStockHistory);

// Employee Routes
router.post('/employee', createEmployee);
router.get('/employee', readEmployees);
router.put('/employee/:id', updateEmployee);
router.delete('/employee/:id', deleteEmployee);

// Invoice Routes
router.post('/invoice', attachActiveSession, createInvoice);
router.get('/invoice', readInvoices);
router.put('/invoice', updateInvoice);
router.delete('/invoice', deleteInvoices);

// Session Routes
router.post('/session/start', startSession);
router.post('/session/end', endSession);
router.get('/sessions', readAllSessions);
router.get('/session/details/:sessionId', readSessionDetails);
router.get('/session/:sessionId', readSession);
router.get('/session', readSession);
router.delete('/session/:sessionId', deleteSession);

// Statistics Route
router.get('/stats', getStats);

module.exports = router;
