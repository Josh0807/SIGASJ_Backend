export function toTransparenciaResponse(item) {
  return {
    id: item.Id,
    idPublicacionTransparencia: item.Id,
    nombre: item.Nombre,
    descripcionBreve: item.DescripcionBreve,
    descripcion: item.DescripcionBreve,
    archivoUrl: item.ArchivoUrl,
    tipoArchivo: item.TipoArchivo,
    tipo: item.TipoArchivo,
    ordenVisualizacion: item.OrdenVisualizacion,
    activo: Boolean(item.Activo),
  };
}
