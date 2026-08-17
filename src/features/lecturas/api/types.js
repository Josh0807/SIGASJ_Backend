import { formatearFecha } from '../../../shared/utils/helpers.js';

export function toLecturaResponse(lectura) {
  const alerta =
    lectura.ConsumoMesAnterior != null &&
    lectura.ConsumoMesAnterior > 0 &&
    lectura.Consumo > lectura.ConsumoMesAnterior * 2;

  return {
    id: lectura.Id,
    nombreAbonado: lectura.NombreAbonado,
    numeroMedidor: lectura.NumeroMedidor,
    cedulaAbonado: lectura.CedulaAbonado,
    lecturaAnterior: lectura.LecturaAnterior,
    lecturaActual: lectura.LecturaActual,
    consumo: lectura.Consumo,
    consumoMesAnterior: lectura.ConsumoMesAnterior,
    alertaConsumoAlto: Boolean(alerta),
    fechaLectura: formatearFecha(lectura.FechaLectura),
    observaciones: lectura.Observaciones,
    estado: lectura.Estado,
    fontanero: lectura.FontaneroNombre,
    fechaRegistro: formatearFecha(lectura.FechaRegistro),
  };
}
