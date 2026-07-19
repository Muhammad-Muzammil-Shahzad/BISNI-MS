const Session = require('../models/session.model');

// Start a new session
const startSession = async (req, res) => {
    try {
        // Check for existing active session
        const activeSession = await Session.findOne({ sessionStatus: 'Active' });
        if (activeSession) {
            return res.status(400).json({
                message: 'A session is already active',
                data: {
                    sessionId: activeSession._id,
                    sessionIdentifier: activeSession.sessionIdentifier,
                    startTime: activeSession.sessionStartDateTime
                }
            });
        }
        
        const session = new Session({
            sessionStartDateTime: new Date(),
            sessionStatus: 'Active'
        });
        
        await session.save();
        
        res.status(201).json({
            message: 'Session started successfully',
            data: {
                _id: session._id,
                sessionIdentifier: session.sessionIdentifier,
                sessionStartDateTime: session.sessionStartDateTime,
                sessionStatus: session.sessionStatus,
                totalSales: session.totalSales,
                totalItemsSold: session.totalItemsSold,
                totalCommission: session.totalCommission,
                salesDetails: session.salesDetails,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error starting session',
            error: error.message
        });
    }
};

// End current session
const endSession = async (req, res) => {
    try {
        const activeSession = await Session.findOne({ sessionStatus: 'Active' });
        
        if (!activeSession) {
            return res.status(400).json({
                message: 'No active session found'
            });
        }
        
        activeSession.sessionEndDateTime = new Date();
        activeSession.sessionStatus = 'Completed';
        
        await activeSession.save();
        
        // Calculate session duration
        const duration = activeSession.sessionEndDateTime - activeSession.sessionStartDateTime;
        const days = Math.floor(duration / (1000 * 60 * 60 * 24));
        const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        
        res.status(200).json({
            message: 'Session ended successfully',
            data: {
                ...activeSession.toObject(),
                duration: {
                    days,
                    hours,
                    minutes,
                    totalMilliseconds: duration
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error ending session',
            error: error.message
        });
    }
};

// Read active session (for middleware and general use)
const getActiveSession = async (req, res) => {
    try {
        const activeSession = await Session.findOne({ sessionStatus: 'Active' });
        
        if (!activeSession) {
            return res.status(404).json({
                message: 'No active session found'
            });
        }
        
        res.status(200).json({
            message: 'Active session retrieved successfully',
            data: activeSession
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving active session',
            error: error.message
        });
    }
};

// Read all sessions with optional filters
const readAllSessions = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
        
        let filter = {};
        
        if (status) {
            filter.sessionStatus = status;
        }
        
        if (startDate || endDate) {
            filter.sessionStartDateTime = {};
            if (startDate) {
                filter.sessionStartDateTime.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.sessionStartDateTime.$lte = new Date(endDate);
            }
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalSessions = await Session.countDocuments(filter);
        
        const sessions = await Session.find(filter)
            .sort({ sessionStartDateTime: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-salesDetails');
        
        const sessionsWithSummary = sessions.map(session => {
            const sessionObj = session.toObject();
            
            if (session.sessionEndDateTime) {
                const duration = session.sessionEndDateTime - session.sessionStartDateTime;
                sessionObj.duration = {
                    days: Math.floor(duration / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
                };
            }
            
            sessionObj.uniqueEmployees = session.salesDetails ? 
                [...new Set(session.salesDetails.map(sale => sale.employeeName))].length : 0;
            
            return sessionObj;
        });
        
        res.status(200).json({
            message: 'All sessions retrieved successfully',
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSessions / parseInt(limit)),
                totalSessions,
                limit: parseInt(limit)
            },
            data: sessionsWithSummary
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error reading all sessions',
            error: error.message
        });
    }
};

// Read specific session with complete details
const readSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: 'Invalid session ID format'
            });
        }
        
        const session = await Session.findById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                message: 'Session not found with the provided ID'
            });
        }
        
        const sessionDetails = session.toObject();
        
        if (session.sessionEndDateTime) {
            const duration = session.sessionEndDateTime - session.sessionStartDateTime;
            sessionDetails.duration = {
                days: Math.floor(duration / (1000 * 60 * 60 * 24)),
                hours: Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((duration % (1000 * 60)) / 1000),
                totalMilliseconds: duration
            };
        } else if (session.sessionStatus === 'Active') {
            const now = new Date();
            const duration = now - session.sessionStartDateTime;
            sessionDetails.duration = {
                days: Math.floor(duration / (1000 * 60 * 60 * 24)),
                hours: Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((duration % (1000 * 60)) / 1000),
                totalMilliseconds: duration,
                isRunning: true
            };
        }
        
        const salesByCategory = {};
        session.salesDetails.forEach(sale => {
            if (!salesByCategory[sale.employeeCategory]) {
                salesByCategory[sale.employeeCategory] = {
                    category: sale.employeeCategory,
                    totalEmployees: 0,
                    totalItemsSold: 0,
                    totalSalesAmount: 0,
                    totalCommission: 0,
                    employees: []
                };
            }
            salesByCategory[sale.employeeCategory].totalEmployees += 1;
            salesByCategory[sale.employeeCategory].totalItemsSold += sale.itemsSold;
            salesByCategory[sale.employeeCategory].totalSalesAmount += sale.grandTotalAmount;
            salesByCategory[sale.employeeCategory].totalCommission += sale.commissionEarned;
            salesByCategory[sale.employeeCategory].employees.push(sale);
        });
        
        const productSalesSummary = {};
        session.salesDetails.forEach(sale => {
            sale.productsSold.forEach(product => {
                const key = `${product.productName}|${product.productCategory}|${product.productColor}`;
                if (!productSalesSummary[key]) {
                    productSalesSummary[key] = {
                        productName: product.productName,
                        productCategory: product.productCategory,
                        productColor: product.productColor,
                        totalQuantitySold: 0,
                        totalRevenue: 0,
                        soldBy: []
                    };
                }
                productSalesSummary[key].totalQuantitySold += product.quantity;
                productSalesSummary[key].totalRevenue += product.totalAmount;
                if (!productSalesSummary[key].soldBy.includes(sale.employeeName)) {
                    productSalesSummary[key].soldBy.push(sale.employeeName);
                }
            });
        });
        
        const statistics = {
            totalSales: session.totalSales,
            totalItemsSold: session.totalItemsSold,
            totalCommission: session.totalCommission,
            averageSalePerEmployee: session.salesDetails.length > 0 ? 
                session.totalSales / session.salesDetails.length : 0,
            topSellingProduct: Object.values(productSalesSummary)
                .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)[0] || null,
            uniqueProductsSold: Object.keys(productSalesSummary).length,
            uniqueEmployees: session.salesDetails.length
        };
        
        res.status(200).json({
            message: 'Session details retrieved successfully',
            data: {
                basicInfo: {
                    sessionId: session._id,
                    sessionIdentifier: session.sessionIdentifier,
                    status: session.sessionStatus,
                    startDateTime: session.sessionStartDateTime,
                    endDateTime: session.sessionEndDateTime,
                    duration: sessionDetails.duration,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                },
                statistics,
                salesByCategory: Object.values(salesByCategory),
                productSalesSummary: Object.values(productSalesSummary),
                salesDetails: session.salesDetails
            }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid session ID format'
            });
        }
        
        res.status(500).json({
            message: 'Error reading session details',
            error: error.message
        });
    }
};

// Read session details (active or specific) - Original function maintained
const readSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        let session;
        if (sessionId) {
            session = await Session.findById(sessionId);
            
            if (!session) {
                return res.status(404).json({
                    message: 'Session not found with the provided ID'
                });
            }
        } else {
            session = await Session.findOne({ sessionStatus: 'Active' });
            
            if (!session) {
                return res.status(404).json({
                    message: 'No active session found'
                });
            }
        }
        
        let timer = null;
        if (session.sessionStatus === 'Active') {
            const now = new Date();
            const duration = now - session.sessionStartDateTime;
            timer = {
                days: Math.floor(duration / (1000 * 60 * 60 * 24)),
                hours: Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((duration % (1000 * 60)) / 1000)
            };
        }
        
        res.status(200).json({
            message: 'Session retrieved successfully',
            data: {
                ...session.toObject(),
                timer
            }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid session ID format'
            });
        }
        
        res.status(500).json({
            message: 'Error reading session',
            error: error.message
        });
    }
};

// Delete a session
const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await Session.findByIdAndDelete(sessionId);
        
        if (!session) {
            return res.status(404).json({
                message: 'Session not found'
            });
        }
        
        res.status(200).json({
            message: 'Session deleted successfully',
            data: session
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid session ID format'
            });
        }
        
        res.status(500).json({
            message: 'Error deleting session',
            error: error.message
        });
    }
};

module.exports = { 
    startSession, 
    endSession, 
    getActiveSession,
    readSession, 
    readAllSessions, 
    readSessionDetails, 
    deleteSession 
};