const db = require('../database/db');

exports.getProfile = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name,
             c.id as client_id, c.phone, c.date_of_birth, c.gender, c.nhs_number,
             c.support_needs, c.status, c.emergency_contact_name, c.emergency_contact_phone,
             c.emergency_contact_relationship, c.move_in_date, c.move_out_date
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Profile not found' });

    const allocation = await db.query(`
      SELECT a.*, p.address, p.town_city, p.county, p.postcode, p.property_type, p.bedrooms, p.bathrooms
      FROM allocations a JOIN properties p ON p.id = a.property_id
      WHERE a.client_id = $1 AND a.status = 'active'
      ORDER BY a.start_date DESC LIMIT 1
    `, [result.rows[0].client_id]);

    res.json({ ...result.rows[0], currentAllocation: allocation.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, emergencyContactName, emergencyContactPhone, emergencyContactRelationship } = req.body;

    await db.query(
      'UPDATE users SET first_name=$1, last_name=$2 WHERE id=$3',
      [firstName, lastName, req.user.id]
    );

    await db.query(
      `UPDATE clients SET phone=$1, emergency_contact_name=$2, emergency_contact_phone=$3, emergency_contact_relationship=$4
       WHERE user_id=$5`,
      [phone, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const clientResult = await db.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientResult.rows[0]) return res.status(404).json({ error: 'Client profile not found' });

    const { status } = req.query;
    let query = 'SELECT * FROM tickets WHERE client_id = $1';
    const params = [clientResult.rows[0].id];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const clientResult = await db.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientResult.rows[0]) return res.status(404).json({ error: 'Client profile not found' });

    const ticket = await db.query(
      'SELECT * FROM tickets WHERE id = $1 AND client_id = $2',
      [req.params.id, clientResult.rows[0].id]
    );
    if (!ticket.rows[0]) return res.status(404).json({ error: 'Ticket not found' });

    const messages = await db.query(`
      SELECT tm.id, tm.message, tm.is_internal, tm.created_at,
             u.first_name || ' ' || u.last_name as sender_name, u.role as sender_role
      FROM ticket_messages tm JOIN users u ON u.id = tm.sender_id
      WHERE tm.ticket_id = $1 AND tm.is_internal = false
      ORDER BY tm.created_at ASC
    `, [req.params.id]);

    res.json({ ...ticket.rows[0], messages: messages.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const clientResult = await db.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientResult.rows[0]) return res.status(404).json({ error: 'Client profile not found' });

    const { title, description, category, priority } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const result = await db.query(
      `INSERT INTO tickets (client_id, title, description, category, priority)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [clientResult.rows[0].id, title, description, category, priority || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const clientResult = await db.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientResult.rows[0]) return res.status(404).json({ error: 'Client profile not found' });

    const ticket = await db.query(
      'SELECT id FROM tickets WHERE id = $1 AND client_id = $2',
      [req.params.id, clientResult.rows[0].id]
    );
    if (!ticket.rows[0]) return res.status(404).json({ error: 'Ticket not found' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const result = await db.query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, req.user.id, message]
    );

    await db.query(
      `UPDATE tickets SET status = CASE WHEN status = 'pending_client' THEN 'in_progress' ELSE status END WHERE id = $1`,
      [req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const clientResult = await db.query(`
      SELECT c.id, c.status, c.move_in_date FROM clients c WHERE c.user_id = $1
    `, [req.user.id]);

    if (!clientResult.rows[0]) return res.status(404).json({ error: 'Client profile not found' });
    const clientId = clientResult.rows[0].id;

    const [openTickets, allTickets, allocation] = await Promise.all([
      db.query("SELECT COUNT(*) FROM tickets WHERE client_id=$1 AND status NOT IN ('resolved','closed')", [clientId]),
      db.query('SELECT * FROM tickets WHERE client_id=$1 ORDER BY created_at DESC LIMIT 5', [clientId]),
      db.query(`
        SELECT a.*, p.address, p.town_city, p.county, p.postcode, p.property_type
        FROM allocations a JOIN properties p ON p.id = a.property_id
        WHERE a.client_id = $1 AND a.status = 'active' LIMIT 1
      `, [clientId]),
    ]);

    res.json({
      openTickets: parseInt(openTickets.rows[0].count),
      recentTickets: allTickets.rows,
      currentProperty: allocation.rows[0] || null,
      accountStatus: clientResult.rows[0].status,
      move_in_date: clientResult.rows[0].move_in_date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Payments (client view) ───────────────────────────────────────────────────

exports.getMyPayments = async (req, res) => {
  try {
    const clientResult = await db.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientResult.rows[0]) return res.status(404).json({ error: 'Client profile not found' });
    const clientId = clientResult.rows[0].id;

    const { status, limit = 52 } = req.query;
    let query = `
      SELECT pay.*, p.address AS property_address
      FROM payments pay
      LEFT JOIN properties p ON p.id = pay.property_id
      WHERE pay.client_id = $1
    `;
    const params = [clientId];
    if (status) { params.push(status); query += ` AND pay.status = $${params.length}`; }
    query += ` ORDER BY pay.week_start_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const payments = await db.query(query, params);

    // Get HB setting
    const hbSetting = await db.query(
      `SELECT * FROM housing_benefit_settings WHERE client_id = $1`,
      [clientId]
    );

    // Summary stats
    const stats = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'received') AS received_count,
        COUNT(*) FILTER (WHERE status = 'overdue')  AS overdue_count,
        COUNT(*) FILTER (WHERE status = 'pending')  AS pending_count,
        COUNT(*) FILTER (WHERE status = 'partial')  AS partial_count,
        COALESCE(SUM(amount_expected), 0) AS total_expected,
        COALESCE(SUM(amount_received), 0) AS total_received
      FROM payments WHERE client_id = $1
    `, [clientId]);

    res.json({
      payments: payments.rows,
      hbSetting: hbSetting.rows[0] || null,
      stats: stats.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
