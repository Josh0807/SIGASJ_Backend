import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../auth/decorators/roles.decorator';
import { RolUsuario } from '../../../auth/enums/rol-usuario.enum';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { AdminGaleriaController } from './admin-galeria.controller';
import { PublicGaleriaController } from './public-galeria.controller';

describe('Galería — seguridad administrativa', () => {
  it('protege AdminGaleriaController con JwtAuthGuard + RolesGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AdminGaleriaController,
    ) as unknown[];

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(guards).toHaveLength(2);
  });

  it('autoriza solo Administradora y Secretaria Ejecutiva', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      AdminGaleriaController,
    ) as RolUsuario[];

    expect(roles).toEqual([
      RolUsuario.ADMINISTRADORA,
      RolUsuario.SECRETARIA_EJECUTIVA,
    ]);
  });

  it('no aplica guards al endpoint público de galería', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PublicGaleriaController,
    );

    expect(guards ?? []).toEqual([]);
  });

  describe('RolesGuard (roles admin de galería)', () => {
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
  });
});
