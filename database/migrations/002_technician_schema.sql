-- Migration 002: Technician Mode Schema
-- ======================================
-- Adiciona tabelas para gestao de clientes, dispositivos e ordens de servico
-- Suporte ao modo tecnico profissional

BEGIN;

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    document VARCHAR(50),
    address TEXT,
    notes TEXT,
    technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    imei VARCHAR(20) UNIQUE,
    serial_number VARCHAR(50),
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    condition_status VARCHAR(50) DEFAULT 'unknown' CHECK (condition_status IN (
        'unknown',
        'good',
        'fair',
        'damaged',
        'non_functional'
    )),
    has_icloud_password BOOLEAN DEFAULT false,
    find_my_status VARCHAR(50) DEFAULT 'unknown' CHECK (find_my_status IN (
        'unknown',
        'on',
        'off'
    )),
    activation_lock BOOLEAN DEFAULT false,
    notes TEXT,
    registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Orders Table
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN (
        'reset-with-password',
        'forgot-password',
        'two-factor',
        'activation-lock',
        'account-locked',
        'device-used',
        'screen-repair',
        'battery-replacement',
        'other'
    )),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'in_progress',
        'completed',
        'delivered',
        'cancelled'
    )),
    diagnosis JSONB,
    steps_completed JSONB DEFAULT '[]',
    result TEXT,
    notes TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Reports Table
CREATE TABLE IF NOT EXISTS service_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    client_data JSONB NOT NULL,
    device_data JSONB NOT NULL,
    service_data JSONB NOT NULL,
    technician_name VARCHAR(255),
    disclaimer_accepted BOOLEAN DEFAULT false,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    printed_at TIMESTAMP
);

-- Add technician role to users CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'support', 'admin', 'technician'));

-- Update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_orders_updated_at ON service_orders;
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_technician ON clients(technician_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_devices_client ON devices(client_id);
CREATE INDEX IF NOT EXISTS idx_devices_imei ON devices(imei);
CREATE INDEX IF NOT EXISTS idx_service_orders_client ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_technician ON service_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_reports_order ON service_reports(order_id);

COMMIT;
