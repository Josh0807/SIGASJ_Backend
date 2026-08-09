import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RolUsuario } from '../enums/rol-usuario.enum';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

function resolveJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET no está configurado en el entorno.');
  }

  return 'dev-insecure-jwt-secret';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(configService),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (
      payload?.sub == null ||
      !payload.rol ||
      !Object.values(RolUsuario).includes(payload.rol)
    ) {
      throw new UnauthorizedException('Token inválido.');
    }

    return {
      idUsuario: payload.sub,
      rol: payload.rol,
      correoElectronico: payload.correoElectronico,
    };
  }
}
