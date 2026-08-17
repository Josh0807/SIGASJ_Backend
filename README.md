# SIGASJ API

API REST para el portal **SIGASJ** (Sistema de Gestión del Acueducto ASADA San Juan de Santa Cruz). Backend en **Node.js + Express**, conectado al frontend React/Vite.

## Tecnologías

- **Node.js 18+** y **Express**
- **SQLite** (`better-sqlite3`)
- **JWT** para autenticación administrativa
- **bcryptjs** para hash de contraseñas

## Estructura

```
src/
├── index.js                 # Arranque
├── app.js                   # App Express
├── routes/
│   ├── publicRoutes.js
│   └── privateRoutes.js
├── features/
│   ├── auth/
│   ├── announcements/
│   ├── gallery/
│   ├── transparencia/
│   ├── landing/
│   ├── averias/
│   ├── solicitudes/
│   ├── lecturas/
│   └── usuarios/
└── shared/
uploads/
```

## Instalación y ejecución

```powershell
cp .env.example .env
npm.cmd install
npm.cmd run dev
```

La API queda en `http://localhost:3000`. El frontend Vite hace proxy de `/api` y `/uploads` a este puerto.

La base SQLite (`sigasj.db`) se crea al iniciar.

### Credenciales por defecto

| Usuario     | Contraseña      | Rol        |
|-------------|-----------------|------------|
| `admin`     | `admin1234`     | admin      |
| `fontanero` | `fontanero1234` | fontanero  |

## Endpoints principales

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/health` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/public/comunicados` | No |
| GET | `/api/public/galeria` | No |
| GET | `/api/public/transparencia` | No |
| POST | `/api/averias` | No |
| POST | `/api/solicitudes` | No |
| GET | `/api/seguimiento/{numero}` | No |
| GET/POST | `/api/admin/galeria` | JWT admin |
