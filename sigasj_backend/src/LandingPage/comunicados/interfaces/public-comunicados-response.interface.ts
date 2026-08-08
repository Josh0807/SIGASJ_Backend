import type { PublicComunicadoDto } from '../dto/public-comunicado.dto';

/**
 * Respuesta del listado público.
 * No hay interceptor global de envoltura: esta es la única capa `{ data, total }`.
 */
export type PublicComunicadosResponse = {
  data: PublicComunicadoDto[];
  total: number;
};
