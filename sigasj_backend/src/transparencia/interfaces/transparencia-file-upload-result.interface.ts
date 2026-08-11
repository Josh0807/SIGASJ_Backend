import type { TipoArchivoTransparencia } from '../enums/tipo-archivo-transparencia.enum';

export interface TransparenciaFileUploadResult {
  archivoUrl: string;
  fileName: string;
  tipoArchivo: TipoArchivoTransparencia;
}
