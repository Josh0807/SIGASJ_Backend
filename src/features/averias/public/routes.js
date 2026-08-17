import { Router } from 'express';
import { badRequest, notFound } from '../../../shared/errors.js';
import { esCorreoValido, textoRequerido } from '../../../shared/utils/helpers.js';
import {
  crearAveria,
  listarAverias,
  obtenerAveriaPorNumero,
} from '../api/averiaService.js';

const router = Router();

function validarCrearAveria(body) {
  const errors = {};
  if (!textoRequerido(body.nombre)) errors.nombre = ['El nombre completo es obligatorio.'];
  if (!textoRequerido(body.telefono)) errors.telefono = ['El telefono es obligatorio.'];
  if (!textoRequerido(body.direccion)) errors.direccion = ['La ubicacion de la averia es obligatoria.'];
  if (!textoRequerido(body.tipo)) errors.tipo = ['Seleccione el tipo de averia.'];
  if (!textoRequerido(body.descripcion)) errors.descripcion = ['La descripcion del problema es obligatoria.'];
  if (body.correo && !esCorreoValido(body.correo)) {
    errors.correo = ['Ingrese un correo electronico valido.'];
  }
  if (Object.keys(errors).length) {
    throw badRequest('Datos de entrada invalidos.', errors);
  }
}

router.get('/', (_req, res) => {
  res.json(listarAverias());
});

router.post('/', (req, res) => {
  validarCrearAveria(req.body || {});
  res.status(201).json(crearAveria(req.body));
});

router.get('/:numeroSeguimiento', (req, res) => {
  const averia = obtenerAveriaPorNumero(req.params.numeroSeguimiento);
  if (!averia) {
    throw notFound(`No se encontro el reporte ${req.params.numeroSeguimiento}.`);
  }
  res.json(averia);
});

export default router;
