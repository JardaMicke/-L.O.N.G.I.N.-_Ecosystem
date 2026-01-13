-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper functions
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS app_port_sequence START WITH 3100 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION get_next_port()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('app_port_sequence');
END;
$$ LANGUAGE plpgsql;

-- Tables are created automatically by TypeORM in development
-- But for reference, here is the full schema:

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_token_expires_at TIMESTAMP,
  theme VARCHAR(50) DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT true,
  timezone VARCHAR(100) DEFAULT 'UTC',
  last_login TIMESTAMP,
  last_login_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- Initial Data
INSERT INTO users (username, email, password_hash, role, is_verified, is_active)
VALUES ('admin', 'admin@longin.local', '$2b$10$PLACEHOLDER_HASH_HERE', 'admin', true, true)
ON CONFLICT (username) DO NOTHING;
