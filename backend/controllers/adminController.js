const bcrypt = require('bcryptjs');
const db = require('../database/db');

// ─── Clients ─────────────────────────────────────────────────────────────────

exports.getClients = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.last_login,
             c.id as client_id, c.phone, c.date_of_birth, c.nhs_number, c.status,
             c.move_in_date, c.move_out_date, c.support_needs, c.notes,
             c.emergency_contact_name, c.emergency_contact_phone,
             p.address as property_address, p.town_city as property_town
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      LEFT JOIN allocations a ON a.client_id = c.id AND a.status = 'active'
      LEFT JOIN properties p ON p.id = a.property_id
      WHERE u.role = 'client'
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND c.status = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }
    query += ' ORDER BY u.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getClient = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.created_at,
             c.id as client_id, c.phone, c.date_of_birth, c.gender,
             c.nhs_number, c.support_needs, c.status, c.notes, c.move_in_date, c.move_out_date,
             c.address_line1, c.town_city, c.county, c.postcode,
             c.emergency_contact_name, c.emergency_contact_phone, c.emergency_contact_relationship
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      WHERE u.id = $1 AND u.role = 'client'
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Client not found' });

    const allocations = await db.query(`
      SELECT a.*, p.address, p.town_city, p.county, p.postcode, p.property_type
      FROM allocations a JOIN properties p ON p.id = a.property_id
      WHERE a.client_id = $1 ORDER BY a.start_date DESC
    `, [result.rows[0].client_id]);

    const tickets = await db.query(
      'SELECT * FROM tickets WHERE client_id = $1 ORDER BY created_at DESC LIMIT 5',
      [result.rows[0].client_id]
    );

    const reports = await db.query(`
      SELECT r.*, u.first_name || \' \' || u.last_name as created_by_name
      FROM reports r JOIN users u ON u.id = r.created_by
      WHERE r.client_id = $1 ORDER BY r.created_at DESC LIMIT 5
    `, [result.rows[0].client_id]);

    res.json({ ...result.rows[0], allocations: allocations.rows, tickets: tickets.rows, reports: reports.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createClient = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const {
      email, password, firstName, lastName, phone, dateOfBirth, gender,
      nhsNumber, supportNeeds, emergencyContactName,
      emergencyContactPhone, emergencyContactRelationship, notes, status,
    } = req.body;

    const hash = await bcrypt.hash(password || 'Welcome@123', 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, 'client', $3, $4) RETURNING *`,
      [email.toLowerCase().trim(), hash, firstName, lastName]
    );
    const user = userResult.rows[0];

    const clientResult = await client.query(
      `INSERT INTO clients (user_id, phone, date_of_birth, gender,
        nhs_number, support_needs, emergency_contact_name, emergency_contact_phone,
        emergency_contact_relationship, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [user.id, phone, dateOfBirth || null, gender, nhsNumber, supportNeeds,
       emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
       notes, status || 'active']
    );

    await client.query('COMMIT');
    res.status(201).json({ user: userResult.rows[0], client: clientResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

exports.updateClient = async (req, res) => {
  const dbClient = await db.getClient();
  try {
    await dbClient.query('BEGIN');
    const { firstName, lastName, email, phone, dateOfBirth, gender,
      nhsNumber, supportNeeds, emergencyContactName, emergencyContactPhone,
      emergencyContactRelationship, notes, status, moveInDate, moveOutDate } = req.body;

    await dbClient.query(
      `UPDATE users SET first_name=$1, last_name=$2, email=$3, updated_at=NOW()
       WHERE id=$4 AND role='client'`,
      [firstName, lastName, email?.toLowerCase(), req.params.id]
    );

    await dbClient.query(
      `UPDATE clients SET phone=$1, date_of_birth=$2, gender=$3,
        nhs_number=$4, support_needs=$5, emergency_contact_name=$6, emergency_contact_phone=$7,
        emergency_contact_relationship=$8, notes=$9, status=$10, move_in_date=$11, move_out_date=$12
       WHERE user_id=$13`,
      [phone, dateOfBirth || null, gender, nhsNumber, supportNeeds,
       emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
       notes, status, moveInDate || null, moveOutDate || null, req.params.id]
    );

    await dbClient.query('COMMIT');
    res.json({ message: 'Client updated successfully' });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    dbClient.release();
  }
};

// ─── Properties ──────────────────────────────────────────────────────────────

exports.getProperties = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT p.*, COUNT(a.id) FILTER (WHERE a.status='active') as current_occupants
      FROM properties p
      LEFT JOIN allocations a ON a.property_id = p.id
    `;
    const params = [];
    if (status) { params.push(status); query += ` WHERE p.status = $1`; }
    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createProperty = async (req, res) => {
  try {
    const { address, townCity, county, postcode, propertyType, bedrooms, bathrooms,
      capacity, status, monthlyRent, description } = req.body;

    const result = await db.query(
      `INSERT INTO properties (address, town_city, county, postcode, property_type, bedrooms,
        bathrooms, capacity, status, monthly_rent, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [address, townCity, county, postcode, propertyType, bedrooms || 1, bathrooms || 1,
       capacity || 1, status || 'available', monthlyRent, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const { address, townCity, county, postcode, propertyType, bedrooms, bathrooms,
      capacity, status, monthlyRent, description } = req.body;

    const result = await db.query(
      `UPDATE properties SET address=$1, town_city=$2, county=$3, postcode=$4, property_type=$5,
        bedrooms=$6, bathrooms=$7, capacity=$8, status=$9, monthly_rent=$10, description=$11
       WHERE id=$12 RETURNING *`,
      [address, townCity, county, postcode, propertyType, bedrooms, bathrooms,
       capacity, status, monthlyRent, description, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Property not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Allocations ─────────────────────────────────────────────────────────────

exports.createAllocation = async (req, res) => {
  try {
    const { clientId, propertyId, startDate, endDate, notes } = req.body;
    const result = await db.query(
      `INSERT INTO allocations (client_id, property_id, start_date, end_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [clientId, propertyId, startDate, endDate, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Tickets ─────────────────────────────────────────────────────────────────

exports.getTickets = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = `
      SELECT t.*, u.first_name || ' ' || u.last_name as client_name, u.email as client_email,
             a.first_name || ' ' || a.last_name as assigned_to_name
      FROM tickets t
      JOIN clients c ON c.id = t.client_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN users a ON a.id = t.assigned_to
      WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
    if (priority) { params.push(priority); query += ` AND t.priority = $${params.length}`; }
    if (category) { params.push(category); query += ` AND t.category = $${params.length}`; }
    query += ' ORDER BY t.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await db.query(`
      SELECT t.*, u.first_name || ' ' || u.last_name as client_name, u.email as client_email,
             a.first_name || ' ' || a.last_name as assigned_to_name
      FROM tickets t
      JOIN clients c ON c.id = t.client_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN users a ON a.id = t.assigned_to
      WHERE t.id = $1
    `, [req.params.id]);

    if (!ticket.rows[0]) return res.status(404).json({ error: 'Ticket not found' });

    const messages = await db.query(`
      SELECT tm.*, u.first_name || ' ' || u.last_name as sender_name, u.role as sender_role
      FROM ticket_messages tm JOIN users u ON u.id = tm.sender_id
      WHERE tm.ticket_id = $1 ORDER BY tm.created_at ASC
    `, [req.params.id]);

    res.json({ ...ticket.rows[0], messages: messages.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const result = await db.query(
      `UPDATE tickets SET status=$1, priority=$2, assigned_to=$3,
        resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE id=$4 RETURNING *`,
      [status, priority, assignedTo || null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addTicketMessage = async (req, res) => {
  try {
    const { message, isInternal } = req.body;
    const result = await db.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, message, is_internal)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, message, isInternal || false]
    );
    await db.query(
      `UPDATE tickets SET status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END WHERE id = $1`,
      [req.params.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Reports ─────────────────────────────────────────────────────────────────

exports.getReports = async (req, res) => {
  try {
    const { clientId, reportType } = req.query;
    let query = `
      SELECT r.*, u.first_name || ' ' || u.last_name as created_by_name,
             cu.first_name || ' ' || cu.last_name as client_name
      FROM reports r
      JOIN users u ON u.id = r.created_by
      LEFT JOIN clients c ON c.id = r.client_id
      LEFT JOIN users cu ON cu.id = c.user_id
      WHERE 1=1
    `;
    const params = [];
    if (clientId) { params.push(clientId); query += ` AND r.client_id = $${params.length}`; }
    if (reportType) { params.push(reportType); query += ` AND r.report_type = $${params.length}`; }
    query += ' ORDER BY r.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { clientId, title, content, reportType, isConfidential } = req.body;
    const result = await db.query(
      `INSERT INTO reports (created_by, client_id, title, content, report_type, is_confidential)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, clientId || null, title, content, reportType, isConfidential || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { title, content, reportType, isConfidential } = req.body;
    const result = await db.query(
      `UPDATE reports SET title=$1, content=$2, report_type=$3, is_confidential=$4
       WHERE id=$5 AND created_by=$6 RETURNING *`,
      [title, content, reportType, isConfidential, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [clients, properties, tickets, openTickets] = await Promise.all([
      db.query("SELECT COUNT(*) FROM clients WHERE status = 'active'"),
      db.query("SELECT COUNT(*) FROM properties WHERE status = 'available'"),
      db.query("SELECT COUNT(*) FROM tickets WHERE status NOT IN ('resolved','closed')"),
      db.query("SELECT COUNT(*) FROM tickets WHERE status = 'open'"),
    ]);

    const recentTickets = await db.query(`
      SELECT t.id, t.title, t.priority, t.status, t.created_at,
             u.first_name || ' ' || u.last_name as client_name
      FROM tickets t
      JOIN clients c ON c.id = t.client_id
      JOIN users u ON u.id = c.user_id
      ORDER BY t.created_at DESC LIMIT 5
    `);

    res.json({
      activeClients: parseInt(clients.rows[0].count),
      availableProperties: parseInt(properties.rows[0].count),
      activeTickets: parseInt(tickets.rows[0].count),
      openTickets: parseInt(openTickets.rows[0].count),
      recentTickets: recentTickets.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, is_active, is_super_admin, last_login, created_at
       FROM users WHERE role = 'admin' ORDER BY is_super_admin DESC, first_name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createAdmin = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const hash   = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, is_super_admin)
       VALUES ($1, $2, 'admin', $3, $4, false)
       RETURNING id, email, first_name, last_name, is_super_admin, is_active, created_at`,
      [email.toLowerCase().trim(), hash, firstName.trim(), lastName.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deactivateAdmin = async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }
  try {
    const target = await db.query(
      "SELECT is_super_admin FROM users WHERE id = $1 AND role = 'admin'", [req.params.id]
    );
    if (!target.rows[0]) return res.status(404).json({ error: 'Admin not found' });
    if (target.rows[0].is_super_admin) {
      return res.status(403).json({ error: 'Cannot deactivate a super admin' });
    }
    await db.query('UPDATE users SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Admin deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.reactivateAdmin = async (req, res) => {
  try {
    const result = await db.query(
      "UPDATE users SET is_active = true WHERE id = $1 AND role = 'admin' RETURNING id",
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Admin not found' });
    res.json({ message: 'Admin reactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Inspections / Property Checklists ───────────────────────────────────────

exports.getInspections = async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = `
      SELECT i.*, p.address as property_address, p.town_city, p.postcode,
             u.first_name || ' ' || u.last_name as inspector_name
      FROM inspections i
      JOIN properties p ON p.id = i.property_id
      JOIN users u ON u.id = i.inspector_id
      WHERE 1=1
    `;
    const params = [];
    if (propertyId) { params.push(propertyId); query += ` AND i.property_id = $${params.length}`; }
    query += ' ORDER BY i.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getInspection = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, p.address as property_address, p.town_city, p.postcode,
             u.first_name || ' ' || u.last_name as inspector_name
      FROM inspections i
      JOIN properties p ON p.id = i.property_id
      JOIN users u ON u.id = i.inspector_id
      WHERE i.id = $1
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Inspection not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createInspection = async (req, res) => {
  try {
    const { propertyId, inspectionDate, items, notes } = req.body;
    if (!propertyId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'propertyId and items are required' });
    }
    const hasFail   = items.some(i => i.result === 'fail');
    const hasIssues = items.some(i => i.result === 'issues');
    const overall   = hasFail ? 'fail' : hasIssues ? 'issues' : 'pass';

    const result = await db.query(
      `INSERT INTO inspections (property_id, inspector_id, inspection_date, overall_result, items, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [propertyId, req.user.id, inspectionDate || new Date(), overall, JSON.stringify(items), notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Housing Benefit Settings ─────────────────────────────────────────────────

exports.getHBSettings = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT h.*,
             u.first_name || ' ' || u.last_name AS client_name,
             u.email AS client_email,
             c.id AS client_record_id,
             c.status AS client_status,
             p.address AS property_address
      FROM housing_benefit_settings h
      JOIN clients c ON c.id = h.client_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN allocations a ON a.client_id = c.id AND a.status = 'active'
      LEFT JOIN properties p ON p.id = a.property_id
      ORDER BY u.first_name, u.last_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllClientsForHB = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.id AS client_id,
             u.first_name || ' ' || u.last_name AS client_name,
             u.email,
             c.status,
             p.address AS property_address,
             h.id AS hb_setting_id,
             h.weekly_amount, h.benefit_type, h.payment_day,
             h.reference_number, h.is_active AS hb_active,
             h.start_date AS hb_start_date
      FROM clients c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN allocations a ON a.client_id = c.id AND a.status = 'active'
      LEFT JOIN properties p ON p.id = a.property_id
      LEFT JOIN housing_benefit_settings h ON h.client_id = c.id
      WHERE u.role = 'client'
      ORDER BY u.first_name, u.last_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.upsertHBSetting = async (req, res) => {
  try {
    const { clientId, weeklyAmount, benefitType, paymentDay, referenceNumber, startDate, notes, isActive } = req.body;
    if (!clientId || weeklyAmount === undefined) {
      return res.status(400).json({ error: 'clientId and weeklyAmount are required' });
    }
    const result = await db.query(`
      INSERT INTO housing_benefit_settings
        (client_id, weekly_amount, benefit_type, payment_day, reference_number, start_date, notes, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (client_id) DO UPDATE SET
        weekly_amount    = EXCLUDED.weekly_amount,
        benefit_type     = EXCLUDED.benefit_type,
        payment_day      = EXCLUDED.payment_day,
        reference_number = EXCLUDED.reference_number,
        start_date       = EXCLUDED.start_date,
        notes            = EXCLUDED.notes,
        is_active        = EXCLUDED.is_active,
        updated_at       = NOW()
      RETURNING *
    `, [clientId, weeklyAmount, benefitType || 'housing_benefit',
        paymentDay || 'Monday', referenceNumber || null,
        startDate || new Date(), notes || null,
        isActive !== false]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Payments ─────────────────────────────────────────────────────────────────

exports.getPayments = async (req, res) => {
  try {
    const { clientId, status, weekStart, paymentType, limit } = req.query;
    let query = `
      SELECT pay.*,
             u.first_name || ' ' || u.last_name AS client_name,
             p.address AS property_address,
             p.town_city AS property_town
      FROM payments pay
      JOIN clients c ON c.id = pay.client_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN properties p ON p.id = pay.property_id
      WHERE 1=1
    `;
    const params = [];
    if (clientId)    { params.push(clientId);    query += ` AND pay.client_id = $${params.length}`; }
    if (status)      { params.push(status);      query += ` AND pay.status = $${params.length}`; }
    if (paymentType) { params.push(paymentType); query += ` AND pay.payment_type = $${params.length}`; }
    if (weekStart)   { params.push(weekStart);   query += ` AND pay.week_start_date >= $${params.length}`; }
    query += ' ORDER BY pay.week_start_date DESC, u.first_name';
    if (limit) { params.push(parseInt(limit)); query += ` LIMIT $${params.length}`; }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const {
      clientId, propertyId, paymentType, amountExpected, amountReceived,
      weekStartDate, weekEndDate, dueDate, paidDate, status, reference, notes
    } = req.body;
    if (!clientId || !weekStartDate || !weekEndDate) {
      return res.status(400).json({ error: 'clientId, weekStartDate, weekEndDate are required' });
    }
    const result = await db.query(`
      INSERT INTO payments
        (client_id, property_id, payment_type, amount_expected, amount_received,
         week_start_date, week_end_date, due_date, paid_date, status, reference, notes, recorded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [clientId, propertyId || null, paymentType || 'housing_benefit',
        amountExpected || 0, amountReceived || 0,
        weekStartDate, weekEndDate, dueDate || null,
        paidDate || null,
        status || 'pending',
        reference || null, notes || null, req.user.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { amountReceived, status, paidDate, reference, notes } = req.body;
    const result = await db.query(`
      UPDATE payments SET
        amount_received = COALESCE($1, amount_received),
        status          = COALESCE($2, status),
        paid_date       = COALESCE($3::timestamptz, paid_date),
        reference       = COALESCE($4, reference),
        notes           = COALESCE($5, notes),
        recorded_by     = $6,
        updated_at      = NOW()
      WHERE id = $7
      RETURNING *
    `, [amountReceived ?? null, status || null,
        paidDate || null, reference || null, notes || null,
        req.user.id, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [monthly, overdue, received, pending] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(amount_expected),0) AS total FROM payments
                WHERE week_start_date >= $1`, [monthStart]),
      db.query(`SELECT COUNT(*) AS count, COALESCE(SUM(amount_expected - amount_received),0) AS shortfall
                FROM payments WHERE status = 'overdue'`),
      db.query(`SELECT COALESCE(SUM(amount_received),0) AS total FROM payments
                WHERE status IN ('received','partial') AND week_start_date >= $1`, [monthStart]),
      db.query(`SELECT COUNT(*) AS count FROM payments WHERE status = 'pending'`),
    ]);

    res.json({
      monthlyExpected:  parseFloat(monthly.rows[0].total),
      monthlyReceived:  parseFloat(received.rows[0].total),
      overdueCount:     parseInt(overdue.rows[0].count),
      overdueShortfall: parseFloat(overdue.rows[0].shortfall),
      pendingCount:     parseInt(pending.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Generate weekly payment records for all active HB clients for the next N weeks
exports.generateWeeklyPayments = async (req, res) => {
  try {
    const { weeksAhead = 4 } = req.body;
    const settings = await db.query(`
      SELECT h.*, c.id AS client_id,
             a.property_id
      FROM housing_benefit_settings h
      JOIN clients c ON c.id = h.client_id
      LEFT JOIN allocations a ON a.client_id = c.id AND a.status = 'active'
      WHERE h.is_active = true
    `);

    let created = 0;
    const today = new Date();
    // Find the most recent Monday
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ...
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + daysToMonday);
    thisMonday.setHours(0, 0, 0, 0);

    for (const setting of settings.rows) {
      for (let w = 0; w < parseInt(weeksAhead); w++) {
        const weekStart = new Date(thisMonday);
        weekStart.setDate(thisMonday.getDate() + w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekStartStr = weekStart.toISOString().slice(0, 10);

        // Skip if already exists for this client + week
        const exists = await db.query(
          `SELECT id FROM payments WHERE client_id = $1 AND week_start_date = $2 AND payment_type = $3`,
          [setting.client_id, weekStartStr, setting.benefit_type]
        );
        if (exists.rows.length > 0) continue;

        const isPast = weekEnd < today;
        const status = isPast ? 'overdue' : 'pending';

        await db.query(`
          INSERT INTO payments
            (client_id, property_id, payment_type, amount_expected, amount_received,
             week_start_date, week_end_date, due_date, status, recorded_by)
          VALUES ($1,$2,$3,$4,0,$5,$6,$7,$8,$9)
        `, [setting.client_id, setting.property_id || null,
            setting.benefit_type, setting.weekly_amount,
            weekStartStr, weekEnd.toISOString().slice(0, 10),
            weekStartStr, // due on Monday of that week
            status, req.user.id]);
        created++;
      }
    }
    res.json({ created, message: `Generated ${created} new payment records` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
