# QR Event Manager

Sistema completo de gestión de entradas para eventos con códigos QR. Permite generar entradas asignadas y sin asignar, validar accesos mediante escaneo QR y gestionar estadísticas en tiempo real.

## Características

- 🎫 **Generación de entradas**: Crear entradas asignadas y sin asignar
- 📱 **Validación por QR**: Escaneo y validación de entradas en tiempo real
- 📊 **Dashboard completo**: Estadísticas y gestión de eventos
- 🔒 **Seguridad**: Validación de tickets únicos y control de duplicados
- 📈 **Reportes**: Estadísticas detalladas de asistencia

## Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + API)
- **QR Generation**: qrcode library
- **Hosting**: Vercel

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia las credenciales del proyecto
3. Ejecuta el script SQL de `db.sql` en el SQL Editor de Supabase
4. Configura las variables de entorno

### 3. Variables de entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_here
```

**Importante**: Usa la `Service Role Key` (no la `anon key`) para tener acceso completo a la base de datos.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura de Base de Datos

### Tablas principales:

- **`events`**: Información de eventos
- **`ticket_types`**: Tipos de entrada por evento (General, VIP, etc.)
- **`tickets`**: Entradas generadas
- **`ticket_validations`**: Registro de validaciones

### Flujo de datos:

1. Se crean eventos y tipos de entrada
2. Se generan tickets (asignados o sin asignar)
3. Cada ticket tiene un código QR único
4. Al escanear, se valida y marca como usado

## Uso

### Dashboard

- Visualiza estadísticas de eventos
- Monitorea entradas utilizadas vs pendientes
- Revisa detalles de todos los tickets

### Generar Entradas

- Selecciona evento y tipo de entrada
- Elige entre asignada o sin asignar
- Genera múltiples entradas a la vez
- Descarga tickets con QR

### Validar Entradas

- Escanea códigos QR
- Valida tickets en tiempo real
- Previene duplicados automáticamente
- Registra validaciones para auditoría

## Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx           # Página principal con navegación
│   ├── layout.tsx         # Layout base
│   └── globals.css        # Estilos globales
├── components/
│   ├── TicketGenerator.tsx # Generador de entradas
│   ├── QRScanner.tsx      # Validador de QR
│   └── AdminDashboard.tsx # Dashboard de administración
├── lib/
│   ├── supabase.ts        # Cliente de Supabase
│   └── ticket-service.ts  # Servicios de tickets
└── types/
    └── index.ts           # Tipos TypeScript
```

## API / Servicios

### TicketService

- `createUnassignedTicket()`: Crear entrada sin asignar
- `createAssignedTicket()`: Crear entrada asignada
- `validateTicket()`: Validar entrada por código
- `generateQRCode()`: Generar código QR
- `getEventStats()`: Obtener estadísticas
- `getEventTickets()`: Listar entradas de evento

## Seguridad

- Validación de tickets únicos
- Prevención de reutilización
- Verificación de fechas de evento
- Registro de auditoría completo

## Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Variables de entorno en producción:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## Personalización

### Agregar campos a tickets:

1. Modifica la tabla `tickets` en Supabase
2. Actualiza los tipos en `src/types/index.ts`
3. Ajusta los formularios en los componentes

### Nuevos tipos de validación:

1. Extiende `TicketService.validateTicket()`
2. Agrega lógica de negocio específica
3. Actualiza la interfaz según necesidades

## Solución de Problemas

### Error de conexión a Supabase:
- Verifica las variables de entorno
- Confirma que usas la Service Role Key
- Revisa que las tablas existan

### Tickets no se generan:
- Verifica que el evento tenga tipos de ticket
- Confirma que los datos requeridos estén completos
- Revisa la consola del navegador para errores

### QR no se valida:
- Confirma que el código QR sea correcto
- Verifica que el ticket no haya sido usado
- Revisa que el evento no haya expirado

## Licencia

Este proyecto está disponible bajo la licencia MIT.
