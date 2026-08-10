import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../auth/decorators/roles.decorator';
import { RolUsuario } from '../../../auth/enums/rol-usuario.enum';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { AdminComunicadosController } from './admin-comunicados.controller';
import { PublicComunicadosController } from './public-comunicados.controller';

describe('Comunicados — seguridad administrativa', () => {
  it('protege AdminComunicadosController con JwtAuthGuard + RolesGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AdminComunicadosController,
    ) as unknown[];

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(guards).toHaveLength(2);
  });

  it('autoriza solo Administradora y Secretaria Ejecutiva en el controlador admin', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      AdminComunicadosController,
    ) as RolUsuario[];

    expect(roles).toEqual([
      RolUsuario.ADMINISTRADORA,
      RolUsuario.SECRETARIA_EJECUTIVA,
    ]);
    expect(roles).not.toContain(RolUsuario.FONTANERO);
    expect(roles).not.toContain(RolUsuario.ABONADO);
  });

  it('no aplica guards al endpoint público', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PublicComunicadosController,
    );

    expect(guards ?? []).toEqual([]);
  });

  describe('RolesGuard (roles admin de comunicados)', () => {
    const required = [
      RolUsuario.ADMINISTRADORA,
      RolUsuario.SECRETARIA_EJECUTIVA,
    ];

    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required);
    });

    function contextWithRol(rol?: RolUsuario) {
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () =>
            rol ? { user: { idUsuario: 1, rol } } : { user: { idUsuario: 1 } },
        }),
      } as never;
    }

    it.each([RolUsuario.ADMINISTRADORA, RolUsuario.SECRETARIA_EJECUTIVA])(
      'permite %s',
      (rol) => {
        expect(guard.canActivate(contextWithRol(rol))).toBe(true);
      },
    );

    it.each([RolUsuario.FONTANERO, RolUsuario.ABONADO])(
      'deniega %s con 403',
      (rol) => {
        expect(() => guard.canActivate(contextWithRol(rol))).toThrow(
          ForbiddenException,
        );
      },
    );

    it('deniega usuario autenticado sin rol válido con 403', () => {
      expect(() => guard.canActivate(contextWithRol(undefined))).toThrow(
        ForbiddenException,
      );
    });
  });
});
