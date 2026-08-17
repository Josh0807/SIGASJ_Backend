import { formatearFecha } from '../../../shared/utils/helpers.js';

export function toGaleriaResponse(foto) {
  return {
    id: foto.Id,
    idFotografiaGaleria: foto.Id,
    titulo: foto.Titulo,
    descripcion: foto.Descripcion,
    imagenUrl: foto.ImagenUrl,
    textoAlternativo: foto.TextoAlternativo,
    ordenVisualizacion: foto.OrdenVisualizacion,
    activo: Boolean(foto.Activo),
  };
}
