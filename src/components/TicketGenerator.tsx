'use client';

import { useState, useEffect } from 'react';
import { TicketService } from '@/lib/ticket-service';
import { Event, TicketType } from '@/types';

interface TicketGeneratorProps {
  eventId?: string;
}

export default function TicketGenerator({ eventId: initialEventId }: TicketGeneratorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || '');
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState('');
  const [ticketType, setTicketType] = useState<'assigned' | 'unassigned'>('unassigned');
  const [quantity, setQuantity] = useState(1);
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [generatedTickets, setGeneratedTickets] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadTicketTypes(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const eventsData = await TicketService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  const loadTicketTypes = async (eventId: string) => {
    try {
      const types = await TicketService.getEventTicketTypes(eventId);
      setTicketTypes(types);
      setSelectedTicketTypeId('');
    } catch (error) {
      console.error('Error loading ticket types:', error);
    }
  };

  const handleGenerateTickets = async () => {
    if (!selectedEventId || !selectedTicketTypeId) {
      alert('Por favor selecciona evento y tipo de ticket');
      return;
    }

    if (ticketType === 'assigned' && (!guestData.name || !guestData.email)) {
      alert('Por favor completa los datos del invitado');
      return;
    }

    setLoading(true);
    const newTickets: any[] = [];

    try {
      for (let i = 0; i < quantity; i++) {
        let ticket;
        
        if (ticketType === 'assigned') {
          ticket = await TicketService.createAssignedTicket(
            selectedEventId, 
            selectedTicketTypeId, 
            guestData
          );
        } else {
          ticket = await TicketService.createUnassignedTicket(
            selectedEventId, 
            selectedTicketTypeId
          );
        }

        const qrCode = await TicketService.generateQRCode(ticket.ticket_code);
        newTickets.push({ ...ticket, qrCode });
      }

      setGeneratedTickets(prev => [...prev, ...newTickets]);
      
      // Limpiar formulario
      if (ticketType === 'assigned') {
        setGuestData({ name: '', email: '', phone: '' });
      }
      setQuantity(1);
      
    } catch (error) {
      console.error('Error generando tickets:', error);
      alert('Error generando tickets');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = (ticket: any) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 600;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ENTRADA', canvas.width / 2, 40);

    // Información del ticket
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Código: ${ticket.ticket_code}`, 20, 80);
    
    if (ticket.guest_name) {
      ctx.fillText(`Invitado: ${ticket.guest_name}`, 20, 110);
    }

    // QR Code
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 50, 150, 300, 300);
      
      // Descargar
      const link = document.createElement('a');
      link.download = `ticket-${ticket.ticket_code}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    img.src = ticket.qrCode;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-black">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Generar Entradas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Evento</label>
            <select 
              value={selectedEventId} 
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-3 border rounded-md"
            >
              <option value="">Seleccionar evento...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} - {new Date(event.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo de entrada</label>
            <select 
              value={selectedTicketTypeId} 
              onChange={(e) => setSelectedTicketTypeId(e.target.value)}
              className="w-full p-3 border rounded-md"
              disabled={!selectedEventId}
            >
              <option value="">Seleccionar tipo...</option>
              {ticketTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} - ${type.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo de asignación</label>
            <select 
              value={ticketType} 
              onChange={(e) => setTicketType(e.target.value as 'assigned' | 'unassigned')}
              className="w-full p-3 border rounded-md"
            >
              <option value="unassigned">Sin asignar</option>
              <option value="assigned">Asignada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cantidad</label>
            <input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full p-3 border rounded-md"
            />
          </div>
        </div>

        {ticketType === 'assigned' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre *</label>
              <input
                type="text"
                value={guestData.name}
                onChange={(e) => setGuestData({...guestData, name: e.target.value})}
                className="w-full p-3 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={guestData.email}
                onChange={(e) => setGuestData({...guestData, email: e.target.value})}
                className="w-full p-3 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Teléfono</label>
              <input
                type="tel"
                value={guestData.phone}
                onChange={(e) => setGuestData({...guestData, phone: e.target.value})}
                className="w-full p-3 border rounded-md"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerateTickets}
          disabled={loading || !selectedEventId || !selectedTicketTypeId}
          className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generando...' : `Generar ${quantity} entrada(s)`}
        </button>
      </div>

      {generatedTickets.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Entradas Generadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedTickets.map((ticket, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="text-center mb-4">
                  <img 
                    src={ticket.qrCode} 
                    alt={`QR ${ticket.ticket_code}`}
                    className="mx-auto w-32 h-32"
                  />
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Código:</strong> {ticket.ticket_code}</p>
                  {ticket.guest_name && (
                    <p><strong>Invitado:</strong> {ticket.guest_name}</p>
                  )}
                  <p><strong>Estado:</strong> {ticket.is_assigned ? 'Asignada' : 'Sin asignar'}</p>
                </div>
                <button
                  onClick={() => downloadTicket(ticket)}
                  className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
                >
                  Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}