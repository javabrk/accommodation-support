-- Social Support Accommodation Database Schema (UK Edition)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (both admins and clients authenticate here)
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email            VARCHAR(255) UNIQUE,
  phone_number     VARCHAR(20) UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  role             VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'client')),
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  is_active        BOOLEAN DEFAULT true,
  is_super_admin   BOOLEAN DEFAULT false NOT NULL,
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT users_contact_check CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

-- Properties table (UK address format)
CREATE TABLE IF NOT EXISTS properties (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address       VARCHAR(255) NOT NULL,
  town_city     VARCHAR(100) NOT NULL,
  county        VARCHAR(100),
  postcode      VARCHAR(10)  NOT NULL,
  property_type VARCHAR(50)  NOT NULL CHECK (property_type IN (
                  'house','terraced','semi-detached','detached',
                  'flat','bungalow','studio','bedsit','maisonette','apartment','unit','townhouse')),
  bedrooms      INTEGER NOT NULL DEFAULT 1,
  bathrooms     INTEGER NOT NULL DEFAULT 1,
  capacity      INTEGER NOT NULL DEFAULT 1,
  status        VARCHAR(30) NOT NULL DEFAULT 'available'
                CHECK (status IN ('available','occupied','maintenance','inactive')),
  monthly_rent  DECIMAL(10,2),
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Client profiles (linked to users with role='client')
CREATE TABLE IF NOT EXISTS clients (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone                           VARCHAR(20),
  date_of_birth                   DATE,
  gender                          VARCHAR(20),
  nhs_number                      VARCHAR(20),
  support_needs                   TEXT,
  -- UK address (populated on self-registration)
  address_line1                   VARCHAR(255),
  town_city                       VARCHAR(100),
  county                          VARCHAR(100),
  postcode                        VARCHAR(10),
  -- Emergency contact
  emergency_contact_name          VARCHAR(200),
  emergency_contact_phone         VARCHAR(20),
  emergency_contact_relationship  VARCHAR(100),
  -- Tenancy
  move_in_date                    DATE,
  move_out_date                   DATE,
  status                          VARCHAR(30) NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('active','inactive','pending','exited')),
  notes                           TEXT,
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- Property allocations
CREATE TABLE IF NOT EXISTS allocations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id)    ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE,
  status      VARCHAR(30) NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','ended','pending')),
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS tickets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category    VARCHAR(50) NOT NULL
              CHECK (category IN ('maintenance','financial','support','complaint','general','emergency')),
  priority    VARCHAR(20) NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('low','medium','high','urgent')),
  status      VARCHAR(30) NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','in_progress','pending_client','resolved','closed')),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket messages / replies
CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  message     TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Case reports / notes
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by      UUID NOT NULL REFERENCES users(id),
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  title           VARCHAR(255) NOT NULL,
  content         TEXT NOT NULL,
  report_type     VARCHAR(50) NOT NULL
                  CHECK (report_type IN ('case_note','incident','progress','assessment','exit','other')),
  is_confidential BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(500) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone          ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_clients_user_id      ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status       ON clients(status);
CREATE INDEX IF NOT EXISTS idx_allocations_client   ON allocations(client_id);
CREATE INDEX IF NOT EXISTS idx_allocations_property ON allocations(property_id);
CREATE INDEX IF NOT EXISTS idx_tickets_client       ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status       ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_msgs          ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_reports_client       ON reports(client_id);

-- ── Auto-update trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at      BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at    BEFORE UPDATE ON clients     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at    BEFORE UPDATE ON tickets     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at    BEFORE UPDATE ON reports     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed: super admin (password: Admin@123) ───────────────────────────────────
-- Hash generated with bcrypt cost 10 for the string "Admin@123"
INSERT INTO users (email, password_hash, role, first_name, last_name, is_super_admin)
VALUES (
  'admin@accommodation.com',
  '$2a$10$V8w8sPMNUz8XUamPsCfukucoeaLFSzbLEkEgq6LIXYbqhWO11L8XC',
  'admin',
  'System',
  'Admin',
  true
) ON CONFLICT (email) DO UPDATE SET is_super_admin = true;
