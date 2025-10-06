-- Base de datos para sistema de gestión de entradas con QR
-- Ejecutar en Supabase SQL Editor

-- Tabla de eventos
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  max_capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tipos de entrada
CREATE TABLE ticket_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "General", "VIP", "Prensa", etc.
  price DECIMAL(10,2) DEFAULT 0,
  quantity_available INTEGER,
  max_uses INTEGER DEFAULT 1, -- Máximo número de veces que se puede usar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de entradas/tickets
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE CASCADE,
  ticket_code VARCHAR(50) UNIQUE NOT NULL, -- Código único para el QR
  guest_name VARCHAR(255), -- NULL para entradas sin asignar
  guest_email VARCHAR(255), -- NULL para entradas sin asignar
  guest_phone VARCHAR(20),
  is_assigned BOOLEAN DEFAULT FALSE,
  uses_count INTEGER DEFAULT 0, -- Contador de usos
  max_uses INTEGER DEFAULT 1, -- Máximo usos para este ticket específico
  is_active BOOLEAN DEFAULT TRUE, -- Si el ticket está activo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de validaciones/escaneos (ahora guarda cada uso)
CREATE TABLE ticket_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_by VARCHAR(255), -- Usuario que validó
  validation_location VARCHAR(255), -- Ubicación del escaneo
  entry_type VARCHAR(20) DEFAULT 'entry', -- 'entry' o 'exit'
  notes TEXT -- Notas adicionales
);

-- Índices para optimizar consultas
CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_active ON tickets(is_active);
CREATE INDEX idx_tickets_assigned ON tickets(is_assigned);
CREATE INDEX idx_ticket_validations_ticket ON ticket_validations(ticket_id);
CREATE INDEX idx_ticket_validations_date ON ticket_validations(validated_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para validar entrada múltiple
CREATE OR REPLACE FUNCTION validate_ticket_usage(ticket_uuid UUID)
RETURNS JSON AS $$
DECLARE
    ticket_record RECORD;
    validation_count INTEGER;
    result JSON;
BEGIN
    -- Obtener información del ticket
    SELECT t.*, tt.name as ticket_type_name, e.name as event_name, e.date as event_date
    INTO ticket_record
    FROM tickets t
    JOIN ticket_types tt ON t.ticket_type_id = tt.id
    JOIN events e ON t.event_id = e.id
    WHERE t.id = ticket_uuid;
    
    -- Verificar si el ticket existe
    IF NOT FOUND THEN
        result := json_build_object(
            'valid', false,
            'message', 'Ticket no encontrado'
        );
        RETURN result;
    END IF;
    
    -- Verificar si el ticket está activo
    IF NOT ticket_record.is_active THEN
        result := json_build_object(
            'valid', false,
            'message', 'Ticket desactivado'
        );
        RETURN result;
    END IF;
    
    -- Verificar si el evento ya pasó
    IF ticket_record.event_date < NOW() THEN
        result := json_build_object(
            'valid', false,
            'message', 'El evento ya ha finalizado'
        );
        RETURN result;
    END IF;
    
    -- Contar usos actuales
    SELECT COUNT(*) INTO validation_count
    FROM ticket_validations
    WHERE ticket_id = ticket_uuid;
    
    -- Verificar límite de usos
    IF validation_count >= ticket_record.max_uses THEN
        result := json_build_object(
            'valid', false,
            'message', 'Ticket ha alcanzado el límite de usos',
            'uses_count', validation_count,
            'max_uses', ticket_record.max_uses
        );
        RETURN result;
    END IF;
    
    -- Ticket válido
    result := json_build_object(
        'valid', true,
        'message', 'Ticket válido',
        'ticket_code', ticket_record.ticket_code,
        'guest_name', ticket_record.guest_name,
        'event_name', ticket_record.event_name,
        'ticket_type_name', ticket_record.ticket_type_name,
        'uses_count', validation_count,
        'max_uses', ticket_record.max_uses,
        'remaining_uses', ticket_record.max_uses - validation_count
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar uses_count cuando se inserta una validación
CREATE OR REPLACE FUNCTION update_ticket_uses_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tickets 
    SET uses_count = (
        SELECT COUNT(*) 
        FROM ticket_validations 
        WHERE ticket_id = NEW.ticket_id
    )
    WHERE id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en eventos
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en tickets
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar contador de usos
CREATE TRIGGER update_uses_count_trigger
    AFTER INSERT ON ticket_validations
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_uses_count();

-- Datos de ejemplo (opcional)
INSERT INTO events (name, description, date, location, max_capacity) VALUES
('Conferencia Tech 2025', 'Conferencia sobre las últimas tecnologías', '2025-12-15 09:00:00+00', 'Centro de Convenciones', 500),
('Concierto Navideño', 'Concierto especial de navidad', '2025-12-20 20:00:00+00', 'Teatro Municipal', 200),
('Festival de Verano', 'Festival de 3 días con múltiples entradas', '2025-12-25 10:00:00+00', 'Parque Central', 1000);

-- Obtener los IDs de los eventos insertados para los tipos de ticket
DO $$
DECLARE
    tech_event_id UUID;
    concert_event_id UUID;
    festival_event_id UUID;
BEGIN
    SELECT id INTO tech_event_id FROM events WHERE name = 'Conferencia Tech 2025';
    SELECT id INTO concert_event_id FROM events WHERE name = 'Concierto Navideño';
    SELECT id INTO festival_event_id FROM events WHERE name = 'Festival de Verano';
    
    -- Tipos de ticket para la conferencia (uso único)
    INSERT INTO ticket_types (event_id, name, price, quantity_available, max_uses) VALUES
    (tech_event_id, 'General', 50.00, 300, 1),
    (tech_event_id, 'VIP', 100.00, 50, 2), -- VIP puede entrar 2 veces
    (tech_event_id, 'Prensa', 0.00, 20, 3); -- Prensa puede entrar 3 veces
    
    -- Tipos de ticket para el concierto (uso único)
    INSERT INTO ticket_types (event_id, name, price, quantity_available, max_uses) VALUES
    (concert_event_id, 'Platea', 80.00, 100, 1),
    (concert_event_id, 'Balcón', 60.00, 100, 1);
    
    -- Tipos de ticket para el festival (múltiples usos)
    INSERT INTO ticket_types (event_id, name, price, quantity_available, max_uses) VALUES
    (festival_event_id, 'Pase General', 150.00, 500, 10), -- 10 entradas/salidas
    (festival_event_id, 'Pase VIP', 300.00, 100, 15), -- 15 entradas/salidas
    (festival_event_id, 'Pase Staff', 0.00, 50, 999); -- Acceso ilimitado
END $$;