# Gestión de Vacaciones — La Salle Argentina

Sistema web para la gestión de solicitudes de vacaciones del personal de La Salle Argentina. Permite a los empleados ver su saldo, consultar el calendario del sector y solicitar períodos de vacaciones. Los referentes y administradores aprueban o rechazan solicitudes desde un panel dedicado.

## Stack

- **Next.js 16** — App Router, Turbopack, Server Components
- **Supabase** — base de datos PostgreSQL + almacenamiento
- **Tailwind CSS v4**
- **Resend** — emails transaccionales
- **bcryptjs** — hash de contraseñas de empleados
- **Vercel** — hosting y deploy

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # Completar con valores reales (ver sección más abajo)
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack, hot reload) |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción (requiere build previo) |
| `npm run lint` | Verificar código con ESLint |

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar cada valor:

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | URL base del proyecto Supabase (sin `/rest/v1/`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Clave pública (anon key) de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓* | Clave de servicio — necesaria si RLS bloquea `password_hash` |
| `ADMIN_PASSWORD` | ✓ | Contraseña del panel de administración |
| `RESEND_API_KEY` | ✓ | API key de [Resend](https://resend.com) |
| `EMAIL_FROM` | ✓ | Dirección remitente (dominio verificado en Resend) |
| `NEXT_PUBLIC_APP_URL` | ✓ | URL pública de la app (para links en emails) |
| `NEXT_PUBLIC_GOOGLE_FORM_URL` | — | URL del Google Form para solicitudes (con `?embedded=true`) |

> **Nota sobre `NEXT_PUBLIC_SUPABASE_URL`:** debe ser solo la URL base del proyecto, por ejemplo `https://abcdefgh.supabase.co` — sin `/rest/v1/` al final.

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    # Selección de sector (inicio)
│   ├── [sector]/
│   │   ├── page.tsx                # Login del empleado
│   │   └── dashboard/page.tsx      # Dashboard del empleado
│   ├── admin/
│   │   ├── page.tsx                # Login del administrador
│   │   └── dashboard/page.tsx      # Panel de administración
│   └── api/
│       ├── auth/                   # Login, logout
│       └── solicitudes/            # Crear, aprobar, rechazar
├── components/                     # LsSidebar, LsCard, CalendarioSector, etc.
├── lib/
│   ├── auth.ts                     # Sesiones con cookies
│   ├── emails.ts                   # Templates de email (Resend)
│   └── supabase/                   # Clientes server y browser
├── proxy.ts                        # Protección de rutas (≡ middleware)
└── types/index.ts                  # Tipos TypeScript del schema
```

## Crear empleados en Supabase

Los empleados se crean directamente en la base de datos. La contraseña debe estar hasheada con bcryptjs (costo 10).

**Paso 1 — Generar el hash de la contraseña:**

```bash
node -e "const b = require('bcryptjs'); b.hash('contraseña123', 10).then(h => console.log(h))"
```

**Paso 2 — Insertar en Supabase** (SQL Editor en el dashboard):

```sql
-- Primero obtener el sector_id
SELECT id, nombre FROM sectores;

-- Insertar empleado
INSERT INTO empleados (nombre, email, username, password_hash, sector_id, dias_totales, anio)
VALUES (
  'Juan Pérez',
  'juan.perez@lasalle.edu.ar',
  'juan.perez',
  '$2a$10$...hash-generado-arriba...',
  'uuid-del-sector',
  21,       -- días de vacaciones anuales
  2026
);
```

**Paso 3 — Sectores disponibles:**

| slug | nombre |
|---|---|
| `economato` | Economato |
| `fls` | Fundación La Salle |
| `hec` | Hermanos de las Escuelas Cristianas |
| `eaa` | Equipo de Animación (EAA) |
| `aea` | Asociación Educacionista (AEA) |

Los sectores deben existir previamente en la tabla `sectores` con los slugs exactos indicados.

## Schema de base de datos

```sql
-- Sectores
CREATE TABLE sectores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  slug text UNIQUE NOT NULL,
  referente_email text NOT NULL,
  referente_nombre text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Empleados
CREATE TABLE empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  sector_id uuid REFERENCES sectores(id) NOT NULL,
  dias_totales int NOT NULL DEFAULT 21,
  anio int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Solicitudes
CREATE TABLE solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id uuid REFERENCES empleados(id) NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  dias int NOT NULL,
  tipo text NOT NULL DEFAULT 'ordinaria',
  estado text NOT NULL DEFAULT 'pendiente',
  anio int NOT NULL,
  notas text,
  respondida_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

## Deploy en Vercel

Ver la sección **Pasos de deploy** a continuación.
