import { Router } from 'express';
import { badRequest, notFound } from '../../../shared/errors.js';
import { textoRequerido } from '../../../shared/utils/helpers.js';
import { consultarSeguimiento } from '../api/seguimientoService.js';

const router = Router();

router.get('/:numeroSeguimiento', (req, res) => {
  const numero = textoRequerido(req.params.numeroSeguimiento);
  if (!numero) {
    throw badRequest('Ingrese un numero de seguimiento para realizar la consulta.');
  }

  const resultado = consultarSeguimiento(numero);
  if (!resultado) {
    throw notFound(`No se encontro un tramite con el numero ${numero.toUpperCase()}.`);
  }
  res.json(resultado);
});

export default router;
