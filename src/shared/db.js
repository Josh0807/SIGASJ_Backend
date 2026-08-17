import fs from 'node:fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { Roles } from './utils/constants.js';

export const db = new Database(config.databasePath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS Usuarios (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    NombreUsuario TEXT NOT NULL UNIQUE,
    ContrasenaHash TEXT NOT NULL,
    Rol TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS SecuenciasContador (
    Prefijo TEXT PRIMARY KEY,
    UltimoValor INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS Averias (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    NumeroSeguimiento TEXT NOT NULL UNIQUE,
    Nombre TEXT NOT NULL,
    Telefono TEXT NOT NULL,
    Correo TEXT,
    Direccion TEXT NOT NULL,
    Tipo TEXT NOT NULL,
    Descripcion TEXT NOT NULL,
    Estado TEXT NOT NULL DEFAULT 'Pendiente',
    Prioridad TEXT NOT NULL DEFAULT 'Media',
    FechaCreacion TEXT NOT NULL,
    FotoNombre TEXT,
    FotoBase64 TEXT,
    FontaneroAsignadoId INTEGER,
    NotasAtencion TEXT,
    ObservacionesAdmin TEXT,
    DescripcionTrabajo TEXT,
    MaterialesUtilizados TEXT,
    EvidenciaTrabajoNombre TEXT,
    EvidenciaTrabajoBase64 TEXT,
    FechaUltimaActualizacion TEXT,
    FOREIGN KEY (FontaneroAsignadoId) REFERENCES Usuarios(Id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS AveriasHistorial (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AveriaId INTEGER NOT NULL,
    Accion TEXT NOT NULL,
    ValorAnterior TEXT,
    ValorNuevo TEXT,
    Usuario TEXT,
    Fecha TEXT NOT NULL,
    FOREIGN KEY (AveriaId) REFERENCES Averias(Id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Solicitudes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    NumeroSeguimiento TEXT NOT NULL UNIQUE,
    Nombre TEXT NOT NULL,
    Cedula TEXT NOT NULL,
    Telefono TEXT NOT NULL,
    Correo TEXT NOT NULL,
    Direccion TEXT NOT NULL,
    Tipo TEXT NOT NULL,
    Descripcion TEXT NOT NULL,
    Estado TEXT NOT NULL DEFAULT 'En revision',
    FechaCreacion TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ActividadesPlomeria (
    Id TEXT PRIMARY KEY,
    Tipo TEXT NOT NULL,
    Cliente TEXT NOT NULL,
    Ubicacion TEXT NOT NULL,
    Descripcion TEXT NOT NULL,
    Estado TEXT NOT NULL DEFAULT 'Pendiente',
    Prioridad TEXT NOT NULL DEFAULT 'Media',
    NotasSeguimiento TEXT,
    NumeroAveriaVinculada TEXT,
    FechaCreacion TEXT NOT NULL,
    FechaActualizacion TEXT
  );

  CREATE TABLE IF NOT EXISTS LecturasMedidor (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    NombreAbonado TEXT NOT NULL,
    NumeroMedidor TEXT NOT NULL,
    CedulaAbonado TEXT,
    LecturaAnterior REAL NOT NULL,
    LecturaActual REAL NOT NULL,
    Consumo REAL NOT NULL,
    ConsumoMesAnterior REAL,
    FechaLectura TEXT NOT NULL,
    Observaciones TEXT,
    Estado TEXT NOT NULL DEFAULT 'Pendiente',
    FontaneroId INTEGER NOT NULL,
    FechaRegistro TEXT NOT NULL,
    FOREIGN KEY (FontaneroId) REFERENCES Usuarios(Id)
  );

  CREATE TABLE IF NOT EXISTS ActividadesFontanero (
    Id TEXT PRIMARY KEY,
    FontaneroId INTEGER NOT NULL,
    FechaActividad TEXT NOT NULL,
    HoraInicio TEXT,
    HoraFin TEXT,
    Tipo TEXT NOT NULL,
    Descripcion TEXT NOT NULL,
    Ubicacion TEXT NOT NULL,
    NumeroAveriaVinculada TEXT,
    LecturaMedidorId INTEGER,
    MaterialesUtilizados TEXT,
    Observaciones TEXT,
    Estado TEXT NOT NULL DEFAULT 'Pendiente',
    EstadoValidacion TEXT NOT NULL DEFAULT 'Pendiente',
    ObservacionValidacion TEXT,
    FechaCreacion TEXT NOT NULL,
    FechaActualizacion TEXT,
    FOREIGN KEY (FontaneroId) REFERENCES Usuarios(Id),
    FOREIGN KEY (LecturaMedidorId) REFERENCES LecturasMedidor(Id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS Comunicados (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Fecha TEXT NOT NULL,
    Titulo TEXT NOT NULL,
    Descripcion TEXT NOT NULL,
    Estado TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Proyectos (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Titulo TEXT NOT NULL,
    Descripcion TEXT NOT NULL,
    Estado TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS GaleriaFotos (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Titulo TEXT,
    Descripcion TEXT,
    ImagenUrl TEXT NOT NULL,
    TextoAlternativo TEXT NOT NULL,
    OrdenVisualizacion INTEGER NOT NULL DEFAULT 0,
    Activo INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS PublicacionesTransparencia (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre TEXT NOT NULL,
    DescripcionBreve TEXT NOT NULL,
    ArchivoUrl TEXT NOT NULL,
    TipoArchivo TEXT NOT NULL,
    OrdenVisualizacion INTEGER NOT NULL DEFAULT 0,
    Activo INTEGER NOT NULL DEFAULT 1
  );
`);

function ensureUser(nombreUsuario, contrasena, rol) {
  const existing = db.prepare('SELECT Id FROM Usuarios WHERE NombreUsuario = ?').get(nombreUsuario);
  if (existing) return;
  db.prepare(
    'INSERT INTO Usuarios (NombreUsuario, ContrasenaHash, Rol) VALUES (?, ?, ?)',
  ).run(nombreUsuario, bcrypt.hashSync(contrasena, 10), rol);
}

function ensureSecuencia(prefijo) {
  db.prepare(
    'INSERT OR IGNORE INTO SecuenciasContador (Prefijo, UltimoValor) VALUES (?, 0)',
  ).run(prefijo);
}

export function seedDatabase() {
  ensureSecuencia('AV');
  ensureSecuencia('SOL');
  ensureUser(config.admin.usuario, config.admin.contrasena, Roles.Admin);
  ensureUser('fontanero', 'fontanero1234', Roles.Fontanero);

  const comunicadosCount = db.prepare('SELECT COUNT(*) AS total FROM Comunicados').get().total;
  if (comunicadosCount === 0) {
    const insert = db.prepare(
      'INSERT INTO Comunicados (Fecha, Titulo, Descripcion, Estado) VALUES (?, ?, ?, ?)',
    );
    insert.run(
      '20 mayo 2026',
      'Aviso de mantenimiento programado',
      'Revision preventiva de valvulas y lineas principales durante la manana.',
      'Programado',
    );
    insert.run(
      '18 mayo 2026',
      'Interrupcion temporal del servicio',
      'Corte temporal por reparacion de tuberia en el sector central.',
      'Informativo',
    );
    insert.run(
      '15 mayo 2026',
      'Uso responsable del agua',
      'Se recomienda evitar desperdicios y reportar fugas visibles oportunamente.',
      'Recomendacion',
    );
  }

  const proyectosCount = db.prepare('SELECT COUNT(*) AS total FROM Proyectos').get().total;
  if (proyectosCount === 0) {
    const insert = db.prepare(
      'INSERT INTO Proyectos (Titulo, Descripcion, Estado) VALUES (?, ?, ?)',
    );
    insert.run(
      'Mejora de redes de distribucion',
      'Sustitucion progresiva de tuberias antiguas en sectores prioritarios.',
      'Planificado',
    );
    insert.run(
      'Nuevos tanques de almacenamiento',
      'Evaluacion tecnica para aumentar la capacidad de reserva comunal.',
      'En estudio',
    );
    insert.run(
      'Colocacion de hidrantes',
      'Instalacion en puntos estrategicos para fortalecer la respuesta local.',
      'Gestion',
    );
    insert.run(
      'Expansion y mejora del acueducto',
      'Analisis de crecimiento de demanda y futuras ampliaciones del sistema.',
      'Futuro',
    );
  }

  fs.mkdirSync(config.uploadsDir, { recursive: true });
  fs.mkdirSync(`${config.uploadsDir}/galeria`, { recursive: true });
  fs.mkdirSync(`${config.uploadsDir}/transparencia`, { recursive: true });
}
