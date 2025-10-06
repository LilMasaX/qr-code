'use client';

import { useState } from 'react';
import { useRef } from 'react';
import { TicketService } from '@/lib/ticket-service';
import { supabase } from '@/lib/supabase';

export default function QRScanner() {
  const [scannedCode, setScannedCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationHistory, setValidationHistory] = useState<any[]>([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [unassignedTicket, setUnassignedTicket] = useState<any>(null);
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const html5QrRef = useRef<any>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleScan = async () => {
    if (!scannedCode.trim()) {
      setError('Por favor ingresa un código QR');
      return;
    }

    setLoading(true);
    setError('');
    setValidationResult(null);
    setShowAssignForm(false);

    try {
      let ticketCode = scannedCode.trim();
      
      // Intentar parsear como JSON (formato completo del QR)
      try {
        const qrData = JSON.parse(scannedCode);
        if (qrData.type === 'ticket' && qrData.code) {
          ticketCode = qrData.code;
        }
      } catch {
        // Si no es JSON, asumir que es el código directo
      }

      // Primero obtener la información del ticket sin validarlo
      const { data: ticketInfo, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          events (name, date, location),
          ticket_types (name, price)
        `)
        .eq('ticket_code', ticketCode)
        .single();

      if (ticketError || !ticketInfo) {
        throw new Error('Ticket no encontrado');
      }

      if (ticketInfo.is_used) {
        throw new Error('Ticket ya ha sido utilizado');
      }

      // Verificar que el evento no haya pasado
      const eventDate = new Date(ticketInfo.events.date);
      const now = new Date();
      
      if (eventDate < now) {
        throw new Error('El evento ya ha finalizado');
      }

      // Si el ticket no está asignado, mostrar formulario de asignación
      if (!ticketInfo.is_assigned) {
        setUnassignedTicket(ticketInfo);
        setShowAssignForm(true);
        setScannedCode('');
        return;
      }

      // Si está asignado, proceder con la validación normal
      const result = await TicketService.validateTicket(ticketCode, 'Scanner App');
      setValidationResult(result);
      
      // Agregar al historial
      setValidationHistory(prev => [{
        ...result,
        validatedAt: new Date().toISOString()
      }, ...prev.slice(0, 9)]); // Mantener solo los últimos 10

      // Limpiar el campo
      setScannedCode('');
      
    } catch (err: any) {
      setError(err.message || 'Error validando ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const startCameraScanner = async () => {
    if (cameraActive) return;
    setError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const elementId = 'html5qr-reader';
      const qrRegion = document.getElementById(elementId);
      if (!qrRegion) return;

      const html5Qr = new Html5Qrcode(elementId);
      html5QrRef.current = html5Qr;
      setCameraActive(true);

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText: string) => {
          // cuando se detecta un QR, setear el campo y validar
          setScannedCode(decodedText);
          await handleScan();
          // detener la cámara tras leer
          stopCameraScanner();
        },
        (errorMsg: any) => {
          // ignore temporary decode errors
        }
      );
    } catch (err: any) {
      setError('No se pudo acceder a la cámara: ' + (err.message || String(err)));
      setCameraActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (!html5QrRef.current) return;
    try {
      await html5QrRef.current.stop();
      await html5QrRef.current.clear();
    } catch (e) {
      // ignore
    }
    html5QrRef.current = null;
    setCameraActive(false);
  };

  const handleAssignTicket = async () => {
    if (!guestData.name || !guestData.email) {
      setError('Por favor completa el nombre y email del asistente');
      return;
    }

    if (!unassignedTicket) return;

    setAssignLoading(true);
    setError('');

    try {
      // Asignar el ticket
      await TicketService.assignTicket(unassignedTicket.id, guestData);
      
      // Ahora validar el ticket asignado
      const result = await TicketService.validateTicket(unassignedTicket.ticket_code, 'Scanner App');
      setValidationResult(result);
      
      // Agregar al historial
      setValidationHistory(prev => [{
        ...result,
        validatedAt: new Date().toISOString()
      }, ...prev.slice(0, 9)]);

      // Limpiar formulario
      setShowAssignForm(false);
      setUnassignedTicket(null);
      setGuestData({ name: '', email: '', phone: '' });
      
    } catch (err: any) {
      setError(err.message || 'Error asignando ticket');
    } finally {
      setAssignLoading(false);
    }
  };

  const cancelAssignment = () => {
    setShowAssignForm(false);
    setUnassignedTicket(null);
    setGuestData({ name: '', email: '', phone: '' });
    setError('');
  };

  const clearResults = () => {
    setValidationResult(null);
    setError('');
    setScannedCode('');
    setShowAssignForm(false);
    setUnassignedTicket(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 text-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel de Escaneo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl text-black font-bold mb-6">Validar Entrada</h2>
          
          {!showAssignForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Código QR o Código de Entrada
                </label>
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escanea el QR o pega el código aquí..."
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono"
                  autoFocus
                />
                <p className="text-xs text-muted mt-1">
                  Presiona Enter para validar
                </p>

                <div className="mt-3 flex items-center space-x-3">
                  <button
                    onClick={() => (cameraActive ? stopCameraScanner() : startCameraScanner())}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {cameraActive ? 'Detener cámara' : 'Usar cámara'}
                  </button>
                  <span className="text-xs text-muted">También puedes pegar el código</span>
                </div>

                <div id="html5qr-reader" className="mt-3 w-full" />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleScan}
                  disabled={loading || !scannedCode.trim()}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⟳</span>
                      Validando...
                    </span>
                  ) : (
                    '✓ Validar Entrada'
                  )}
                </button>
                
                <button
                  onClick={clearResults}
                  className="px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Asignación */
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <h3 className="font-bold text-yellow-800">Entrada Sin Asignar</h3>
                    <p className="text-yellow-700 text-sm">
                      Esta entrada no tiene asistente asignado. Por favor completa los datos:
                    </p>
                  </div>
                </div>
                
                {unassignedTicket && (
                  <div className="mt-3 text-sm text-yellow-700">
                    <p><strong>Evento:</strong> {unassignedTicket.events?.name}</p>
                    <p><strong>Tipo:</strong> {unassignedTicket.ticket_types?.name}</p>
                    <p><strong>Código:</strong> {unassignedTicket.ticket_code}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Asistente *</label>
                  <input
                    type="text"
                    value={guestData.name}
                    onChange={(e) => setGuestData({...guestData, name: e.target.value})}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre completo"
                    required
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={guestData.email}
                    onChange={(e) => setGuestData({...guestData, email: e.target.value})}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono (opcional)</label>
                  <input
                    type="tel"
                    value={guestData.phone}
                    onChange={(e) => setGuestData({...guestData, phone: e.target.value})}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAssignTicket}
                  disabled={assignLoading || !guestData.name || !guestData.email}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⟳</span>
                      Asignando...
                    </span>
                  ) : (
                    '✓ Asignar y Validar'
                  )}
                </button>
                
                <button
                  onClick={cancelAssignment}
                  className="px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Resultado de Validación */}
          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❌</span>
                <div>
                  <h3 className="font-bold">Error de Validación</h3>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {validationResult && (
            <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">✅</span>
                <h3 className="font-bold text-lg">¡Entrada Válida!</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Evento:</strong>
                    <p>{validationResult.events?.name}</p>
                  </div>
                  <div>
                    <strong>Tipo:</strong>
                    <p>{validationResult.ticket_types?.name}</p>
                  </div>
                </div>
                
                    {validationResult.guest_name && (
                  <div>
                    <strong>Invitado:</strong>
                    <p>{validationResult.guest_name}</p>
                    {validationResult.guest_email && (
                      <p className="text-xs text-muted">{validationResult.guest_email}</p>
                    )}
                  </div>
                )}
                
                <div>
                  <strong>Código:</strong>
                  <p className="font-mono text-xs">{validationResult.ticket_code}</p>
                </div>
                
                <div>
                  <strong>Validado:</strong>
                  <p>{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historial de Validaciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Historial de Validaciones</h3>
          
          {validationHistory.length === 0 ? (
            <div className="text-center text-muted py-8">
              <p className="text-4xl mb-2">📱</p>
              <p>No hay validaciones recientes</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {validationHistory.map((validation, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 rounded-r">
                      <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{validation.events?.name}</p>
                      {validation.guest_name && (
                        <p className="text-sm text-muted">{validation.guest_name}</p>
                      )}
                      <p className="text-xs font-mono text-muted">{validation.ticket_code}</p>
                    </div>
                    <span className="text-xs text-muted">
                      {new Date(validation.validatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {validationHistory.length > 0 && (
            <button
              onClick={() => setValidationHistory([])}
              className="w-full mt-4 text-sm text-muted hover:text-black py-2"
            >
              Limpiar historial
            </button>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Instrucciones de uso:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Escanea el código QR con cualquier app de cámara</li>
          <li>• Copia y pega el contenido en el campo de arriba</li>
          <li>• O escribe directamente el código de la entrada (ej: TKT-1234567890-ABC123)</li>
          <li>• <strong>Entradas sin asignar:</strong> Se mostrará un formulario para completar los datos del asistente</li>
          <li>• <strong>Entradas asignadas:</strong> Se validarán automáticamente</li>
          <li>• El sistema verificará automáticamente la validez de la entrada</li>
        </ul>
      </div>
    </div>
  );
}