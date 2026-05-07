const router = require('express').Router();
const { authenticate, requireClient } = require('../middleware/auth');
const client = require('../controllers/clientController');

router.use(authenticate, requireClient);

router.get('/dashboard', client.getDashboard);
router.get('/profile', client.getProfile);
router.put('/profile', client.updateProfile);

router.get('/tickets', client.getMyTickets);
router.post('/tickets', client.createTicket);
router.get('/tickets/:id', client.getTicket);
router.post('/tickets/:id/messages', client.addMessage);

// Payments
router.get('/payments', client.getMyPayments);

module.exports = router;
