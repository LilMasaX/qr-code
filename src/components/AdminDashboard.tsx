'use client';

import { useState, useEffect } from 'react';
import { TicketService } from '@/lib/ticket-service';
import { Event, EventStats } from '@/types';

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [stats, setStats] = useState<EventStats | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventData(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const eventsData = await TicketService.getEvents();
      setEvents(eventsData);
      
      // Seleccionar el primer evento por defecto
      if (eventsData.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsData[0].id);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  const loadEventData = async (eventId: string) => {
    setLoading(true);
    try {
      const [statsData, ticketsData] = await Promise.all([
        TicketService.getEventStats(eventId),
        TicketService.getEventTickets(eventId)
      ]);
      
      setStats(statsData);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error cargando datos del evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (selectedEventId) {
      loadEventData(selectedEventId);
    }
  };

  const getStatusBadge = (ticket: any) => {
    if (ticket.is_used) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          Utilizada
        </span>
      );
    } else if (ticket.is_assigned) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          Asignada
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-black">
          Sin asignar
        </span>
      );
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">Panel de Administración</h1>
        <button
          onClick={refreshData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>
      
      {/* Selector de evento */}
      <div className="bg-white rounded-lg shadow-md p-6 text-black">
        <label className="block text-sm font-medium mb-2 ">Seleccionar Evento</label>
        <select 
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full max-w-md p-3 border rounded-md"
        >
          <option value="">Seleccionar evento...</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.name} - {new Date(event.date).toLocaleDateString()}
            </option>
          ))}
        </select>

        {selectedEvent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-bold text-lg">{selectedEvent.name}</h3>
            <p className="text-muted">{selectedEvent.description}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
              <span><strong>Fecha:</strong> {new Date(selectedEvent.date).toLocaleString()}</span>
              <span><strong>Ubicación:</strong> {selectedEvent.location || 'No especificada'}</span>
              {selectedEvent.max_capacity && (
                <span><strong>Capacidad:</strong> {selectedEvent.max_capacity}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted">Total Entradas</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-green-600">{stats.used}</div>
            <div className="text-sm text-muted">Utilizadas</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted">Pendientes</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.assigned}</div>
            <div className="text-sm text-muted">Asignadas</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-black">{stats.unassigned}</div>
            <div className="text-sm text-muted">Sin Asignar</div>
          </div>
        </div>
      )}

      {/* Barra de progreso */}
      {stats && stats.total > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Progreso del Evento</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-green-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${(stats.used / stats.total) * 100}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-sm text-muted">
            <span>{stats.used} de {stats.total} entradas utilizadas</span>
            <span>{Math.round((stats.used / stats.total) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Lista de tickets */}
      {tickets.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold">Entradas del Evento ({tickets.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-muted">Cargando...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Invitado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Usado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-black">
                        {ticket.ticket_code}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {ticket.ticket_types.name}
                          <div className="text-xs text-muted">${ticket.ticket_types.price}</div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {ticket.guest_name || (
                            <span className="text-muted italic">Sin asignar</span>
                        )}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {ticket.guest_email || (
                            <span className="text-muted italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ticket)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {new Date(ticket.created_at).toLocaleDateString()}
                        <div className="text-xs">
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {ticket.used_at ? (
                          <>
                            {new Date(ticket.used_at).toLocaleDateString()}
                            <div className="text-xs">
                              {new Date(ticket.used_at).toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted italic">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay datos */}
      {!selectedEventId && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-muted">Selecciona un evento para ver las estadísticas y entradas</p>
        </div>
      )}

      {selectedEventId && tickets.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-muted">No hay entradas generadas para este evento</p>
        </div>
      )}
    </div>
  );
}