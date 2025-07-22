const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protected routes
router.use(authMiddleware);

// Support ticket routes
router.post('/tickets', supportController.createTicket);
router.get('/tickets', supportController.getUserTickets);
router.get('/tickets/:id', supportController.getTicketDetails);
router.post('/tickets/:id/reply', supportController.replyToTicket);
router.patch('/tickets/:id/close', supportController.closeTicket);

module.exports = router;
