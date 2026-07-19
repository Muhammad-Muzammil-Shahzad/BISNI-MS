const Session = require('../models/session.model');

// Middleware to attach active session to request
const attachActiveSession = async (req, res, next) => {
    try {
        const activeSession = await Session.findOne({ sessionStatus: 'Active' });
        
        if (!activeSession) {
            return res.status(400).json({
                message: 'No active session found. Please start a session first.'
            });
        }
        
        // Attach active session to request object
        req.activeSession = {
            _id: activeSession._id,
            sessionIdentifier: activeSession.sessionIdentifier,
            sessionStartDateTime: activeSession.sessionStartDateTime
        };
        
        next();
    } catch (error) {
        res.status(500).json({
            message: 'Error checking active session',
            error: error.message
        });
    }
};

module.exports = attachActiveSession;