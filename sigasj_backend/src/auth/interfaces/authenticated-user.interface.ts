import { RolUsuario } from '../enums/rol-usuario.enum';

export interface AuthenticatedUser {
  idUsuario: number;
  rol: RolUsuario;
  correoElectronico?: string;
}
