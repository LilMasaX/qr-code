# Configuración Rápida de Supabase

## Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New project"
4. Selecciona tu organización
5. Elige un nombre para tu proyecto
6. Selecciona una región cercana
7. Crea una contraseña fuerte para la base de datos
8. Haz clic en "Create new project"

## Paso 2: Obtener las Credenciales

1. Una vez creado el proyecto, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - `Project URL` → Este será tu `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role secret` → Este será tu `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANTE**: Usa la `service_role` key, NO la `anon` key, porque necesitamos acceso completo a la DB.

## Paso 3: Configurar Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Paso 4: Ejecutar el Script SQL

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `db.sql` de este proyecto
3. Copia todo el contenido
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en "Run" para ejecutar el script

Esto creará:
- ✅ Todas las tablas necesarias
- ✅ Índices para optimización
- ✅ Funciones y triggers automáticos
- ✅ Datos de ejemplo (opcional)

## Paso 5: Verificar la Instalación

Ejecuta el proyecto:

```bash
npm run dev
```

Ve a [http://localhost:3000](http://localhost:3000) y deberías ver:
- Dashboard con eventos de ejemplo
- Poder generar entradas
- Validar códigos QR

## Estructura de Tablas Creadas

- **events**: Información de eventos
- **ticket_types**: Tipos de entrada (General, VIP, etc.)
- **tickets**: Entradas individuales con códigos QR
- **ticket_validations**: Registro de validaciones

## Datos de Ejemplo Incluidos

El script crea automáticamente:
- 2 eventos de ejemplo
- Tipos de entrada para cada evento
- Estructura completa lista para usar

## Solución de Problemas

### Error "Missing Supabase environment variables"
- Verifica que el archivo `.env.local` esté en la raíz del proyecto
- Confirma que las variables tengan exactamente estos nombres
- Reinicia el servidor de desarrollo

### Error "Cannot connect to Supabase"
- Verifica que las URLs y keys sean correctas
- Confirma que el proyecto de Supabase esté activo
- Verifica que usas la `service_role` key

### Tablas no encontradas
- Ejecuta completamente el script `db.sql`
- Verifica en Supabase → Table Editor que las tablas existan

## Próximos Pasos

Una vez configurado:
1. Personaliza los eventos en el Dashboard
2. Genera tus primeras entradas
3. Prueba la validación con códigos QR
4. Configura tu dominio personalizado (opcional)