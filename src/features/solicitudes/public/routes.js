import { Router } from 'express';
import { badRequest } from '../../../shared/errors.js';
import { esCorreoValido, textoRequerido } from '../../../shared/utils/helpers.js';
import { crearSolicitud } from '../api/solicitudService.js';

const router = Router();

router.post('/', (req, res) => {
  const body = req.body || {};
  const errors = {};
  if (!textoRequerido(body.nombre)) errors.nombre = ['El nombre completo es obligatorio.'];
  if (!textoRequerido(body.cedula)) errors.cedula = ['La cedula es obligatoria.'];
  if (!textoRequerido(body.telefono)) errors.telefono = ['El telefono es obligatorio.'];
  if (!textoRequerido(body.correo)) errors.correo = ['El correo electronico es obligatorio.'];
  else if (!esCorreoValido(body.correo)) errors.correo = ['Ingrese un correo electronico valido.'];
  if (!textoRequerido(body.direccion)) errors.direccion = ['La direccion es obligatoria.'];
  if (!textoRequerido(body.tipo)) errors.tipo = ['Seleccione el tipo de solicitud.'];
  if (!textoRequerido(body.descripcion)) errors.descripcion = ['Agregue el detalle de la solicitud.'];
  if (Object.keys(errors).length) {
    throw badRequest('Datos de entrada invalidos.', errors);
  }

  res.json(crearSolicitud(body));
});

export default router;
