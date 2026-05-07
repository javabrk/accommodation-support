const router = require('express').Router();
const { login, register, refresh, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login',    login);
router.post('/register', register);
router.post('/refresh',  refresh);
router.post('/logout',   logout);
router.get('/me', authenticate, me);

module.exports = router;
