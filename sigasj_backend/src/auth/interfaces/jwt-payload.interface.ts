import { RolUsuario } from '../enums/rol-usuario.enum';

/**
 * Claims esperados en el JWT de acceso.
 * `sub` = idUsuario (convención JWT).
 */
export interface JwtPayload {
  sub: number;
  rol: RolUsuario;
  correoElectronico?: string;
}
