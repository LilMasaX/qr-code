import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { Ticket, TicketWithDetails, EventStats, Event, TicketType } from '@/types';

export class TicketService {
  // Generar código único para el ticket
  static generateTicketCode(): string {
    return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  // Crear entrada sin asignar
  static async createUnassignedTicket(eventId: string, ticketTypeId: string): Promise<Ticket> {
    const ticketCode = this.generateTicketCode();
    
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        ticket_code: ticketCode,
        is_assigned: false
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase createUnassignedTicket error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }
    return data;
  }

  // Crear entrada asignada
  static async createAssignedTicket(
    eventId: string, 
    ticketTypeId: string, 
    guestData: {
      name: string;
      email: string;
      phone?: string;
    }
  ): Promise<Ticket> {
    const ticketCode = this.generateTicketCode();
    
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        ticket_code: ticketCode,
        guest_name: guestData.name,
        guest_email: guestData.email,
        guest_phone: guestData.phone,
        is_assigned: true
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase createAssignedTicket error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }
    return data;
  }

  // Asignar entrada sin asignar
  static async assignTicket(
    ticketId: string,
    guestData: {
      name: string;
      email: string;
      phone?: string;
    }
  ): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        guest_name: guestData.name,
        guest_email: guestData.email,
        guest_phone: guestData.phone,
        is_assigned: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .eq('is_assigned', false)
      .select()
      .single();

    if (error) {
      console.error('Supabase assignTicket error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }
    return data;
  }

  // Validar ticket por código QR
  static async validateTicket(ticketCode: string, validatedBy?: string): Promise<TicketWithDetails> {
    // Verificar que el ticket existe y no ha sido usado
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        events (name, date, location),
        ticket_types (name, price)
      `)
      .eq('ticket_code', ticketCode)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket no encontrado');
    }

    if (ticket.uses_count >= ticket.max_uses) {
      throw new Error('Ticket ya ha sido utilizado');
    }

    // Verificar que el evento no haya pasado
    const eventDate = new Date(ticket.events.date);
    const now = new Date();
    
    if (eventDate < now) {
      throw new Error('El evento ya ha finalizado');
    }

    // Marcar ticket como usado
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        uses_count: ticket.uses_count + 1,
  // used_at: new Date().toISOString(), // Eliminado, usar uses_count/max_uses
      })
      .eq('id', ticket.id);

    if (updateError) {
      console.error('Supabase validateTicket update error:', updateError);
      throw new Error(updateError.message ?? JSON.stringify(updateError));
    }

    // Registrar la validación
    const { error: validationError } = await supabase
      .from('ticket_validations')
      .insert({
        ticket_id: ticket.id,
        validated_by: validatedBy
      });

    if (validationError) {
      console.error('Supabase validateTicket insert validation error:', validationError);
      throw new Error(validationError.message ?? JSON.stringify(validationError));
    }

    return ticket;
  }

  // Generar QR Code
  static async generateQRCode(ticketCode: string): Promise<string> {
    const qrData = JSON.stringify({
      type: 'ticket',
      code: ticketCode,
      timestamp: Date.now()
    });
    
    return await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  }

  // Obtener todos los tickets de un evento
  static async getEventTickets(eventId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_types (name, price)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getEventTickets error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }
    return data || [];
  }

  // Obtener estadísticas del evento
  static async getEventStats(eventId: string): Promise<EventStats> {
    // Fetch minimal ticket info for the event. We only need per-ticket flags.
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, uses_count, is_assigned')
      .eq('event_id', eventId);

    if (error) {
      console.error('Supabase getEventStats error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }

    const ticketList = tickets || [];

    // Count each ticket once — a ticket is considered "used" if its uses_count > 0,
    // regardless of how many times it was used.
    const total = ticketList.length;
    const used = ticketList.filter(t => (t?.uses_count ?? 0) > 0).length;
    const pending = ticketList.filter(t => (t?.uses_count ?? 0) === 0).length;
    const assigned = ticketList.filter(t => !!t.is_assigned).length;
    const unassigned = ticketList.filter(t => !t.is_assigned).length;

    return { total, used, assigned, unassigned, pending };
  }

  // Obtener todos los eventos
  static async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Supabase getEvents error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }
    return data || [];
  }

  // Obtener tipos de ticket de un evento
  static async getEventTicketTypes(eventId: string): Promise<TicketType[]> {
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .order('price', { ascending: true });

    if (error) {
      console.error('Supabase getEventTicketTypes error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }
    return data || [];
  }

  // Crear nuevo evento
  static async createEvent(eventData: {
    name: string;
    description?: string;
    date: string;
    location?: string;
    max_capacity?: number;
  }): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error('Supabase createEvent error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }
    return data;
  }

  // Crear tipo de ticket
  static async createTicketType(ticketTypeData: {
    event_id: string;
    name: string;
    price: number;
    quantity_available: number;
  }): Promise<TicketType> {
    const { data, error } = await supabase
      .from('ticket_types')
      .insert(ticketTypeData)
      .select()
      .single();

    if (error) {
      console.error('Supabase createTicketType error:', error);
      throw new Error(error.message ?? JSON.stringify(error));
    }
    return data;
  }
}