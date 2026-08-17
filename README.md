# SIGASJ Backend

API REST del portal SIGASJ. En la raíz hay un backend **Node.js + Express + SQLite** (rama `Wuipy`). El NestJS + SQL Server LocalDB sigue en `sigasj_backend/`.

## Express (raíz del repo)

```powershell
cp .env.example .env
npm.cmd install
npm.cmd run dev
```

La API queda en `http://localhost:3000`. Credenciales: `admin` / `admin1234`.

## Base de datos (LocalDB)

- Servidor: `(localdb)\MSSQLLocalDB`
- Base: **`SIGASJ`** (no usar `master`)
- Auth: Windows

En Azure Data Studio: conecta a ese servidor y selecciona la base **SIGASJ**.

Migraciones:
```powershell
cd sigasj_backend
npm.cmd run migration:run
```

## Visual Studio (botón verde)

1. Abre **`SIGASJ_Backend.sln`**.
2. Clic derecho en **sigasj_backend** → **Set as Startup Project**.
3. En el desplegable del botón verde elige **`Swagger (Nest start:dev)`** (o `sigasj_backend`).
4. Pulsa Start / F5.

Swagger: http://localhost:3000/docs/

### Si sigue fallando
- Instala la workload **Node.js development** en Visual Studio Installer.
- Confirma Node: `node -v` debe mostrar v22.x (usar nvm: `nvm use 22`)
- Como alternativa segura, usa la terminal:

```powershell
cd sigasj_backend
.\start-vs.cmd
```

## Node.js

Usar **Node 22 LTS** (misma versión que el equipo):

```powershell
nvm use 22
node -v
```

## Terminal
```powershell
cd sigasj_backend
npm.cmd run start:dev
```

## Cursor / VS Code
Run and Debug → **SIGASJ Backend (Swagger)**
