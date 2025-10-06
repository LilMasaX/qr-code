export interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  location?: string;
  max_capacity?: number;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price: number;
  quantity_available: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  ticket_type_id: string;
  ticket_code: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  is_assigned: boolean;
  is_used: boolean;
  used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketValidation {
  id: string;
  ticket_id: string;
  validated_at: string;
  validated_by?: string;
  validation_location?: string;
}

export interface TicketWithDetails extends Ticket {
  events: Pick<Event, 'name' | 'date' | 'location'>;
  ticket_types: Pick<TicketType, 'name' | 'price'>;
}

export interface EventStats {
  total: number;
  used: number;
  assigned: number;
  unassigned: number;
  pending: number;
}