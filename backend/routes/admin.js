const router = require('express').Router();
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const admin = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

router.get('/dashboard', admin.getDashboardStats);

// Admin management (super admin only)
router.get('/admins',              admin.getAdmins);
router.post('/admins',             requireSuperAdmin, admin.createAdmin);
router.patch('/admins/:id/deactivate', requireSuperAdmin, admin.deactivateAdmin);
router.patch('/admins/:id/reactivate', requireSuperAdmin, admin.reactivateAdmin);

// Clients
router.get('/clients',      admin.getClients);
router.get('/clients/:id',  admin.getClient);
router.post('/clients',     admin.createClient);
router.put('/clients/:id',  admin.updateClient);

// Properties
router.get('/properties',       admin.getProperties);
router.post('/properties',      admin.createProperty);
router.put('/properties/:id',   admin.updateProperty);

// Allocations
router.post('/allocations', admin.createAllocation);

// Tickets
router.get('/tickets',                 admin.getTickets);
router.get('/tickets/:id',             admin.getTicket);
router.put('/tickets/:id',             admin.updateTicket);
router.post('/tickets/:id/messages',   admin.addTicketMessage);

// Reports
router.get('/reports',      admin.getReports);
router.post('/reports',     admin.createReport);
router.put('/reports/:id',  admin.updateReport);

// Inspections / Property Checklists
router.get('/inspections',      admin.getInspections);
router.get('/inspections/:id',  admin.getInspection);
router.post('/inspections',     admin.createInspection);

module.exports = router;
