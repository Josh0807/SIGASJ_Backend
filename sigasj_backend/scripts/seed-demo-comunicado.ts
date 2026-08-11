/**
 * Inserta un comunicado demo vigente para verlo en la Landing.
 * Run: npx ts-node -r tsconfig-paths/register scripts/seed-demo-comunicado.ts
 */
import dataSource from '../src/config/typeorm.data-source';
import { Comunicado } from '../src/comunicados/entities/comunicado.entity';
import { EstadoComunicado } from '../src/comunicados/enums/estado-comunicado.enum';
import { TipoComunicado } from '../src/comunicados/enums/tipo-comunicado.enum';
import { Usuario } from '../src/usuarios/entities/usuario.entity';

async function main() {
  const opts = dataSource.options as {
    requestTimeout?: number;
    options?: Record<string, unknown>;
  };
  opts.requestTimeout = 60000;
  if (opts.options) {
    opts.options.requestTimeout = 60000;
  }

  await dataSource.initialize();

  try {
    const usuarioRepo = dataSource.getRepository(Usuario);
    let usuario = await usuarioRepo.findOne({
      where: { correoElectronico: 'demo.admin@sigasj.local' },
    });

    if (!usuario) {
      usuario = await usuarioRepo.save(
        usuarioRepo.create({
          nombreCompleto: 'Demo Administradora',
          correoElectronico: 'demo.admin@sigasj.local',
          passwordHash: 'demo-not-for-login',
          isActive: true,
          tokenVersion: 0,
        }),
      );
      console.log(`Usuario demo creado id=${usuario.idUsuario}`);
    } else {
      console.log(`Usuario demo existente id=${usuario.idUsuario}`);
    }

    const comunicadoRepo = dataSource.getRepository(Comunicado);
    const titulo = 'Aviso demo SIGASJ (Landing)';
    let comunicado = await comunicadoRepo.findOne({ where: { titulo } });

    const today = new Date();
    const past = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const future = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (!comunicado) {
      comunicado = await comunicadoRepo.save(
        comunicadoRepo.create({
          titulo,
          descripcionBreve:
            'Comunicado de prueba creado desde el backend para validar la Landing.',
          contenido:
            'Si ves este aviso en Comunicados, el API público y el Front-end están conectados.',
          tipoComunicado: TipoComunicado.AVISO_GENERAL,
          fechaPublicacion: past,
          fechaInicioVisibilidad: past,
          fechaVencimiento: future,
          estado: EstadoComunicado.ACTIVO,
          imagenUrl: null,
          idUsuarioCreador: usuario.idUsuario,
          idUsuarioModificador: null,
        }),
      );
      console.log(`Comunicado creado id=${comunicado.idComunicado}`);
    } else {
      comunicado.estado = EstadoComunicado.ACTIVO;
      comunicado.fechaInicioVisibilidad = past;
      comunicado.fechaVencimiento = future;
      comunicado.descripcionBreve =
        'Comunicado de prueba creado desde el backend para validar la Landing.';
      await comunicadoRepo.save(comunicado);
      console.log(`Comunicado actualizado id=${comunicado.idComunicado}`);
    }

    console.log('Listo. GET http://localhost:3000/api/public/comunicados');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
