const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const stored = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    if (!stored.rows[0]) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId, decoded.role);

    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [decoded.userId, newRefresh, expiresAt]
    );

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }
  res.json({ message: 'Logged out successfully' });
};

exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, password, confirmPassword,
          addressLine1, townCity, county, postcode } = req.body;

  if (!firstName || !lastName || !password) {
    return res.status(400).json({ error: 'First name, last name and password are required' });
  }
  if (!email && !phone) {
    return res.status(400).json({ error: 'Email address or phone number is required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const client = db.getClient ? await db.getClient() : null;
  const run    = client || db;

  try {
    if (client) await client.query('BEGIN');

    if (email) {
      const ex = await run.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (ex.rows[0]) return res.status(409).json({ error: 'An account with this email already exists' });
    }
    if (phone) {
      const ex = await run.query('SELECT id FROM users WHERE phone_number = $1', [phone.trim()]);
      if (ex.rows[0]) return res.status(409).json({ error: 'An account with this phone number already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await run.query(
      `INSERT INTO users (email, phone_number, password_hash, role, first_name, last_name)
       VALUES ($1, $2, $3, 'client', $4, $5)
       RETURNING id, email, phone_number, role, first_name, last_name`,
      [email ? email.toLowerCase().trim() : null, phone ? phone.trim() : null,
       passwordHash, firstName.trim(), lastName.trim()]
    );
    const user = userResult.rows[0];

    await run.query(
      `INSERT INTO clients (user_id, phone, address_line1, town_city, county, postcode, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [user.id, phone || null, addressLine1 || null, townCity || null, county || null, postcode || null]
    );

    if (client) await client.query('COMMIT');

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]);

    res.status(201).json({
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, phone: user.phone_number,
              role: user.role, firstName: user.first_name, lastName: user.last_name, isSuperAdmin: false },
    });
  } catch (err) {
    if (client) { try { await client.query('ROLLBACK'); } catch {} }
    if (err.code === '23505') return res.status(409).json({ error: 'Account already exists with these details' });
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (client && client.release) client.release();
  }
};

exports.me = async (req, res) => {
  const user = req.user;
  let clientData = null;

  if (user.role === 'client') {
    const result = await db.query(
      'SELECT * FROM clients WHERE user_id = $1',
      [user.id]
    );
    clientData = result.rows[0] || null;
  }

  res.json({
    id:           user.id,
    email:        user.email,
    role:         user.role,
    firstName:    user.first_name,
    lastName:     user.last_name,
    isSuperAdmin: user.is_super_admin || false,
    client:       clientData,
  });
};
