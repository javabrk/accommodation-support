const jwt = require('jsonwebtoken');
const db  = require('../database/db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result  = await db.query(
      'SELECT id, email, phone_number, role, first_name, last_name, is_active, is_super_admin FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows[0] || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    req.user = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user.is_super_admin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireClient, requireSuperAdmin };
