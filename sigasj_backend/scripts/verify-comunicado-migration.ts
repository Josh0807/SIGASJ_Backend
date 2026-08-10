/**
 * One-off verification for CreateComunicadoTable migration (dev LocalDB).
 * Run: npx ts-node -r tsconfig-paths/register scripts/verify-comunicado-migration.ts
 */
import dataSource from '../src/config/typeorm.data-source';
import { Comunicado } from '../src/LandingPage/comunicados/entities/comunicado.entity';
import { EstadoComunicado } from '../src/LandingPage/comunicados/enums/estado-comunicado.enum';
import { TipoComunicado } from '../src/LandingPage/comunicados/enums/tipo-comunicado.enum';
import { Usuario } from '../src/usuarios/entities/usuario.entity';

type Col = {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
};

async function main() {
  // LocalDB can be slow after idle; raise request timeout for catalog/DML checks.
  const opts = dataSource.options as { requestTimeout?: number; options?: Record<string, unknown> };
  opts.requestTimeout = 60000;
  if (opts.options) opts.options.requestTimeout = 60000;

  await dataSource.initialize();
  const results: string[] = [];
  const fail = (msg: string) => {
    results.push(`FAIL: ${msg}`);
  };
  const ok = (msg: string) => {
    results.push(`OK: ${msg}`);
  };

  try {
    // --- Schema: columns ---
    const cols: Col[] = await dataSource.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Comunicado'
      ORDER BY ORDINAL_POSITION
    `);

    if (cols.length === 0) {
      fail('Tabla Comunicado no existe');
      console.log(results.join('\n'));
      process.exitCode = 1;
      return;
    }
    ok(`Tabla Comunicado existe (${cols.length} columnas)`);

    const byName = Object.fromEntries(cols.map((c) => [c.COLUMN_NAME, c]));
    const expectCol = (
      name: string,
      type: string,
      nullable: 'YES' | 'NO',
      maxLen?: number | null,
    ) => {
      const c = byName[name];
      if (!c) {
        fail(`Columna faltante: ${name}`);
        return;
      }
      if (c.DATA_TYPE !== type) {
        fail(`${name}: tipo ${c.DATA_TYPE} (esperado ${type})`);
      } else if (c.IS_NULLABLE !== nullable) {
        fail(`${name}: nullable ${c.IS_NULLABLE} (esperado ${nullable})`);
      } else if (
        maxLen !== undefined &&
        maxLen !== null &&
        c.CHARACTER_MAXIMUM_LENGTH !== maxLen &&
        !(maxLen === -1 && c.CHARACTER_MAXIMUM_LENGTH === -1)
      ) {
        // nvarchar(max) reports -1
        fail(
          `${name}: length ${c.CHARACTER_MAXIMUM_LENGTH} (esperado ${maxLen})`,
        );
      } else {
        ok(
          `${name}: ${c.DATA_TYPE}${maxLen != null ? `(${maxLen === -1 ? 'max' : maxLen})` : ''} nullable=${c.IS_NULLABLE}`,
        );
      }
    };

    expectCol('idComunicado', 'int', 'NO');
    expectCol('titulo', 'nvarchar', 'NO', 200);
    expectCol('descripcionBreve', 'nvarchar', 'NO', 500);
    expectCol('contenido', 'nvarchar', 'YES', -1);
    expectCol('tipoComunicado', 'nvarchar', 'NO', 80);
    expectCol('fechaPublicacion', 'date', 'NO');
    expectCol('fechaInicioVisibilidad', 'date', 'NO');
    expectCol('fechaVencimiento', 'date', 'YES');
    expectCol('estado', 'nvarchar', 'NO', 20);
    expectCol('imagenUrl', 'nvarchar', 'YES', 2048);
    expectCol('idUsuarioCreador', 'int', 'NO');
    expectCol('idUsuarioModificador', 'int', 'YES');
    expectCol('fechaCreacion', 'datetime2', 'NO');
    expectCol('fechaActualizacion', 'datetime2', 'NO');

    if (
      byName.fechaCreacion?.COLUMN_DEFAULT?.toLowerCase().includes('getdate') ||
      byName.fechaCreacion?.COLUMN_DEFAULT?.includes('SYSUTCDATETIME')
    ) {
      ok(`fechaCreacion default: ${byName.fechaCreacion.COLUMN_DEFAULT}`);
    } else {
      fail(
        `fechaCreacion default inesperado: ${byName.fechaCreacion?.COLUMN_DEFAULT}`,
      );
    }
    if (
      byName.fechaActualizacion?.COLUMN_DEFAULT?.toLowerCase().includes(
        'getdate',
      ) ||
      byName.fechaActualizacion?.COLUMN_DEFAULT?.includes('SYSUTCDATETIME')
    ) {
      ok(
        `fechaActualizacion default: ${byName.fechaActualizacion.COLUMN_DEFAULT}`,
      );
    } else {
      fail(
        `fechaActualizacion default inesperado: ${byName.fechaActualizacion?.COLUMN_DEFAULT}`,
      );
    }

    // PK
    const pks = await dataSource.query(`
      SELECT kcu.COLUMN_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
       AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
      WHERE tc.TABLE_SCHEMA = 'dbo' AND tc.TABLE_NAME = 'Comunicado'
        AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    `);
    if (pks.length === 1 && pks[0].COLUMN_NAME === 'idComunicado') {
      ok('PK: idComunicado');
    } else {
      fail(`PK inesperada: ${JSON.stringify(pks)}`);
    }

    // FKs
    const fks = await dataSource.query(`
      SELECT
        fk.name AS fk_name,
        col.name AS column_name,
        ref.name AS referenced_table,
        refcol.name AS referenced_column,
        fk.delete_referential_action_desc AS on_delete
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
      INNER JOIN sys.tables t ON t.object_id = fk.parent_object_id
      INNER JOIN sys.columns col ON col.object_id = fkc.parent_object_id AND col.column_id = fkc.parent_column_id
      INNER JOIN sys.tables ref ON ref.object_id = fk.referenced_object_id
      INNER JOIN sys.columns refcol ON refcol.object_id = fkc.referenced_object_id AND refcol.column_id = fkc.referenced_column_id
      WHERE t.name = 'Comunicado'
      ORDER BY fk.name
    `);

    const fkCreador = fks.find(
      (f: { column_name: string }) => f.column_name === 'idUsuarioCreador',
    );
    const fkMod = fks.find(
      (f: { column_name: string }) => f.column_name === 'idUsuarioModificador',
    );

    if (
      fkCreador &&
      fkCreador.referenced_table === 'Usuario' &&
      fkCreador.referenced_column === 'idUsuario' &&
      fkCreador.on_delete === 'NO_ACTION'
    ) {
      ok(
        `FK creador: ${fkCreador.fk_name} → Usuario.idUsuario (${fkCreador.on_delete})`,
      );
    } else {
      fail(`FK creador inválida: ${JSON.stringify(fkCreador)}`);
    }

    if (
      fkMod &&
      fkMod.referenced_table === 'Usuario' &&
      fkMod.referenced_column === 'idUsuario' &&
      fkMod.on_delete === 'NO_ACTION'
    ) {
      ok(
        `FK modificador: ${fkMod.fk_name} → Usuario.idUsuario (${fkMod.on_delete})`,
      );
    } else {
      fail(`FK modificador inválida: ${JSON.stringify(fkMod)}`);
    }

    // Index via OBJECT_ID (catalog joins without OBJECT_ID timed out on LocalDB)
    const indexCols = await dataSource.query(`
      SELECT COL_NAME(ic.object_id, ic.column_id) AS column_name, ic.key_ordinal
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic
        ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      WHERE i.object_id = OBJECT_ID(N'dbo.Comunicado')
        AND i.name = N'IX_Comunicado_PublicVisibility'
      ORDER BY ic.key_ordinal
    `);
    const indexColNames = indexCols.map(
      (r: { column_name: string }) => r.column_name,
    );
    if (
      indexColNames.length === 3 &&
      indexColNames[0] === 'estado' &&
      indexColNames[1] === 'fechaInicioVisibilidad' &&
      indexColNames[2] === 'fechaVencimiento'
    ) {
      ok(`Índice: IX_Comunicado_PublicVisibility (${indexColNames.join(', ')})`);
    } else {
      fail(
        `Índice IX_Comunicado_PublicVisibility: ${JSON.stringify(indexColNames)}`,
      );
    }

    // --- Data tests (isolated rows; cleaned up at end) ---
    const insertedUsuarioIds: number[] = [];
    const insertedComunicadoIds: number[] = [];

    try {
      const usuarioRepo = dataSource.getRepository(Usuario);
      const usuario = await usuarioRepo.save(usuarioRepo.create({}));
      const idUsuario = usuario.idUsuario;
      insertedUsuarioIds.push(idUsuario);
      ok(`Usuario de prueba idUsuario=${idUsuario}`);

      const repo = dataSource.getRepository(Comunicado);

      // Valid comunicado (sin modificador, sin imagen, sin vencimiento)
      // Solo FKs escalares: stubs de relación hacen que TypeORM 1.x trate save() como INSERT.
      const created = new Comunicado();
      created.titulo = 'Verificación migración';
      created.descripcionBreve = 'Prueba básica Parte 8';
      created.contenido = null;
      created.tipoComunicado = TipoComunicado.AVISO_GENERAL;
      created.fechaPublicacion = new Date('2026-08-08');
      created.fechaInicioVisibilidad = new Date('2026-08-08');
      created.fechaVencimiento = null;
      created.estado = EstadoComunicado.ACTIVO;
      created.imagenUrl = null;
      created.idUsuarioCreador = idUsuario;
      created.idUsuarioModificador = null;

      const saved: Comunicado = await repo.save(created);
      insertedComunicadoIds.push(saved.idComunicado);

      if (saved.idComunicado > 0)
        ok(`Insert válido idComunicado=${saved.idComunicado}`);
      else fail('Insert válido no generó id');

      if (saved.idUsuarioModificador == null)
        ok('idUsuarioModificador = NULL permitido');
      else fail('idUsuarioModificador debería ser NULL');

      if (saved.imagenUrl == null) ok('imagenUrl = NULL permitido');
      else fail('imagenUrl debería ser NULL');

      if (saved.fechaVencimiento == null) ok('fechaVencimiento = NULL permitido');
      else fail('fechaVencimiento debería ser NULL');

      if (saved.fechaCreacion)
        ok(`fechaCreacion generada: ${saved.fechaCreacion}`);
      else fail('fechaCreacion no generada');

      if (saved.fechaActualizacion)
        ok(`fechaActualizacion generada: ${saved.fechaActualizacion}`);
      else fail('fechaActualizacion no generada');

      const beforeRow = await dataSource.query(
        `SELECT fechaCreacion, fechaActualizacion FROM dbo.Comunicado WHERE idComunicado = @0`,
        [saved.idComunicado],
      );
      const creacion1 = new Date(beforeRow[0].fechaCreacion).getTime();
      const actualizacion1 = new Date(beforeRow[0].fechaActualizacion).getTime();

      await new Promise((r) => setTimeout(r, 1100));

      const toUpdate = await repo.findOneByOrFail({
        idComunicado: saved.idComunicado,
      });
      toUpdate.titulo = 'Verificación migración (actualizado)';
      const updated: Comunicado = await repo.save(toUpdate);

      const afterRow = await dataSource.query(
        `SELECT fechaCreacion, fechaActualizacion FROM dbo.Comunicado WHERE idComunicado = @0`,
        [updated.idComunicado],
      );
      const creacion2 = new Date(afterRow[0].fechaCreacion).getTime();
      const actualizacion2 = new Date(afterRow[0].fechaActualizacion).getTime();

      if (actualizacion2 > actualizacion1) {
        ok(
          `fechaActualizacion cambió vía TypeORM (${beforeRow[0].fechaActualizacion} → ${afterRow[0].fechaActualizacion})`,
        );
      } else {
        fail(
          `fechaActualizacion no cambió tras update: before=${beforeRow[0].fechaActualizacion} after=${afterRow[0].fechaActualizacion}`,
        );
      }

      if (Math.abs(creacion2 - creacion1) < 5000) {
        ok('fechaCreacion se mantiene tras update');
      } else {
        fail('fechaCreacion cambió inesperadamente tras update');
      }

      // Invalid creator FK
      try {
        const invalidCreator = new Comunicado();
        invalidCreator.titulo = 'FK inválida creador';
        invalidCreator.descripcionBreve = 'debe fallar';
        invalidCreator.tipoComunicado = TipoComunicado.AVISO_GENERAL;
        invalidCreator.fechaPublicacion = new Date('2026-08-08');
        invalidCreator.fechaInicioVisibilidad = new Date('2026-08-08');
        invalidCreator.estado = EstadoComunicado.ACTIVO;
        invalidCreator.idUsuarioCreador = 999999001;
        invalidCreator.idUsuarioModificador = null;
        await repo.save(invalidCreator);
        fail('FK creador inexistente NO fue rechazada');
      } catch {
        ok('FK rechaza idUsuarioCreador inexistente');
      }

      // Invalid modifier FK
      try {
        const invalidModifier = new Comunicado();
        invalidModifier.titulo = 'FK inválida modificador';
        invalidModifier.descripcionBreve = 'debe fallar';
        invalidModifier.tipoComunicado = TipoComunicado.AVISO_GENERAL;
        invalidModifier.fechaPublicacion = new Date('2026-08-08');
        invalidModifier.fechaInicioVisibilidad = new Date('2026-08-08');
        invalidModifier.estado = EstadoComunicado.ACTIVO;
        invalidModifier.idUsuarioCreador = idUsuario;
        invalidModifier.idUsuarioModificador = 999999002;
        await repo.save(invalidModifier);
        fail('FK modificador inexistente NO fue rechazada');
      } catch {
        ok('FK rechaza idUsuarioModificador inexistente');
      }
    } finally {
      // Cleanup only rows created by this script
      if (insertedComunicadoIds.length) {
        await dataSource.query(
          `DELETE FROM [dbo].[Comunicado] WHERE idComunicado IN (${insertedComunicadoIds.join(',')})`,
        );
        ok(`Limpieza Comunicado: ${insertedComunicadoIds.join(',')}`);
      }
      if (insertedUsuarioIds.length) {
        await dataSource.query(
          `DELETE FROM [dbo].[Usuario] WHERE idUsuario IN (${insertedUsuarioIds.join(',')})`,
        );
        ok(`Limpieza Usuario: ${insertedUsuarioIds.join(',')}`);
      }
    }
  } finally {
    await dataSource.destroy();
  }

  console.log('\n=== Verificación Parte 8 ===\n');
  console.log(results.join('\n'));
  const failed = results.filter((r) => r.startsWith('FAIL'));
  console.log(
    `\nResumen: ${results.length - failed.length} OK, ${failed.length} FAIL\n`,
  );
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
